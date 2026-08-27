const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();

function loadTsModule(relativePath) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, URLSearchParams, console }, { filename });
  return module.exports;
}

const query = loadTsModule('lib/industrialIntelligenceQuery.ts');

{
  const filters = query.parseIndustrialCompanyFilters(new URLSearchParams('limit=500&page=-9&industry=DROP_TABLE&sort=raw&direction=sideways&search=<script>Alpha</script>'));
  assert.strictEqual(filters.limit, 100, 'company limit should be clamped to max 100');
  assert.strictEqual(filters.page, 1, 'invalid company page should become page 1');
  assert.strictEqual(filters.industry, '', 'unknown company industry should be rejected');
  assert.strictEqual(filters.sort, 'updatedAt', 'unknown company sort should fall back to allowlisted sort');
  assert.strictEqual(filters.direction, 'desc', 'unknown company direction should fall back to desc');
  assert(!filters.search.includes('<'), 'company search should remove angle brackets');
}

{
  const filters = query.parseIndustrialContactFilters(new URLSearchParams('limit=0&page=2&verificationStatus=VERIFIED&search=Quality Head'));
  assert.strictEqual(filters.limit, 25, 'invalid contact limit should use default 25');
  assert.strictEqual(filters.page, 2, 'valid contact page should be preserved');
  assert.strictEqual(filters.verificationStatus, 'VERIFIED', 'allowlisted contact verification should be preserved');
}

{
  const meta = query.industrialPaginationMeta(250, 2, 1000);
  assert.strictEqual(meta.limit, 100, 'pagination meta should clamp limit');
  assert.strictEqual(meta.hasNextPage, true, 'pagination meta should detect next page');
}

const apiFiles = [
  'app/api/admin/industrial-intelligence/summary/route.ts',
  'app/api/admin/industrial-intelligence/companies/route.ts',
  'app/api/admin/industrial-intelligence/companies/[id]/route.ts',
  'app/api/admin/industrial-intelligence/plants/[id]/route.ts',
  'app/api/admin/industrial-intelligence/contacts/route.ts',
];

for (const file of apiFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert(source.includes('requireIndustrialViewApi(req)'), `${file} must enforce industrial view RBAC`);
}

const apiHelper = fs.readFileSync(path.join(root, 'lib/industrialIntelligenceApi.ts'), 'utf8');
assert(apiHelper.includes("requireIndustrialPermission(req, 'industrial_intelligence.view')"), 'API helper must require industrial_intelligence.view');
assert(apiHelper.includes('no-store'), 'API helper must disable public caching');

console.log('Industrial Intelligence Phase 2 tests passed');
