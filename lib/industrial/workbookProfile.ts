import { buildIndustrialDryRun } from './importDryRun';
import { suggestColumnMapping, suggestionsToMapping } from './importParsing';
import { findIndustrialDuplicateCandidates } from './matcher';
import type { IndustrialDryRunSummary, IndustrialParsedSheet, TalmechWorkbookPhaseKey, TalmechWorkbookProfileSummary } from './importTypes';

const canonical: Array<{ phase: TalmechWorkbookPhaseKey; sheetName: string; modeHint: IndustrialParsedSheet['suggestedMode'] }> = [
  { phase: 'FORGING_MASTER', sheetName: 'Master Prospects', modeHint: 'COMPANY_PLANT_MASTER' },
  { phase: 'STEEL_MASTER', sheetName: 'Steel Master - India', modeHint: 'COMPANY_PLANT_MASTER' },
  { phase: 'PHONE_CONTACT_ENRICHMENT', sheetName: 'Phone CRM - Manufacturing', modeHint: 'CONTACT_ENRICHMENT' },
  { phase: 'DISCOVERY_QUEUE', sheetName: 'Regional Discovery Queue', modeHint: 'DISCOVERY_QUEUE' },
];

const derivedSheets = [
  'Verified Contacts',
  'Research Queue',
  'Existing - Forging',
  'Existing - Steel Rolling',
  'Existing - Foundry Casting',
  'Existing - Other Mfg',
  'Matched to Forging Master',
  'New Business From Phone',
  'New Additions - VCF2',
  'Major Steel Plants',
  'Secondary Steel & Rolling',
  'Steel Contact Matches',
];

const analyticsSheets = [
  'Dashboard',
  'Steel Dashboard',
  'Phone Contact Summary',
  'Sources & Method',
  'Steel Sources & Coverage',
  'India Coverage Control',
  'State & Region Summary',
];

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function emptySummary(): IndustrialDryRunSummary {
  return {
    totalSourceRows: 0,
    validRows: 0,
    invalidRows: 0,
    newCompanies: 0,
    existingCompanyMatches: 0,
    possibleCompanyDuplicates: 0,
    newPlants: 0,
    existingPlantMatches: 0,
    possiblePlantDuplicates: 0,
    sameCompanyDifferentPlant: 0,
    newContacts: 0,
    existingContactMatches: 0,
    possibleContactDuplicates: 0,
    newCapabilities: 0,
    newServiceOpportunities: 0,
    newSources: 0,
    manualReviewRequired: 0,
    rejectedRows: 0,
    committedRows: 0,
  };
}

function mergeSummary(total: IndustrialDryRunSummary, next: IndustrialDryRunSummary): IndustrialDryRunSummary {
  const merged = { ...total };
  for (const key of Object.keys(merged) as Array<keyof IndustrialDryRunSummary>) {
    merged[key] += next[key];
  }
  return merged;
}

export const TALMECH_WORKBOOK_PROFILE = {
  name: 'TALMECH_FULL_RESEARCH_WORKBOOK' as const,
  canonicalOrder: canonical.map((item) => item.sheetName),
  derivedSheets,
  analyticsSheets,
  classifySheets(sheets: IndustrialParsedSheet[]) {
    const names = sheets.map((sheet) => sheet.name);
    return {
      canonicalSheets: canonical.filter((item) => names.some((name) => sameName(name, item.sheetName))).map((item) => item.sheetName),
      derivedSheets: names.filter((name) => derivedSheets.some((sheetName) => sameName(name, sheetName))),
      analyticsSheets: names.filter((name) => analyticsSheets.some((sheetName) => sameName(name, sheetName))),
      missingCanonicalSheets: canonical.filter((item) => !names.some((name) => sameName(name, item.sheetName))).map((item) => item.sheetName),
    };
  },
};

type CandidateMatcher = typeof findIndustrialDuplicateCandidates;

export async function buildTalmechFullWorkbookDryRun(sheets: IndustrialParsedSheet[], options: { findCandidates?: CandidateMatcher } = {}) {
  const rows = [];
  const canonicalSheetsProcessed: TalmechWorkbookProfileSummary['canonicalSheetsProcessed'] = [];
  let consolidatedSummary = emptySummary();

  for (const item of canonical) {
    const sheet = sheets.find((candidate) => sameName(candidate.name, item.sheetName));
    if (!sheet) continue;
    const mapping = suggestionsToMapping(suggestColumnMapping(sheet.headers));
    const dryRun = await buildIndustrialDryRun({ ...sheet, suggestedMode: item.modeHint, shouldExclude: false }, mapping, options);
    rows.push(...dryRun.rows);
    consolidatedSummary = mergeSummary(consolidatedSummary, dryRun.summary);
    canonicalSheetsProcessed.push({ phase: item.phase, sheetName: sheet.name, summary: dryRun.summary });
  }

  const roles = TALMECH_WORKBOOK_PROFILE.classifySheets(sheets);
  return {
    rows,
    summary: consolidatedSummary,
    profileSummary: {
      profile: 'TALMECH_FULL_RESEARCH_WORKBOOK',
      orderedSheets: TALMECH_WORKBOOK_PROFILE.canonicalOrder,
      canonicalSheetsProcessed,
      derivedSheetsExcluded: roles.derivedSheets,
      analyticsSheetsExcluded: roles.analyticsSheets,
      missingCanonicalSheets: roles.missingCanonicalSheets,
      consolidatedSummary,
    } satisfies TalmechWorkbookProfileSummary,
  };
}
