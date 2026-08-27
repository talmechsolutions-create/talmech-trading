import {
  IndustrialIndustryCategory,
  IndustrialPriority,
  IndustrialServiceType,
  IndustrialSourceType,
  IndustrialVerificationStatus,
} from '@prisma/client';
import {
  normalizeCompanyName,
  normalizeDepartment,
  normalizeDesignation,
  normalizeEmail,
  normalizeGstin,
  normalizeLocation,
  normalizeOfficialDomain,
  normalizePersonName,
  normalizePhone,
  normalizeProcessLabel,
  normalizeServiceOpportunity,
} from './normalization';
import { findIndustrialDuplicateCandidates } from './matcher';
import {
  IndustrialColumnMapping,
  IndustrialDryRunRow,
  IndustrialDryRunSummary,
  IndustrialImportClassification,
  IndustrialImportIssue,
  IndustrialParsedSheet,
  IndustrialPersistedRowShape,
  IndustrialPlannedAction,
  IndustrialSheetRow,
} from './importTypes';
import type { NormalizedCapabilityInput, NormalizedIndustrialCandidateInput, NormalizedOpportunityInput } from './types';

function mappedValue(row: IndustrialSheetRow, mapping: IndustrialColumnMapping, target: string) {
  const sourceColumn = Object.entries(mapping).find(([, field]) => field === target)?.[0];
  return sourceColumn ? String(row[sourceColumn] || '').trim() : '';
}

function priorityFrom(value: string): IndustrialPriority {
  const text = value.toLowerCase();
  if (/critical|urgent|a\+/.test(text)) return 'CRITICAL';
  if (/high|a\b/.test(text)) return 'HIGH';
  if (/low|c\b/.test(text)) return 'LOW';
  return 'MEDIUM';
}

function sourceTypeFrom(value: string): IndustrialSourceType {
  const text = value.toLowerCase();
  if (/official|website/.test(text)) return 'OFFICIAL_WEBSITE';
  if (/government|spcb|ocmms/.test(text)) return 'GOVERNMENT';
  if (/aifi\b/.test(text)) return 'AIFI';
  if (/aiifa\b/.test(text)) return 'AIIFA';
  if (/\bjpc\b/.test(text)) return 'JPC';
  if (/association/.test(text)) return 'INDUSTRY_ASSOCIATION';
  if (/google|maps/.test(text)) return 'GOOGLE_MAPS';
  if (/indiamart/.test(text)) return 'INDIAMART';
  if (/tradeindia/.test(text)) return 'TRADEINDIA';
  if (/phone|existing crm/.test(text)) return 'EXISTING_PHONE_CRM';
  if (/manual|research/.test(text)) return 'MANUAL_RESEARCH';
  return 'OTHER';
}

function verificationFrom(value: string, sourceType: IndustrialSourceType): IndustrialVerificationStatus {
  const text = value.toLowerCase();
  if (/conflict/.test(text)) return 'CONFLICTING';
  if (/reject/.test(text)) return 'REJECTED';
  if (/stale/.test(text)) return 'STALE';
  if (/to verify|needs review|pending/.test(text)) return 'NEEDS_REVIEW';
  if (/partial/.test(text)) return 'PARTIALLY_VERIFIED';
  if (/official/.test(text) && sourceType === 'OFFICIAL_WEBSITE') return 'OFFICIAL_VERIFIED';
  if (/government|regulatory|spcb|ocmms/.test(text)) return 'REGULATORY_VERIFIED';
  if (/association|aifi|aiifa|jpc/.test(text)) return 'ASSOCIATION_VERIFIED';
  if (/verified/.test(text)) return sourceType === 'GOOGLE_MAPS' || sourceType === 'INDIAMART' || sourceType === 'TRADEINDIA' ? 'PARTIALLY_VERIFIED' : 'MANUALLY_VERIFIED';
  if (/discovery|candidate/.test(text)) return 'DISCOVERY_ONLY';
  return 'AUTO_NORMALIZED';
}

function industryFrom(processes: string, fallback: string): IndustrialIndustryCategory {
  const text = `${processes} ${fallback}`.toLowerCase();
  if (/forg/.test(text)) return 'FORGING';
  if (/steel|rolling|sponge|dri|furnace|billet|ingot/.test(text)) return 'STEEL';
  return 'OTHER_MANUFACTURING';
}

function scoreFrom(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

function splitLabels(value: string) {
  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function buildCapabilities(row: IndustrialSheetRow, mapping: IndustrialColumnMapping): NormalizedCapabilityInput[] {
  const processes = splitLabels(mappedValue(row, mapping, 'processes'));
  const products = splitLabels(mappedValue(row, mapping, 'products'));
  const capacity = mappedValue(row, mapping, 'capacity');
  const labels = [...processes, ...products].slice(0, 25);
  return labels.map((label) => ({
    sourceLabel: label,
    process: normalizeProcessLabel(label),
    product: { original: label, normalized: label.toLowerCase(), valid: Boolean(label) },
    capacityText: capacity || undefined,
  }));
}

function buildOpportunities(row: IndustrialSheetRow, mapping: IndustrialColumnMapping): NormalizedOpportunityInput[] {
  const pairs: Array<[string, string]> = [
    ['MPI Potential', mappedValue(row, mapping, 'mpiPotential')],
    ['Visual Inspection Potential', mappedValue(row, mapping, 'visualInspectionPotential')],
    ['Grinding / Fettling Potential', mappedValue(row, mapping, 'grindingFettlingPotential')],
    ['Oiling / Packing Potential', mappedValue(row, mapping, 'oilingPackingPotential')],
    ['Managed Manpower Potential', mappedValue(row, mapping, 'managedManpowerPotential')],
  ];
  return pairs
    .filter(([, value]) => value && !/^no|none|n\/a$/i.test(value))
    .map(([label, value]) => ({
      sourceLabel: label,
      serviceType: normalizeServiceOpportunity(label),
      evidence: value,
    }));
}

function validateCandidate(candidate: NormalizedIndustrialCandidateInput): IndustrialImportIssue[] {
  const issues: IndustrialImportIssue[] = [];
  if (!candidate.company.companyName.normalized) {
    issues.push({ code: 'COMPANY_NAME_REQUIRED', message: 'Company name is required.', field: 'companyName' });
  }
  if (candidate.company.officialDomain && !candidate.company.officialDomain.valid) {
    issues.push({ code: 'INVALID_OFFICIAL_DOMAIN', message: 'Official website/domain could not be safely normalized.', field: 'officialWebsite' });
  }
  if (candidate.company.gstin && candidate.company.gstin.normalized && !candidate.company.gstin.valid) {
    issues.push({ code: 'INVALID_GSTIN', message: 'GSTIN shape is invalid.', field: 'gstin' });
  }
  if (candidate.contact?.phone && candidate.contact.phone.original && !candidate.contact.phone.valid) {
    issues.push({ code: 'INVALID_PHONE', message: 'Phone number is not safely normalizable.', field: 'phone' });
  }
  if (candidate.contact?.email && candidate.contact.email.original && !candidate.contact.email.valid) {
    issues.push({ code: 'INVALID_EMAIL', message: 'Email shape is invalid.', field: 'email' });
  }
  return issues;
}

function classifyFromMatches(result: Awaited<ReturnType<typeof findIndustrialDuplicateCandidates>>, issues: IndustrialImportIssue[]) {
  const classifications: IndustrialImportClassification[] = [];
  if (issues.length) return ['INVALID'] as IndustrialImportClassification[];

  const company = result.companyCandidates[0];
  const plant = result.plantCandidates[0];
  const contact = result.contactCandidates[0];
  if (!company || company.recommendedDisposition === 'NO_MATCH') classifications.push('NEW_COMPANY');
  else if (company.recommendedDisposition === 'LIKELY_DUPLICATE') classifications.push('MATCH_EXISTING_COMPANY');
  else classifications.push('POSSIBLE_COMPANY_DUPLICATE');

  if (plant?.recommendedDisposition === 'LIKELY_DUPLICATE') classifications.push('MATCH_EXISTING_PLANT');
  else if (plant?.recommendedDisposition === 'SAME_COMPANY_DIFFERENT_PLANT') classifications.push('SAME_COMPANY_DIFFERENT_PLANT');
  else if (plant && plant.recommendedDisposition !== 'NO_MATCH') classifications.push('POSSIBLE_PLANT_DUPLICATE');
  else classifications.push('NEW_PLANT');

  if (contact?.recommendedDisposition === 'CONTACT_MATCH') classifications.push('MATCH_EXISTING_CONTACT');
  else if (contact && contact.recommendedDisposition !== 'NO_MATCH') classifications.push('POSSIBLE_CONTACT_DUPLICATE');
  else classifications.push('NEW_CONTACT');

  if (classifications.some((item) => item.includes('POSSIBLE')) || classifications.includes('SAME_COMPANY_DIFFERENT_PLANT')) {
    classifications.push('MANUAL_REVIEW');
  }
  return classifications;
}

function plannedAction(classifications: IndustrialImportClassification[]): IndustrialPlannedAction {
  if (classifications.includes('INVALID')) return 'REJECT_ROW';
  if (classifications.includes('MANUAL_REVIEW')) return 'HOLD_FOR_REVIEW';
  if (classifications.includes('NEW_COMPANY')) return 'CREATE_NEW_COMPANY';
  if (classifications.includes('NEW_PLANT')) return 'CREATE_NEW_PLANT';
  if (classifications.includes('NEW_CONTACT')) return 'CREATE_NEW_CONTACT';
  return 'USE_EXISTING_COMPANY';
}

function dryRunSummary(rows: IndustrialDryRunRow[]): IndustrialDryRunSummary {
  const count = (classification: IndustrialImportClassification) => rows.filter((row) => row.classifications.includes(classification)).length;
  return {
    totalSourceRows: rows.length,
    validRows: rows.filter((row) => !row.classifications.includes('INVALID')).length,
    invalidRows: count('INVALID'),
    newCompanies: count('NEW_COMPANY'),
    existingCompanyMatches: count('MATCH_EXISTING_COMPANY'),
    possibleCompanyDuplicates: count('POSSIBLE_COMPANY_DUPLICATE'),
    newPlants: count('NEW_PLANT'),
    existingPlantMatches: count('MATCH_EXISTING_PLANT'),
    possiblePlantDuplicates: count('POSSIBLE_PLANT_DUPLICATE'),
    sameCompanyDifferentPlant: count('SAME_COMPANY_DIFFERENT_PLANT'),
    newContacts: count('NEW_CONTACT'),
    existingContactMatches: count('MATCH_EXISTING_CONTACT'),
    possibleContactDuplicates: count('POSSIBLE_CONTACT_DUPLICATE'),
    newCapabilities: rows.reduce((total, row) => total + (row.normalized?.capabilities?.length || 0), 0),
    newServiceOpportunities: rows.reduce((total, row) => total + (row.normalized?.opportunities?.length || 0), 0),
    newSources: rows.filter((row) => !row.classifications.includes('INVALID')).length,
    manualReviewRequired: count('MANUAL_REVIEW'),
    rejectedRows: rows.filter((row) => row.plannedAction === 'REJECT_ROW').length,
    committedRows: 0,
  };
}

export async function buildIndustrialDryRun(sheet: IndustrialParsedSheet, mapping: IndustrialColumnMapping) {
  const rows: IndustrialDryRunRow[] = [];
  for (let index = 0; index < sheet.rows.length; index += 1) {
    const raw = sheet.rows[index];
    const companyName = mappedValue(raw, mapping, 'companyName') || mappedValue(raw, mapping, 'legalName');
    const plantName = mappedValue(raw, mapping, 'plantName') || mappedValue(raw, mapping, 'companyName');
    const sourceType = sourceTypeFrom(mappedValue(raw, mapping, 'sourceType'));
    const verificationStatus = verificationFrom(`${mappedValue(raw, mapping, 'verificationStatus')} ${mappedValue(raw, mapping, 'contactVerification')}`, sourceType);
    const processes = mappedValue(raw, mapping, 'processes');
    const industryCategory = industryFrom(processes, sheet.suggestedMode);
    const location = normalizeLocation({
      state: mappedValue(raw, mapping, 'state'),
      city: mappedValue(raw, mapping, 'city'),
      district: mappedValue(raw, mapping, 'district'),
      industrialArea: mappedValue(raw, mapping, 'industrialArea'),
      pincode: mappedValue(raw, mapping, 'pincode'),
      address: mappedValue(raw, mapping, 'plantAddress'),
    });
    const capabilities = buildCapabilities(raw, mapping);
    const opportunities = buildOpportunities(raw, mapping);
    const candidate: NormalizedIndustrialCandidateInput = {
      company: {
        originalName: companyName,
        companyName: normalizeCompanyName(companyName),
        officialDomain: mappedValue(raw, mapping, 'officialWebsite') ? normalizeOfficialDomain(mappedValue(raw, mapping, 'officialWebsite')) : undefined,
        gstin: mappedValue(raw, mapping, 'gstin') ? normalizeGstin(mappedValue(raw, mapping, 'gstin')) : undefined,
        location,
        industryCategory,
        processLabels: splitLabels(processes).map(normalizeProcessLabel),
      },
      plant: plantName
        ? {
            companyName: normalizeCompanyName(companyName),
            plantName: normalizeCompanyName(plantName),
            location,
            processLabels: splitLabels(processes).map(normalizeProcessLabel),
          }
        : undefined,
      contact:
        mappedValue(raw, mapping, 'contactPerson') || mappedValue(raw, mapping, 'phone') || mappedValue(raw, mapping, 'email')
          ? {
              companyName: normalizeCompanyName(companyName),
              plantName: plantName ? normalizeCompanyName(plantName) : undefined,
              personName: mappedValue(raw, mapping, 'contactPerson') ? normalizePersonName(mappedValue(raw, mapping, 'contactPerson')) : undefined,
              designation: mappedValue(raw, mapping, 'designation') ? normalizeDesignation(mappedValue(raw, mapping, 'designation')) : undefined,
              department: mappedValue(raw, mapping, 'department') ? normalizeDepartment(mappedValue(raw, mapping, 'department')) : undefined,
              phone: mappedValue(raw, mapping, 'phone') ? normalizePhone(mappedValue(raw, mapping, 'phone')) : undefined,
              whatsapp: mappedValue(raw, mapping, 'whatsapp') ? normalizePhone(mappedValue(raw, mapping, 'whatsapp')) : undefined,
              email: mappedValue(raw, mapping, 'email') ? normalizeEmail(mappedValue(raw, mapping, 'email')) : undefined,
            }
          : undefined,
      capabilities,
      opportunities,
    };
    const validationIssues = validateCandidate(candidate);
    const matches = validationIssues.length ? { companyCandidates: [], plantCandidates: [], contactCandidates: [] } : await findIndustrialDuplicateCandidates(candidate);
    const classifications = classifyFromMatches(matches as Awaited<ReturnType<typeof findIndustrialDuplicateCandidates>>, validationIssues);
    const topAnalyses = [...matches.companyCandidates, ...matches.plantCandidates, ...matches.contactCandidates].slice(0, 3);
    const action = plannedAction(classifications);
    rows.push({
      rowNumber: index + 2,
      sourceSheet: sheet.name,
      raw,
      normalized: candidate,
      validationIssues,
      classifications,
      duplicateSummary: {
        topScore: Math.max(0, ...topAnalyses.map((item) => item.score)),
        signals: topAnalyses.flatMap((item) => item.signals.map((signal) => signal.key)).slice(0, 10),
        conflicts: topAnalyses.flatMap((item) => item.conflicts.map((conflict) => conflict.key)).slice(0, 10),
      },
      verificationStatus,
      sourceType,
      industryCategory,
      priority: priorityFrom(mappedValue(raw, mapping, 'priority')),
      opportunityScore: scoreFrom(mappedValue(raw, mapping, 'opportunityScore')),
      plannedAction: action,
      reviewStatus: action === 'HOLD_FOR_REVIEW' ? 'REVIEW_REQUIRED' : action === 'REJECT_ROW' ? 'REJECTED' : 'APPROVED',
    });
  }

  return { rows, summary: dryRunSummary(rows) };
}

export function toPersistedRowShape(row: IndustrialDryRunRow): IndustrialPersistedRowShape {
  return {
    dryRun: row,
    normalized: row.normalized || null,
    services: (row.normalized?.opportunities || []).map((opportunity) => opportunity.serviceType.normalized as IndustrialServiceType),
  };
}

