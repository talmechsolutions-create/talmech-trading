import { createHash } from 'crypto';
import { inflateRawSync } from 'zlib';
import { industrialImportModes, IndustrialColumnSuggestion, IndustrialImportMode, IndustrialImportParseResult, IndustrialImportTargetField, IndustrialParsedSheet, IndustrialSheetRow } from './importTypes';

const maxUploadBytes = 8 * 1024 * 1024;
const maxRowsPerSheet = 10000;
const maxColumnsPerSheet = 120;
const analyticsSheetPattern = /dashboard|summary|coverage|control|sources/i;

function sanitizeCell(value: unknown) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .trim()
    .slice(0, 4000);
}

export function neutralizeSpreadsheetFormula(value: string) {
  const text = sanitizeCell(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(neutralizeSpreadsheetFormula(cell));
      cell = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(neutralizeSpreadsheetFormula(cell));
      if (row.some((item) => item)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(neutralizeSpreadsheetFormula(cell));
  if (row.some((item) => item)) rows.push(row);
  return rows;
}

function tableToSheet(name: string, table: string[][]): IndustrialParsedSheet {
  const headers = (table[0] || []).map((header, index) => sanitizeCell(header) || `Column ${index + 1}`).slice(0, maxColumnsPerSheet);
  const rows = table.slice(1, maxRowsPerSheet + 1).map((sourceRow) => {
    const row: IndustrialSheetRow = {};
    headers.forEach((header, index) => {
      row[header] = neutralizeSpreadsheetFormula(sourceRow[index] || '');
    });
    return row;
  });
  return {
    name,
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
    suggestedMode: suggestImportMode(name, headers),
    shouldExclude: analyticsSheetPattern.test(name),
  };
}

function readUInt16(buffer: Buffer, offset: number) {
  return buffer.readUInt16LE(offset);
}

function readUInt32(buffer: Buffer, offset: number) {
  return buffer.readUInt32LE(offset);
}

function readZipEntries(buffer: Buffer) {
  const entries = new Map<string, Buffer>();
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 66000); offset -= 1) {
    if (readUInt32(buffer, offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error('XLSX_ZIP_DIRECTORY_NOT_FOUND');
  const entryCount = readUInt16(buffer, eocd + 10);
  let centralOffset = readUInt32(buffer, eocd + 16);
  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (readUInt32(buffer, centralOffset) !== 0x02014b50) throw new Error('XLSX_ZIP_DIRECTORY_INVALID');
    const method = readUInt16(buffer, centralOffset + 10);
    const compressedSize = readUInt32(buffer, centralOffset + 20);
    const fileNameLength = readUInt16(buffer, centralOffset + 28);
    const extraLength = readUInt16(buffer, centralOffset + 30);
    const commentLength = readUInt16(buffer, centralOffset + 32);
    const localOffset = readUInt32(buffer, centralOffset + 42);
    const fileName = buffer.slice(centralOffset + 46, centralOffset + 46 + fileNameLength).toString('utf8');
    if (readUInt32(buffer, localOffset) !== 0x04034b50) throw new Error('XLSX_ZIP_ENTRY_INVALID');
    const localNameLength = readUInt16(buffer, localOffset + 26);
    const localExtraLength = readUInt16(buffer, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.slice(dataStart, dataStart + compressedSize);
    if (method === 0) entries.set(fileName, compressed);
    else if (method === 8) entries.set(fileName, inflateRawSync(compressed));
    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function xmlDecode(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function attr(tag: string, name: string) {
  return new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1] || '';
}

function parseSharedStrings(xml: string) {
  const strings: string[] = [];
  for (const match of xml.matchAll(/<si\b[\s\S]*?<\/si>/g)) {
    const text = [...match[0].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((item) => xmlDecode(item[1])).join('');
    strings.push(text);
  }
  return strings;
}

function columnIndex(cellRef: string) {
  const letters = (cellRef.match(/[A-Z]+/i)?.[0] || 'A').toUpperCase();
  return letters.split('').reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function parseWorksheet(xml: string, sharedStrings: string[]) {
  const table: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const tag = cellMatch[1];
      const body = cellMatch[2];
      const index = columnIndex(attr(tag, 'r'));
      const type = attr(tag, 't');
      const rawValue = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] || /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(body)?.[1] || '';
      const decoded = xmlDecode(rawValue);
      row[index] = type === 's' ? sharedStrings[Number.parseInt(decoded, 10)] || '' : decoded;
    }
    if (row.some((item) => item)) table.push(row.map((item) => neutralizeSpreadsheetFormula(item || '')));
  }
  return table;
}

async function parseXlsx(fileName: string, buffer: Buffer): Promise<IndustrialParsedSheet[]> {
  const entries = readZipEntries(buffer);
  if (!entries.has('xl/workbook.xml')) throw new Error('XLSX_WORKBOOK_NOT_FOUND');
  const workbook = entries.get('xl/workbook.xml')!.toString('utf8');
  const relationships = entries.get('xl/_rels/workbook.xml.rels')?.toString('utf8') || '';
  const sharedStrings = entries.has('xl/sharedStrings.xml') ? parseSharedStrings(entries.get('xl/sharedStrings.xml')!.toString('utf8')) : [];
  const relTargets = new Map<string, string>();
  for (const match of relationships.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(match[0], 'Id');
    const target = attr(match[0], 'Target');
    if (id && target) relTargets.set(id, target.startsWith('xl/') ? target : `xl/${target.replace(/^\//, '')}`);
  }
  const sheets: IndustrialParsedSheet[] = [];
  for (const match of workbook.matchAll(/<sheet\b[^>]*>/g)) {
    const sheetName = xmlDecode(attr(match[0], 'name')) || fileName;
    const relId = attr(match[0], 'r:id');
    const target = relTargets.get(relId);
    if (!target || !entries.has(target)) continue;
    const table = parseWorksheet(entries.get(target)!.toString('utf8'), sharedStrings);
    if (table.length) sheets.push(tableToSheet(sheetName, table));
  }
  return sheets;
}

export async function parseIndustrialImportFile(input: { fileName: string; mimeType?: string; bytes: Buffer }): Promise<IndustrialImportParseResult> {
  const fileName = sanitizeCell(input.fileName);
  const extension = fileName.toLowerCase().split('.').pop();
  if (!['csv', 'xlsx'].includes(extension || '')) throw new Error('UNSUPPORTED_IMPORT_FILE_TYPE');
  if (input.bytes.length <= 0) throw new Error('EMPTY_IMPORT_FILE');
  if (input.bytes.length > maxUploadBytes) throw new Error('IMPORT_FILE_TOO_LARGE');

  const sha256 = createHash('sha256').update(input.bytes).digest('hex');
  const warnings: string[] = [];
  const fileType = extension as 'csv' | 'xlsx';
  const sheets =
    fileType === 'csv'
      ? [tableToSheet(fileName.replace(/\.csv$/i, '') || 'CSV Upload', parseCsv(input.bytes.toString('utf8')))]
      : await parseXlsx(fileName, input.bytes);

  if (!sheets.length) throw new Error('IMPORT_FILE_HAS_NO_ROWS');
  if (sheets.length > 25) warnings.push('Workbook has more than 25 sheets; review sheet selection carefully.');
  sheets.forEach((sheet) => {
    if (sheet.columnCount > maxColumnsPerSheet) throw new Error('IMPORT_FILE_HAS_TOO_MANY_COLUMNS');
    if (sheet.rowCount > maxRowsPerSheet) warnings.push(`${sheet.name} was capped at ${maxRowsPerSheet} rows for controlled processing.`);
  });

  return { fileName, fileType, sha256, sheets, warnings };
}

function headerKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const mappingRules: Array<[RegExp, IndustrialImportTargetField, IndustrialColumnSuggestion['confidence']]> = [
  [/\b(company plant name|company plant|company name|company)\b/, 'companyName', 'HIGH'],
  [/\blegal name\b/, 'legalName', 'HIGH'],
  [/\b(official website|website)\b/, 'officialWebsite', 'HIGH'],
  [/\bgstin\b/, 'gstin', 'HIGH'],
  [/\bpan\b/, 'pan', 'HIGH'],
  [/\b(plant unit|plant name|plant\/unit)\b/, 'plantName', 'MEDIUM'],
  [/\b(plant address|address)\b/, 'plantAddress', 'HIGH'],
  [/\bstate\b/, 'state', 'HIGH'],
  [/\b(city cluster|city|cluster)\b/, 'city', 'MEDIUM'],
  [/\bdistrict\b/, 'district', 'HIGH'],
  [/\b(industrial area|industrial estate)\b/, 'industrialArea', 'HIGH'],
  [/\b(pin code|pincode|pin)\b/, 'pincode', 'HIGH'],
  [/\bplant type\b/, 'plantType', 'HIGH'],
  [/\b(public contact person|contact person)\b/, 'contactPerson', 'HIGH'],
  [/\b(designation|contact type)\b/, 'designation', 'HIGH'],
  [/\bdepartment\b/, 'department', 'HIGH'],
  [/\b(public phone|phone|mobile)\b/, 'phone', 'HIGH'],
  [/\bwhatsapp\b/, 'whatsapp', 'HIGH'],
  [/\b(public business email|public email|email)\b/, 'email', 'HIGH'],
  [/\b(forging type products|products processes|processes capability|process product evidence|process|capability)\b/, 'processes', 'HIGH'],
  [/\b(products components|products|grades standards)\b/, 'products', 'MEDIUM'],
  [/\b(capacity scale|monthly capacity|capacity)\b/, 'capacity', 'HIGH'],
  [/\bmpi potential\b/, 'mpiPotential', 'HIGH'],
  [/\bvisual inspection potential\b/, 'visualInspectionPotential', 'HIGH'],
  [/\bgrinding fettling potential\b/, 'grindingFettlingPotential', 'HIGH'],
  [/\boiling packing potential\b/, 'oilingPackingPotential', 'HIGH'],
  [/\bmanaged manpower potential\b/, 'managedManpowerPotential', 'HIGH'],
  [/\bopportunity score\b/, 'opportunityScore', 'HIGH'],
  [/\bpriority\b/, 'priority', 'HIGH'],
  [/\bverification status\b/, 'verificationStatus', 'HIGH'],
  [/\bcontact verification\b/, 'contactVerification', 'HIGH'],
  [/\bresearch status\b/, 'researchStatus', 'HIGH'],
  [/\bsource type\b/, 'sourceType', 'HIGH'],
  [/\bprimary source url\b/, 'primarySourceUrl', 'HIGH'],
  [/\bsecondary source url\b/, 'secondarySourceUrl', 'HIGH'],
  [/\bresearch date\b/, 'researchDate', 'HIGH'],
  [/\b(notes next action|notes)\b/, 'notes', 'HIGH'],
];

export function suggestColumnMapping(headers: string[]): IndustrialColumnSuggestion[] {
  return headers.map((sourceColumn) => {
    const key = headerKey(sourceColumn);
    const matches = mappingRules.filter(([pattern]) => pattern.test(key));
    if (matches.length === 1) {
      return { sourceColumn, targetField: matches[0][1], confidence: matches[0][2], reason: 'Header matched controlled import vocabulary.' };
    }
    if (matches.length > 1) {
      return { sourceColumn, targetField: '', confidence: 'AMBIGUOUS', reason: 'Header could map to more than one target field.' };
    }
    return { sourceColumn, targetField: '', confidence: 'LOW', reason: 'No safe automatic mapping found.' };
  });
}

export function suggestionsToMapping(suggestions: IndustrialColumnSuggestion[]) {
  return Object.fromEntries(suggestions.map((suggestion) => [suggestion.sourceColumn, suggestion.confidence === 'AMBIGUOUS' ? '' : suggestion.targetField]));
}

export function suggestImportMode(sheetName: string, headers: string[]): IndustrialImportMode {
  const text = `${sheetName} ${headers.join(' ')}`.toLowerCase();
  if (/phone|contact match|contact/.test(text) && !/master/.test(text)) return 'CONTACT_ENRICHMENT';
  if (/discovery|queue|regional/.test(text)) return 'DISCOVERY_QUEUE';
  if (/master|forging|steel|plant/.test(text)) return 'COMPANY_PLANT_MASTER';
  return industrialImportModes.includes('GENERIC_MAPPING') ? 'GENERIC_MAPPING' : 'GENERIC_MAPPING';
}
