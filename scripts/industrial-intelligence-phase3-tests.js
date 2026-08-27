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
  vm.runInNewContext(output, { module, exports: module.exports, require: localRequire, URL, console }, { filename });
  return module.exports;
}

const normalization = loadTsModule('lib/industrial/normalization.ts');
const taxonomy = loadTsModule('lib/industrial/taxonomy.ts');
const duplicates = loadTsModule('lib/industrial/duplicates.ts');

assert.strictEqual(normalization.normalizeCompanyName('R.L. Steels & Energy Ltd').normalized, 'rl steels and energy');
assert.strictEqual(normalization.normalizeCompanyName('R L Steels and Energy Limited').normalized, 'rl steels and energy');
assert.strictEqual(normalization.normalizeCompanyName('Ramkrishna Forgings Ltd.').normalized, 'ramkrishna forgings');
assert.strictEqual(normalization.normalizeCompanyName('Ramkrishna Forgings Limited').normalized, 'ramkrishna forgings');
assert.strictEqual(normalization.normalizeCompanyName('Arjas Steel Pvt Ltd').normalized, 'arjas steel');
assert.strictEqual(normalization.normalizeCompanyName('Arjas Steel Private Limited').normalized, 'arjas steel');
assert.strictEqual(normalization.normalizeCompanyName('TK Steels').normalized, 'tk steels');
assert.strictEqual(normalization.normalizeCompanyName('T K Steels').normalized, 'tk steels');

assert.strictEqual(normalization.normalizePhone('+91 98765 43210').normalized, '+919876543210');
assert.strictEqual(normalization.normalizePhone('9876543210').normalized, '+919876543210');
assert.strictEqual(normalization.normalizePhone('91-9876543210').normalized, '+919876543210');
assert.strictEqual(normalization.normalizePhone('09876543210').normalized, '+919876543210');
assert.strictEqual(normalization.normalizePhone('9876543210', { countryContext: 'UNKNOWN' }).valid, false);

const normalizedEmail = normalization.normalizeEmail(' INFO@EXAMPLE.COM ');
assert.strictEqual(normalizedEmail.original, 'INFO@EXAMPLE.COM');
assert.strictEqual(normalizedEmail.normalized, 'info@example.com');
assert.strictEqual(normalizedEmail.valid, true);

assert.strictEqual(normalization.normalizeOfficialDomain('https://www.example.com/about').normalized, 'example.com');
assert.strictEqual(normalization.normalizeOfficialDomain('example.com').normalized, 'example.com');
assert.strictEqual(normalization.normalizeOfficialDomain('http://example.com/').normalized, 'example.com');
assert.strictEqual(normalization.normalizeOfficialDomain('https://plant.example.com/about').normalized, 'plant.example.com');

assert.strictEqual(normalization.normalizeGstin(' 27 aabcu9603r 1zv ').normalized, '27AABCU9603R1ZV');
assert.strictEqual(normalization.normalizeGstin('27AABCU9603R1ZV').valid, true);
assert.strictEqual(normalization.normalizeGstin('bad-gstin').valid, false);

assert.strictEqual(normalization.normalizeLocation({ state: 'UP' }).state.normalized, 'Uttar Pradesh');
assert.strictEqual(normalization.normalizeLocation({ state: 'Uttar Pradesh' }).state.normalized, 'Uttar Pradesh');
assert.strictEqual(normalization.normalizeLocation({ state: 'MP' }).state.normalized, 'Madhya Pradesh');
assert.strictEqual(normalization.normalizeLocation({ state: 'Madhya Pradesh' }).state.normalized, 'Madhya Pradesh');
assert.strictEqual(normalization.normalizeLocation({ state: 'Orissa' }).state.normalized, 'Odisha');
assert.strictEqual(normalization.normalizeLocation({ state: 'Odisha' }).state.normalized, 'Odisha');
assert.strictEqual(normalization.normalizeLocation({ city: 'Bangalore' }).city.normalized, 'Bengaluru');
assert.strictEqual(normalization.normalizeLocation({ city: 'Bengaluru' }).city.normalized, 'Bengaluru');

assert.strictEqual(taxonomy.normalizeDepartment('QA').normalized, 'QUALITY');
assert.strictEqual(taxonomy.normalizeDepartment('Quality Assurance').normalized, 'QUALITY');
assert.strictEqual(taxonomy.normalizeDepartment('Purchase').normalized, 'PURCHASE_PROCUREMENT');
assert.strictEqual(taxonomy.normalizeDepartment('Procurement').normalized, 'PURCHASE_PROCUREMENT');
assert.strictEqual(taxonomy.normalizeDepartment('NDT').normalized, 'NDT_MPI');
assert.strictEqual(taxonomy.normalizeDepartment('MPI').normalized, 'NDT_MPI');

assert.strictEqual(taxonomy.normalizeProcessLabel('rerolling').normalized, 'RE_ROLLING_MILL');
assert.strictEqual(taxonomy.normalizeProcessLabel('re-rolling').normalized, 'RE_ROLLING_MILL');
assert.strictEqual(taxonomy.normalizeProcessLabel('rolling mill').normalized, 'ROLLING_MILL');
assert.strictEqual(taxonomy.normalizeProcessLabel('sponge iron').normalized, 'SPONGE_IRON_DRI');
assert.strictEqual(taxonomy.normalizeProcessLabel('DRI').normalized, 'SPONGE_IRON_DRI');
assert.strictEqual(taxonomy.normalizeServiceOpportunity('MP inspection').normalized, 'MPI_NDT');
assert.strictEqual(taxonomy.normalizeServiceOpportunity('Magnetic particle inspection').normalized, 'MPI_NDT');

function candidate(companyName, plantName, city) {
  return {
    company: {
      originalName: companyName,
      companyName: normalization.normalizeCompanyName(companyName),
      location: normalization.normalizeLocation({ city }),
      processLabels: [],
    },
    plant: plantName
      ? {
          companyName: normalization.normalizeCompanyName(companyName),
          plantName: normalization.normalizeCompanyName(plantName),
          location: normalization.normalizeLocation({ city }),
          processLabels: [],
        }
      : undefined,
  };
}

const ramCompany = duplicates.analyzeCompanyDuplicate(candidate('Ramkrishna Forgings Ltd.'), {
  id: 'company_1',
  canonicalName: 'Ramkrishna Forgings Limited',
  normalizedName: 'ramkrishna forgings',
});
assert.strictEqual(ramCompany.recommendedDisposition, 'POSSIBLE_DUPLICATE');

const abcCompany = duplicates.analyzeCompanyDuplicate(candidate('ABC Steel Industries'), {
  id: 'company_2',
  canonicalName: 'ABC Steel Traders',
  normalizedName: normalization.normalizeCompanyName('ABC Steel Traders').normalized,
});
assert.strictEqual(abcCompany.recommendedDisposition, 'NO_MATCH');

const ramPlant = duplicates.analyzePlantDuplicate(candidate('Ramkrishna Forgings Limited', 'Ramkrishna Forgings Plant I'), {
  id: 'plant_1',
  companyId: 'company_1',
  plantName: 'Ramkrishna Forgings Plant V',
  normalizedPlantName: normalization.normalizeCompanyName('Ramkrishna Forgings Plant V').normalized,
  company: {
    id: 'company_1',
    canonicalName: 'Ramkrishna Forgings Limited',
    normalizedName: 'ramkrishna forgings',
  },
});
assert.strictEqual(ramPlant.recommendedDisposition, 'SAME_COMPANY_DIFFERENT_PLANT');

const tataPlant = duplicates.analyzePlantDuplicate(candidate('Tata Steel', 'Tata Steel Jamshedpur', 'Jamshedpur'), {
  id: 'plant_2',
  companyId: 'company_3',
  plantName: 'Tata Steel Kalinganagar',
  normalizedPlantName: normalization.normalizeCompanyName('Tata Steel Kalinganagar').normalized,
  city: 'Kalinganagar',
  company: {
    id: 'company_3',
    canonicalName: 'Tata Steel',
    normalizedName: 'tata steel',
  },
});
assert.strictEqual(tataPlant.recommendedDisposition, 'SAME_COMPANY_DIFFERENT_PLANT');
assert(tataPlant.conflicts.some((conflict) => conflict.key === 'CITY_CONFLICT'));

const contactEmail = duplicates.analyzeContactDuplicate(
  {
    ...candidate('Example Steel'),
    contact: {
      companyName: normalization.normalizeCompanyName('Example Steel'),
      email: normalization.normalizeEmail('INFO@EXAMPLE.COM'),
    },
  },
  {
    id: 'contact_1',
    companyId: 'company_4',
    normalizedEmail: 'info@example.com',
  },
);
assert.strictEqual(contactEmail.recommendedDisposition, 'CONTACT_MATCH');

const phoneOnly = duplicates.analyzeContactDuplicate(
  {
    ...candidate('Example Steel'),
    contact: {
      companyName: normalization.normalizeCompanyName('Example Steel'),
      phone: normalization.normalizePhone('+91 98765 43210'),
    },
  },
  {
    id: 'contact_2',
    companyId: 'company_5',
    normalizedPhone: '+919876543210',
  },
);
assert.strictEqual(phoneOnly.recommendedDisposition, 'MANUAL_REVIEW');

console.log('Industrial Intelligence Phase 3 normalization and duplicate tests passed');
