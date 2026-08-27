const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const cache = new Map();

function loadTsModule(relativePath) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  cache.set(filename, module);
  const localRequire = (request) => {
    if (request.startsWith('@/')) return loadTsModule(`${request.slice(2)}.ts`);
    if (request.startsWith('.')) {
      const resolved = path.join(path.dirname(filename), request);
      const withExt = fs.existsSync(`${resolved}.ts`) ? `${resolved}.ts` : resolved;
      return loadTsModule(path.relative(root, withExt));
    }
    return require(request);
  };
  vm.runInNewContext(output, { module, exports: module.exports, require: localRequire, URL, Buffer, console, process }, { filename });
  return module.exports;
}

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function createStoredZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.from(content);
    const crc = crc32(data);
    const local = Buffer.concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBuffer.length), u16(0), nameBuffer, data]);
    const central = Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBuffer.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBuffer]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(centrals.length), u16(centrals.length), u32(centralDirectory.length), u32(offset), u16(0)]);
  return Buffer.concat([...locals, centralDirectory, end]);
}

function cell(ref, value, options = {}) {
  if (options.shared !== undefined) return `<c r="${ref}" t="s"><v>${options.shared}</v></c>`;
  if (options.inline) return `<c r="${ref}" t="inlineStr"><is><t>${value}</t></is></c>`;
  if (options.boolean) return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  if (options.date) return `<c r="${ref}" t="d"><v>${value}</v></c>`;
  if (options.formula) return `<c r="${ref}"><f>${value}</f></c>`;
  return `<c r="${ref}"><v>${value}</v></c>`;
}

function row(number, cells) {
  return `<row r="${number}">${cells.join('')}</row>`;
}

function syntheticWorkbook() {
  const strings = [
    'Company / Plant', 'Source Category', 'State', 'City / Cluster', 'Plant Address', 'Official Website',
    'Public Phone', 'Public Business Email', 'Public Contact Person', 'Designation / Contact Type',
    'Forging Type / Products', 'MPI Potential', 'Visual Inspection Potential', 'Grinding / Fettling Potential',
    'Managed Manpower Potential', 'Opportunity Score', 'Priority', 'Contact Verification', 'Primary Source URL', 'Research Date',
    'Synth Alpha Forgings Pvt Ltd', 'Official Website', 'Maharashtra', 'Pune', 'Plot A, Industrial Area', 'https://www.synth-alpha.example',
    '+91 90000 00001', 'alpha@example.test', 'Asha Test', 'QA Head', 'forging', 'High', 'Medium', 'Low', 'Yes', 'HIGH', 'Official verified', 'https://source.example/alpha',
    'Synth Alpha Forgings Private Limited - Plant II', 'Plot B, Industrial Area', '+91 90000 00002',
    'Synth Beta Components', 'Manual Research', 'Gujarat', 'Rajkot', 'bad-email', 'discovery only',
    'Company', 'Plant / Unit', 'Plant Type', 'Products / Processes', 'Capacity / Scale', 'Public Email', 'Verification Status',
    'Synth Steel Works', 'Unit A', 'Rolling Mill', 'rolling mill', '5000 MT', 'steel@example.test', 'Regulatory verified',
    'Dashboard', 'Total', '100',
  ];
  const shared = Object.fromEntries(strings.map((value, index) => [value, index]));
  const s = (value) => ({ shared: shared[value] });
  const master = [
    row(1, strings.slice(0, 20).map((header, index) => cell(`${String.fromCharCode(65 + index)}1`, '', s(header)))),
    row(2, [
      cell('A2', '', s('Synth Alpha Forgings Pvt Ltd')), cell('B2', '', s('Official Website')), cell('C2', '', s('Maharashtra')),
      cell('D2', '', s('Pune')), cell('E2', '', s('Plot A, Industrial Area')), cell('F2', '', s('https://www.synth-alpha.example')),
      cell('G2', '', s('+91 90000 00001')), cell('H2', '', s('alpha@example.test')), cell('I2', '', s('Asha Test')),
      cell('J2', '', s('QA Head')), cell('K2', '', s('forging')), cell('L2', '', s('High')), cell('M2', '', s('Medium')),
      cell('N2', '', s('Low')), cell('O2', '', s('Yes')), cell('P2', '92'), cell('Q2', '', s('HIGH')), cell('R2', '', s('Official verified')),
      cell('S2', '', s('https://source.example/alpha')), cell('T2', '2026-08-01T00:00:00Z', { date: true }),
    ]),
    row(3, [
      cell('A3', '', s('Synth Alpha Forgings Private Limited - Plant II')), cell('B3', '', s('Official Website')), cell('C3', '', s('Maharashtra')),
      cell('D3', '', s('Pune')), cell('E3', '', s('Plot B, Industrial Area')), cell('G3', '', s('+91 90000 00002')),
      cell('H3', '', s('alpha@example.test')), cell('K3', '', s('forging')), cell('P3', '88'), cell('Q3', '', s('HIGH')),
    ]),
    row(4, [
      cell('A4', '', s('Synth Beta Components')), cell('B4', '', s('Manual Research')), cell('C4', '', s('Gujarat')),
      cell('D4', '', s('Rajkot')), cell('H4', '', s('bad-email')), cell('K4', 'machining', { inline: true }), cell('R4', '', s('discovery only')),
      cell('S4', 'HYPERLINK("https://unsafe.example","click")', { formula: true }),
    ]),
    row(5, [cell('B5', '', s('Manual Research')), cell('G5', '', s('+91 90000 00001')), cell('P5', 'TRUE', { boolean: true })]),
  ].join('');
  const steelHeaders = ['Company', 'Plant / Unit', 'State', 'City / Cluster', 'Plant Type', 'Products / Processes', 'Capacity / Scale', 'Public Contact Person', 'Designation / Contact Type', 'Public Phone', 'Public Email', 'Opportunity Score', 'Priority', 'Verification Status', 'Primary Source URL', 'Research Date'];
  const steel = [
    row(1, steelHeaders.map((header, index) => cell(`${String.fromCharCode(65 + index)}1`, '', s(header)))),
    row(2, [
      cell('A2', '', s('Synth Steel Works')), cell('B2', '', s('Unit A')), cell('E2', '', s('Rolling Mill')),
      cell('F2', '', s('rolling mill')), cell('G2', '', s('5000 MT')), cell('K2', '', s('steel@example.test')),
      cell('N2', '', s('Regulatory verified')),
    ]),
  ].join('');
  const dashboard = [row(1, [cell('A1', '', s('Dashboard')), cell('B1', '', s('Total'))]), row(2, [cell('A2', '', s('Total')), cell('B2', '', s('100'))])].join('');
  return createStoredZip({
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
    'xl/workbook.xml': '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Master Prospects" sheetId="1" r:id="rId1"/><sheet name="Steel Master - India" sheetId="2" r:id="rId2"/><sheet name="Dashboard" sheetId="3" r:id="rId3"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Target="worksheets/sheet3.xml"/></Relationships>',
    'xl/sharedStrings.xml': `<sst>${strings.map((value) => `<si><t>${value.replace(/&/g, '&amp;')}</t></si>`).join('')}</sst>`,
    'xl/worksheets/sheet1.xml': `<worksheet><sheetData>${master}</sheetData></worksheet>`,
    'xl/worksheets/sheet2.xml': `<worksheet><sheetData>${steel}</sheetData></worksheet>`,
    'xl/worksheets/sheet3.xml': `<worksheet><sheetData>${dashboard}</sheetData></worksheet>`,
  });
}

(async () => {
  const parsing = loadTsModule('lib/industrial/importParsing.ts');
  const dryRun = loadTsModule('lib/industrial/importDryRun.ts');
  const permissions = fs.readFileSync(path.join(root, 'lib/security/industrialPermissions.ts'), 'utf8');
  const audit = fs.readFileSync(path.join(root, 'lib/security/industrialAudit.ts'), 'utf8');
  const migration = fs.readFileSync(path.join(root, 'prisma/migrations/20260816161000_industrial_intelligence_foundation/migration.sql'), 'utf8');
  const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
  const service = fs.readFileSync(path.join(root, 'lib/industrial/importService.ts'), 'utf8');

  assert(!/\bDROP\s+(TABLE|COLUMN|TYPE)\b/i.test(migration), 'migration must not drop existing objects');
  assert(!/ALTER TABLE "(CrmLead|OutreachProspect|MarketplaceListing)"/.test(migration), 'migration must not alter downstream tables');
  for (const table of ['IndustrialCompany', 'IndustrialPlant', 'IndustrialContact', 'IndustrialImportBatch', 'IndustrialImportRow', 'IndustrialDuplicateCandidate', 'IndustrialAuditEvent']) {
    assert(migration.includes(`CREATE TABLE "${table}"`), `${table} must be created by migration`);
    assert(schema.includes(`model ${table}`), `${table} must exist in Prisma schema`);
  }
  assert(migration.includes('CREATE TYPE "IndustrialImportStatus"'), 'import status enum must be created');
  assert(migration.includes('CREATE INDEX "IndustrialContact_normalizedEmail_idx"'), 'normalized email index must exist');

  assert(permissions.includes("const defaultPermissions: IndustrialPermission[] = ['industrial_intelligence.view']"), 'default compatibility should grant view only');
  assert(permissions.includes('configuredPermissions()'), 'environment permission bootstrap must exist');
  assert(audit.includes('phone|mobile|whatsapp|email'), 'audit redaction must cover PII keys');

  const parsed = await parsing.parseIndustrialImportFile({ fileName: 'synthetic-industrial-workbook.xlsx', bytes: syntheticWorkbook() });
  assert.strictEqual(parsed.fileType, 'xlsx');
  assert.strictEqual(parsed.sheets.length, 3);
  assert(parsed.sheets.some((sheet) => sheet.name === 'Dashboard' && sheet.shouldExclude), 'dashboard sheet must be excluded');
  const master = parsed.sheets.find((sheet) => sheet.name === 'Master Prospects');
  assert(master, 'Master Prospects sheet should parse');
  assert.strictEqual(master.rows[2]['Products / Processes'] || master.rows[2]['Forging Type / Products'], 'machining', 'inline strings should parse');
  assert.strictEqual(master.rows[2]['Primary Source URL'].startsWith("'="), true, 'formula cells without cached values should be stored as neutralized text');
  assert.strictEqual(master.rows[0]['Research Date'], '2026-08-01T00:00:00Z', 'date cells should parse where encoded as ISO date cells');

  const suggestions = parsing.suggestColumnMapping(master.headers);
  const mapping = parsing.suggestionsToMapping(suggestions);
  assert.strictEqual(mapping['Company / Plant'], 'companyName');
  assert.strictEqual(mapping['Public Phone'], 'phone');
  assert.strictEqual(mapping['Public Business Email'], 'email');

  const fakeMatcher = async (candidate) => {
    const name = candidate.company.companyName.normalized;
    if (name.includes('plant ii')) {
      return {
        schemaReady: true,
        companyCandidates: [{ score: 55, recommendedDisposition: 'POSSIBLE_DUPLICATE', signals: [{ key: 'COMPANY_NAME_FUZZY' }], conflicts: [] }],
        plantCandidates: [{ score: 45, recommendedDisposition: 'SAME_COMPANY_DIFFERENT_PLANT', signals: [{ key: 'SAME_PARENT_COMPANY' }], conflicts: [{ key: 'PLANT_MARKER_CONFLICT' }] }],
        contactCandidates: [{ score: 45, recommendedDisposition: 'CONTACT_MATCH', signals: [{ key: 'EMAIL_EXACT' }], conflicts: [] }],
      };
    }
    if (name.includes('beta')) {
      return { schemaReady: true, companyCandidates: [], plantCandidates: [], contactCandidates: [] };
    }
    return {
      schemaReady: true,
      companyCandidates: [],
      plantCandidates: [],
      contactCandidates: candidate.contact?.phone?.normalized === '+919000000001' ? [{ score: 45, recommendedDisposition: 'MANUAL_REVIEW', signals: [{ key: 'PHONE_EXACT' }], conflicts: [] }] : [],
    };
  };
  const result = await dryRun.buildIndustrialDryRun(master, mapping, { findCandidates: fakeMatcher });
  assert.strictEqual(result.summary.totalSourceRows, 4);
  assert(result.summary.invalidRows >= 1, 'blank company or invalid email rows should be invalid');
  assert(result.summary.manualReviewRequired >= 1, 'duplicate signals should require manual review');
  assert(result.rows.some((row) => row.classifications.includes('SAME_COMPANY_DIFFERENT_PLANT')), 'same company different plant should be classified');
  assert(result.rows.some((row) => row.validationIssues.some((issue) => issue.code === 'INVALID_EMAIL')), 'invalid email should be reported');
  assert(result.rows.some((row) => row.validationIssues.some((issue) => issue.code === 'COMPANY_NAME_REQUIRED')), 'blank company should be reported');
  assert(result.rows.some((row) => row.sourceType === 'OFFICIAL_WEBSITE'), 'official source should be preserved');
  assert(result.rows.some((row) => row.verificationStatus === 'DISCOVERY_ONLY' || row.verificationStatus === 'AUTO_NORMALIZED'), 'discovery/default verification should not be upgraded to official');

  assert(service.includes('industrialImportBatch.create'), 'upload path must persist IndustrialImportBatch');
  assert(service.includes('industrialImportRow.create'), 'dry-run path must persist IndustrialImportRow');
  assert(service.includes('industrialDuplicateCandidate.create'), 'dry-run path must persist duplicate candidates');
  assert(service.includes("batch.status !== 'APPROVED'"), 'commit must reject unapproved batches');
  assert(service.includes("batch.status === 'COMMITTED'"), 'commit must be idempotent for committed batches');
  assert(service.includes("status: { in: ['SKIPPED', 'INVALID', 'DUPLICATE_CANDIDATE'] }"), 'commit must skip held/rejected/invalid rows');
  assert(!/crmLead\.(create|update)|outreachProspect\.(create|update)/.test(service), 'import service must not write CRM or Outreach');

  console.log('Industrial Intelligence Phase 4.5 staging activation tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
