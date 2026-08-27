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
    if (request.startsWith('.')) {
      const resolved = path.join(path.dirname(filename), request);
      const withExt = fs.existsSync(`${resolved}.ts`) ? `${resolved}.ts` : resolved;
      return loadTsModule(path.relative(root, withExt));
    }
    return require(request);
  };
  vm.runInNewContext(output, { module, exports: module.exports, require: localRequire, URL, Buffer, console, eval }, { filename });
  return module.exports;
}

const parsing = loadTsModule('lib/industrial/importParsing.ts');

function dosDateTime() {
  return { time: 0, date: 0 };
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
    const stamp = dosDateTime();
    const local = Buffer.concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(stamp.time), u16(stamp.date), u32(crc), u32(data.length), u32(data.length), u16(nameBuffer.length), u16(0), nameBuffer, data]);
    const central = Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(stamp.time), u16(stamp.date), u32(crc), u32(data.length), u32(data.length), u16(nameBuffer.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBuffer]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(centrals.length), u16(centrals.length), u32(centralDirectory.length), u32(offset), u16(0)]);
  return Buffer.concat([...locals, centralDirectory, end]);
}

function tinyXlsx() {
  return createStoredZip({
    '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
    'xl/workbook.xml': '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Steel Master - India" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/sharedStrings.xml': '<sst><si><t>Company</t></si><si><t>Plant / Unit</t></si><si><t>Tata Steel</t></si><si><t>Kalinganagar Works</t></si></sst>',
    'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row></sheetData></worksheet>',
  });
}

(async () => {
  const csv = [
    'Company / Plant,State,City / Cluster,Official Website,Public Phone,Public Business Email,Forging Type / Products,MPI Potential,Verification Status,Source Type,Notes / Next Action',
    'Ramkrishna Forgings Plant I,Jharkhand,Jamshedpur,https://www.ramkrishnaforgings.com,+91 98765 43210,INFO@EXAMPLE.COM,forging,MPI,Association verified,AIFI,=call before visit',
  ].join('\n');
  const parsed = await parsing.parseIndustrialImportFile({ fileName: 'forging-master.csv', bytes: Buffer.from(csv) });
  assert.strictEqual(parsed.fileType, 'csv');
  assert.strictEqual(parsed.sheets.length, 1);
  assert.strictEqual(parsed.sheets[0].suggestedMode, 'COMPANY_PLANT_MASTER');
  assert.strictEqual(parsed.sheets[0].rows[0]['Notes / Next Action'], "'=call before visit", 'formula-looking text should be neutralized');

  const suggestions = parsing.suggestColumnMapping(parsed.sheets[0].headers);
  const mapping = parsing.suggestionsToMapping(suggestions);
  assert.strictEqual(mapping['Company / Plant'], 'companyName');
  assert.strictEqual(mapping['Public Phone'], 'phone');
  assert.strictEqual(mapping['Public Business Email'], 'email');
  assert.strictEqual(mapping['MPI Potential'], 'mpiPotential');
  assert(suggestions.every((suggestion) => ['HIGH', 'MEDIUM', 'LOW', 'AMBIGUOUS'].includes(suggestion.confidence)));

  const steel = await parsing.parseIndustrialImportFile({
    fileName: 'steel-master.csv',
    bytes: Buffer.from('Company,Plant / Unit,Products / Processes,Capacity / Scale,Public Contact Person,Public Phone,Verification Status\nTata Steel,Kalinganagar Works,rolling mill,large,Plant Office,91-9876543210,Regulatory verified'),
  });
  assert.strictEqual(steel.sheets[0].suggestedMode, 'COMPANY_PLANT_MASTER');

  const xlsx = await parsing.parseIndustrialImportFile({ fileName: 'steel-master.xlsx', bytes: tinyXlsx() });
  assert.strictEqual(xlsx.fileType, 'xlsx');
  assert.strictEqual(xlsx.sheets[0].name, 'Steel Master - India');
  assert.strictEqual(xlsx.sheets[0].rows[0].Company, 'Tata Steel');

  const discovery = await parsing.parseIndustrialImportFile({
    fileName: 'regional-discovery.csv',
    bytes: Buffer.from('Region,Industry,State,City / Cluster,Company,Process / Product Evidence,Verification Level,Duplicate Check\nNorth,Steel,UP,Kanpur,ABC Steel Industries,sponge iron,Discovery only,To verify'),
  });
  assert.strictEqual(discovery.sheets[0].suggestedMode, 'DISCOVERY_QUEUE');

  const analytics = await parsing.parseIndustrialImportFile({
    fileName: 'state-summary.csv',
    bytes: Buffer.from('State,Companies,Plants\nOdisha,100,140'),
  });
  assert.strictEqual(analytics.sheets[0].shouldExclude, true, 'analytics/control sheets should be excludable');

  await assert.rejects(() => parsing.parseIndustrialImportFile({ fileName: 'bad.exe', bytes: Buffer.from('nope') }), /UNSUPPORTED_IMPORT_FILE_TYPE/);

  const uploadRoute = fs.readFileSync(path.join(root, 'app/api/admin/industrial-intelligence/imports/upload/route.ts'), 'utf8');
  assert(uploadRoute.includes("requireIndustrialApiPermission(req, 'industrial_intelligence.import')"), 'upload must require import permission');
  assert(uploadRoute.includes('formData'), 'upload must accept controlled multipart file upload');

  const readRoute = fs.readFileSync(path.join(root, 'app/api/admin/industrial-intelligence/imports/route.ts'), 'utf8');
  assert(readRoute.includes('requireIndustrialViewApi(req)'), 'list route must require view permission');

  const service = fs.readFileSync(path.join(root, 'lib/industrial/importService.ts'), 'utf8');
  assert(service.includes("batch.status === 'COMMITTED'"), 'commit path must be idempotent for already committed batches');
  assert(service.includes("batch.status !== 'APPROVED'"), 'commit path must reject unapproved batches');
  assert(service.includes('take: 500'), 'commit path must use bounded chunks');
  assert(service.includes('industrialPaginationMeta'), 'import review must use pagination metadata');
  assert(service.includes('IndustrialImportBatch'), 'service must use Phase 1 import batch model');
  assert(service.includes('IndustrialImportRow'), 'service must use Phase 1 import row model');

  const apiFiles = [
    'app/api/admin/industrial-intelligence/imports/[id]/mapping/route.ts',
    'app/api/admin/industrial-intelligence/imports/[id]/dry-run/route.ts',
    'app/api/admin/industrial-intelligence/imports/[id]/review/route.ts',
    'app/api/admin/industrial-intelligence/imports/[id]/approve/route.ts',
    'app/api/admin/industrial-intelligence/imports/[id]/commit/route.ts',
  ];
  for (const file of apiFiles) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert(source.includes("requireIndustrialApiPermission(req, 'industrial_intelligence.import')"), `${file} must enforce import permission`);
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert(!packageJson.dependencies.xlsx, 'do not add the legacy xlsx dependency');

  console.log('Industrial Intelligence Phase 4 import tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
