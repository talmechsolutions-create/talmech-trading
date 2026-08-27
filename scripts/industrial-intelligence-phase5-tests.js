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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  cache.set(filename, module);
  const localRequire = (request) => {
    if (request === '@prisma/client') {
      return {
        IndustrialIndustryCategory: {},
        IndustrialPriority: {},
        IndustrialServiceType: {},
        IndustrialSourceType: {},
        IndustrialVerificationStatus: {},
        Prisma: {},
      };
    }
    if (request.startsWith('@/')) return loadTsModule(`${request.slice(2)}.ts`);
    if (request.startsWith('.')) {
      const resolved = path.join(path.dirname(filename), request);
      if (path.basename(resolved) === 'matcher') {
        return { findIndustrialDuplicateCandidates: async () => ({ companyCandidates: [], plantCandidates: [], contactCandidates: [] }) };
      }
      const withExt = fs.existsSync(`${resolved}.ts`) ? `${resolved}.ts` : resolved;
      return loadTsModule(path.relative(root, withExt));
    }
    return require(request);
  };
  vm.runInNewContext(output, { module, exports: module.exports, require: localRequire, URL, Buffer, console, process }, { filename });
  return module.exports;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

(async () => {
  const importTypes = loadTsModule('lib/industrial/importTypes.ts');
  const parsing = loadTsModule('lib/industrial/importParsing.ts');
  const profile = loadTsModule('lib/industrial/workbookProfile.ts');
  const management = read('lib/industrial/managementService.ts');
  const importService = read('lib/industrial/importService.ts');
  const companiesRoute = read('app/api/admin/industrial-intelligence/companies/route.ts');
  const companyRoute = read('app/api/admin/industrial-intelligence/companies/[id]/route.ts');
  const contactsRoute = read('app/api/admin/industrial-intelligence/contacts/route.ts');
  const contactRoute = read('app/api/admin/industrial-intelligence/contacts/[id]/route.ts');
  const plantRoute = read('app/api/admin/industrial-intelligence/plants/[id]/route.ts');
  const researchRoute = read('app/api/admin/industrial-intelligence/research-prospects/route.ts');
  const dashboardPage = read('app/admin/industrial-intelligence/page.tsx');
  const companyPage = read('app/admin/industrial-intelligence/companies/[id]/page.tsx');
  const managementClient = read('components/industrial/IndustrialManagementClient.tsx');

  assert(importTypes.industrialImportModes.includes('TALMECH_FULL_RESEARCH_WORKBOOK'), 'full workbook profile must be an import mode');
  assert(importTypes.industrialImportTargetFields.includes('matchedMasterProspect'), 'phone enrichment mapping fields must exist');

  for (const [label, source] of [
    ['companies route', companiesRoute],
    ['company detail route', companyRoute],
    ['contacts route', contactsRoute],
    ['contact route', contactRoute],
    ['plant route', plantRoute],
    ['research route', researchRoute],
  ]) {
    assert(/requireIndustrialApiPermission/.test(source), `${label} must enforce server-side permission`);
  }
  assert(/industrial_intelligence\.edit/.test(companiesRoute), 'company create must require edit permission');
  assert(/industrial_intelligence\.edit/.test(contactsRoute), 'contact create must require edit permission');
  assert(/industrial_intelligence\.verify/.test(companyRoute), 'source/evidence action must require verify permission');

  for (const token of [
    'createManualIndustrialCompany',
    'updateManualIndustrialCompany',
    'createManualIndustrialPlant',
    'updateManualIndustrialPlant',
    'createManualIndustrialContact',
    'updateManualIndustrialContact',
    'createIndustrialResearchProspect',
    'addIndustrialCapability',
    'addIndustrialProcess',
    'addIndustrialServiceOpportunity',
    'addIndustrialSource',
  ]) {
    assert(management.includes(`function ${token}`), `${token} must be implemented`);
  }

  assert(/findIndustrialDuplicateCandidates/.test(management), 'manual creation must use Phase 3 duplicate detection');
  assert(/DUPLICATE_REVIEW_REQUIRED/.test(management), 'manual duplicates must return review-required state');
  assert(/createAnywayJustification/.test(management), 'manual override must require justification');
  assert(/VERIFICATION_DOWNGRADE_REQUIRES_JUSTIFICATION/.test(management), 'verification downgrade must be guarded');
  assert(/DISCOVERY_ONLY/.test(management) && /DISCOVERED/.test(management), 'research prospect must default to discovery state');

  assert(/TALMECH_WORKBOOK_PROFILE/.test(importService), 'import service must use workbook profile');
  assert(/buildTalmechFullWorkbookDryRun/.test(importService), 'import service must run multi-sheet full workbook dry run');
  assert(/enrichedByImportBatch/.test(importService), 'commit must enrich existing records for repeat imports');
  assert(/createdByImportBatch/.test(importService), 'commit must still trace newly created records to import batch');

  assert(/IndustrialDashboardActions/.test(dashboardPage), 'dashboard must expose manual actions');
  assert(/IndustrialCompanyActions/.test(companyPage), 'company detail must expose company actions');
  assert(/Add Company/.test(managementClient), 'Add Company action must exist');
  assert(/Add Research Prospect/.test(managementClient), 'Add Research Prospect action must exist');
  assert(/Add Plant/.test(managementClient), 'Add Plant action must exist');
  assert(/Add Contact/.test(managementClient), 'Add Contact action must exist');
  assert(/Add Capability/.test(managementClient), 'Add Capability action must exist');
  assert(/Add Service Opportunity/.test(managementClient), 'Add Service Opportunity action must exist');
  assert(/Add Source \/ Evidence/.test(managementClient), 'Add Source / Evidence action must exist');

  const sheets = [
    { name: 'Dashboard', headers: ['Metric'], rows: [{ Metric: '100' }], rowCount: 1, columnCount: 1, suggestedMode: 'GENERIC_MAPPING', shouldExclude: true },
    { name: 'Master Prospects', headers: ['Company / Plant', 'Source Category', 'State', 'City / Cluster', 'Primary Source URL'], rows: [{ 'Company / Plant': 'Synth Phase Five Forgings', 'Source Category': 'Official Website', State: 'Maharashtra', 'City / Cluster': 'Pune', 'Primary Source URL': 'https://phase5.example' }], rowCount: 1, columnCount: 5, suggestedMode: 'COMPANY_PLANT_MASTER', shouldExclude: false },
    { name: 'Steel Master - India', headers: ['Company', 'Plant / Unit', 'Products / Processes'], rows: [{ Company: 'Synth Phase Five Steel', 'Plant / Unit': 'Unit I', 'Products / Processes': 'rolling mill' }], rowCount: 1, columnCount: 3, suggestedMode: 'COMPANY_PLANT_MASTER', shouldExclude: false },
    { name: 'Phone CRM - Manufacturing', headers: ['Likely Company / Business', 'Phone(s)', 'Matched Master Prospect', 'Master Match Score'], rows: [{ 'Likely Company / Business': 'Synth Phase Five Forgings', 'Phone(s)': '+91 90000 00005', 'Matched Master Prospect': 'Synth Phase Five Forgings', 'Master Match Score': '95' }], rowCount: 1, columnCount: 4, suggestedMode: 'CONTACT_ENRICHMENT', shouldExclude: false },
    { name: 'Regional Discovery Queue', headers: ['Company', 'Source Type', 'Verification Level'], rows: [{ Company: 'Synth Discovery Candidate', 'Source Type': 'IndiaMART', 'Verification Level': 'Discovery only' }], rowCount: 1, columnCount: 3, suggestedMode: 'DISCOVERY_QUEUE', shouldExclude: false },
    { name: 'Verified Contacts', headers: ['Company'], rows: [{ Company: 'Derived only' }], rowCount: 1, columnCount: 1, suggestedMode: 'GENERIC_MAPPING', shouldExclude: false },
  ];
  const noMatches = async () => ({ companyCandidates: [], plantCandidates: [], contactCandidates: [] });
  const dryRun = await profile.buildTalmechFullWorkbookDryRun(sheets, { findCandidates: noMatches });
  assert.strictEqual(JSON.stringify(dryRun.profileSummary.orderedSheets), JSON.stringify(['Master Prospects', 'Steel Master - India', 'Phone CRM - Manufacturing', 'Regional Discovery Queue']), 'canonical order must be stable');
  assert.strictEqual(dryRun.profileSummary.canonicalSheetsProcessed.length, 4, 'four canonical sheets must be processed');
  assert(dryRun.profileSummary.derivedSheetsExcluded.includes('Verified Contacts'), 'derived sheets must be excluded');
  assert(dryRun.profileSummary.analyticsSheetsExcluded.includes('Dashboard'), 'analytics sheets must be excluded');
  assert.strictEqual(dryRun.summary.totalSourceRows, 4, 'only canonical rows should enter consolidated dry run');

  const suggestions = parsing.suggestColumnMapping(['Source Category', 'Existing Phone Numbers', 'Matched Master Prospect', 'Promotion Decision']);
  assert(suggestions.some((item) => item.targetField === 'sourceType'), 'Source Category must map to sourceType');
  assert(suggestions.some((item) => item.targetField === 'existingPhoneNumbers'), 'existing phones must map');
  assert(suggestions.some((item) => item.targetField === 'matchedMasterProspect'), 'matched master prospect must map');
  assert(suggestions.some((item) => item.targetField === 'promotionDecision'), 'promotion decision must map');

  console.log('Industrial Intelligence Phase 5 tests passed.');
})();
