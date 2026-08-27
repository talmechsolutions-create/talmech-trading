import { extractPlantMarker, levenshteinSimilarity, normalizeAddressText } from './text';
import { NormalizedIndustrialCandidateInput } from './types';

export type IndustrialCandidateType = 'COMPANY' | 'PLANT' | 'CONTACT';

export type IndustrialDuplicateDisposition =
  | 'LIKELY_DUPLICATE'
  | 'POSSIBLE_DUPLICATE'
  | 'SAME_COMPANY_DIFFERENT_PLANT'
  | 'CONTACT_MATCH'
  | 'NO_MATCH'
  | 'MANUAL_REVIEW';

export type DuplicateSignalStrength = 'STRONG' | 'MEDIUM' | 'WEAK';

export type DuplicateSignal = {
  key: string;
  strength: DuplicateSignalStrength;
  weight: number;
  description: string;
};

export type DuplicateConflict = {
  key: string;
  description: string;
};

export type ComparableCompanyRecord = {
  id: string;
  canonicalName: string;
  normalizedName: string;
  officialDomain?: string | null;
  gstin?: string | null;
  state?: string | null;
  city?: string | null;
  headOfficeAddress?: string | null;
};

export type ComparablePlantRecord = {
  id: string;
  companyId: string;
  plantName: string;
  plantCode?: string | null;
  normalizedPlantName: string;
  state?: string | null;
  city?: string | null;
  industrialCluster?: string | null;
  industrialArea?: string | null;
  normalizedAddress?: string | null;
  pincode?: string | null;
  company?: {
    id: string;
    normalizedName: string;
    canonicalName: string;
  };
};

export type ComparableContactRecord = {
  id: string;
  companyId: string;
  plantId?: string | null;
  normalizedPhone?: string | null;
  normalizedWhatsapp?: string | null;
  normalizedEmail?: string | null;
  department?: string | null;
  normalizedPersonName?: string | null;
};

export type DuplicateAnalysis<Entity> = {
  candidateType: IndustrialCandidateType;
  entityA: NormalizedIndustrialCandidateInput;
  entityB: Entity;
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: DuplicateSignal[];
  conflicts: DuplicateConflict[];
  recommendedDisposition: IndustrialDuplicateDisposition;
};

function score(signals: DuplicateSignal[]) {
  return Math.min(100, signals.reduce((total, signal) => total + signal.weight, 0));
}

function confidence(scoreValue: number, signals: DuplicateSignal[]) {
  if (signals.some((signal) => signal.strength === 'STRONG') && scoreValue >= 70) return 'HIGH';
  if (scoreValue >= 55) return 'MEDIUM';
  return 'LOW';
}

function addSignal(signals: DuplicateSignal[], key: string, strength: DuplicateSignalStrength, weight: number, description: string) {
  signals.push({ key, strength, weight, description });
}

function sameText(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

export function analyzeCompanyDuplicate(
  incoming: NormalizedIndustrialCandidateInput,
  existing: ComparableCompanyRecord,
): DuplicateAnalysis<ComparableCompanyRecord> {
  const signals: DuplicateSignal[] = [];
  const conflicts: DuplicateConflict[] = [];
  const incomingCompany = incoming.company;
  const location = incomingCompany.location;

  if (incomingCompany.gstin?.valid && sameText(incomingCompany.gstin.normalized, existing.gstin)) {
    addSignal(signals, 'GSTIN_EXACT', 'STRONG', 50, 'normalized GSTIN exact match');
  }
  if (incomingCompany.officialDomain?.valid && sameText(incomingCompany.officialDomain.normalized, existing.officialDomain)) {
    addSignal(signals, 'OFFICIAL_DOMAIN_EXACT', 'STRONG', 45, 'official domain exact match');
  }
  if (sameText(incomingCompany.companyName.normalized, existing.normalizedName)) {
    addSignal(signals, 'COMPANY_NAME_EXACT', 'MEDIUM', 35, 'normalized company name exact match');
  } else {
    const similarity = levenshteinSimilarity(incomingCompany.companyName.normalized, existing.normalizedName || '');
    if (similarity >= 0.88) addSignal(signals, 'COMPANY_NAME_FUZZY', 'WEAK', 18, `company name similarity ${similarity.toFixed(2)}`);
  }

  if (location?.city?.normalized && sameText(location.city.normalized, existing.city)) {
    addSignal(signals, 'CITY_MATCH', 'MEDIUM', 10, 'city match');
  }
  if (location?.state?.normalized && sameText(location.state.normalized, existing.state)) {
    addSignal(signals, 'STATE_MATCH', 'MEDIUM', 8, 'state match');
  }
  if (location?.address?.normalized && existing.headOfficeAddress) {
    const similarity = levenshteinSimilarity(location.address.normalized, normalizeAddressText(existing.headOfficeAddress));
    if (similarity >= 0.82) addSignal(signals, 'ADDRESS_SIMILAR', 'MEDIUM', 15, `head-office address similarity ${similarity.toFixed(2)}`);
  }

  if (location?.state?.normalized && existing.state && !sameText(location.state.normalized, existing.state)) {
    conflicts.push({ key: 'STATE_CONFLICT', description: 'company states differ' });
  }

  const scoreValue = score(signals);
  let recommendedDisposition: IndustrialDuplicateDisposition = 'NO_MATCH';
  if (signals.some((signal) => signal.key === 'GSTIN_EXACT') || signals.some((signal) => signal.key === 'OFFICIAL_DOMAIN_EXACT')) {
    recommendedDisposition = 'LIKELY_DUPLICATE';
  } else if (signals.some((signal) => signal.key === 'COMPANY_NAME_EXACT') && scoreValue >= 35) {
    recommendedDisposition = 'POSSIBLE_DUPLICATE';
  } else if (signals.some((signal) => signal.key === 'COMPANY_NAME_FUZZY')) {
    recommendedDisposition = 'MANUAL_REVIEW';
  }

  return {
    candidateType: 'COMPANY',
    entityA: incoming,
    entityB: existing,
    score: scoreValue,
    confidence: confidence(scoreValue, signals),
    signals,
    conflicts,
    recommendedDisposition,
  };
}

export function analyzePlantDuplicate(
  incoming: NormalizedIndustrialCandidateInput,
  existing: ComparablePlantRecord,
): DuplicateAnalysis<ComparablePlantRecord> {
  const signals: DuplicateSignal[] = [];
  const conflicts: DuplicateConflict[] = [];
  const incomingPlant = incoming.plant;
  const incomingPlantName = incomingPlant?.plantName?.normalized || incoming.company.companyName.normalized;
  const incomingMarker = extractPlantMarker(incomingPlant?.plantName?.original || incoming.company.companyName.original);
  const existingMarker = extractPlantMarker(existing.plantName);
  const location = incomingPlant?.location || incoming.company.location;

  if (existing.company && sameText(incoming.company.companyName.normalized, existing.company.normalizedName)) {
    addSignal(signals, 'SAME_PARENT_COMPANY', 'MEDIUM', 20, 'same normalized parent company');
  }
  if (sameText(incomingPlantName, existing.normalizedPlantName)) {
    addSignal(signals, 'PLANT_NAME_EXACT', 'MEDIUM', 25, 'normalized plant name exact match');
  }
  if (incomingPlant?.plantCode && sameText(incomingPlant.plantCode, existing.plantCode)) {
    addSignal(signals, 'PLANT_CODE_EXACT', 'STRONG', 35, 'plant code exact match');
  }
  if (location?.pincode?.valid && sameText(location.pincode.normalized, existing.pincode)) {
    addSignal(signals, 'PINCODE_MATCH', 'MEDIUM', 10, 'PIN code match');
  }
  if (location?.city?.normalized && sameText(location.city.normalized, existing.city)) {
    addSignal(signals, 'CITY_MATCH', 'MEDIUM', 10, 'city match');
  }
  if (location?.industrialCluster?.normalized && sameText(location.industrialCluster.normalized, existing.industrialCluster)) {
    addSignal(signals, 'CLUSTER_MATCH', 'MEDIUM', 10, 'industrial cluster match');
  }
  if (location?.address?.normalized && existing.normalizedAddress) {
    const similarity = levenshteinSimilarity(location.address.normalized, existing.normalizedAddress);
    if (similarity >= 0.82) addSignal(signals, 'ADDRESS_SIMILAR', 'MEDIUM', 22, `plant address similarity ${similarity.toFixed(2)}`);
  }

  if (incomingMarker && existingMarker && incomingMarker !== existingMarker) {
    conflicts.push({ key: 'PLANT_MARKER_CONFLICT', description: 'plant/unit markers differ' });
  }
  if (location?.city?.normalized && existing.city && !sameText(location.city.normalized, existing.city)) {
    conflicts.push({ key: 'CITY_CONFLICT', description: 'plant cities differ' });
  }

  const scoreValue = score(signals);
  const hasPlantIdentity = signals.some((signal) => ['PLANT_NAME_EXACT', 'PLANT_CODE_EXACT', 'ADDRESS_SIMILAR'].includes(signal.key));
  let recommendedDisposition: IndustrialDuplicateDisposition = 'NO_MATCH';
  if (
    signals.some((signal) => signal.key === 'SAME_PARENT_COMPANY') &&
    conflicts.some((conflict) => ['PLANT_MARKER_CONFLICT', 'CITY_CONFLICT'].includes(conflict.key))
  ) {
    recommendedDisposition = 'SAME_COMPANY_DIFFERENT_PLANT';
  } else if (hasPlantIdentity && scoreValue >= 55) {
    recommendedDisposition = 'LIKELY_DUPLICATE';
  } else if (signals.some((signal) => signal.key === 'SAME_PARENT_COMPANY') && scoreValue >= 35) {
    recommendedDisposition = 'MANUAL_REVIEW';
  }

  return {
    candidateType: 'PLANT',
    entityA: incoming,
    entityB: existing,
    score: scoreValue,
    confidence: confidence(scoreValue, signals),
    signals,
    conflicts,
    recommendedDisposition,
  };
}

export function analyzeContactDuplicate(
  incoming: NormalizedIndustrialCandidateInput,
  existing: ComparableContactRecord,
): DuplicateAnalysis<ComparableContactRecord> {
  const signals: DuplicateSignal[] = [];
  const conflicts: DuplicateConflict[] = [];
  const contact = incoming.contact;

  if (contact?.phone?.valid && sameText(contact.phone.normalized, existing.normalizedPhone)) {
    addSignal(signals, 'PHONE_EXACT', 'STRONG', 45, 'normalized phone exact match');
  }
  if (contact?.whatsapp?.valid && sameText(contact.whatsapp.normalized, existing.normalizedWhatsapp)) {
    addSignal(signals, 'WHATSAPP_EXACT', 'STRONG', 45, 'normalized WhatsApp exact match');
  }
  if (contact?.email?.valid && sameText(contact.email.normalized, existing.normalizedEmail)) {
    addSignal(signals, 'EMAIL_EXACT', 'STRONG', 45, 'normalized email exact match');
  }
  if (contact?.personName?.normalized && sameText(contact.personName.normalized, existing.normalizedPersonName)) {
    addSignal(signals, 'PERSON_NAME_EXACT', 'MEDIUM', 15, 'normalized person name match');
  }
  if (contact?.department?.normalized && sameText(contact.department.normalized, existing.department)) {
    addSignal(signals, 'DEPARTMENT_MATCH', 'MEDIUM', 8, 'department category match');
  }

  const scoreValue = score(signals);
  const hasExactEmail = signals.some((signal) => ['EMAIL_EXACT'].includes(signal.key));
  const hasExactContactPoint = signals.some((signal) => ['PHONE_EXACT', 'WHATSAPP_EXACT', 'EMAIL_EXACT'].includes(signal.key));
  const recommendedDisposition: IndustrialDuplicateDisposition = hasExactContactPoint
    ? hasExactEmail || scoreValue >= 53
      ? 'CONTACT_MATCH'
      : 'MANUAL_REVIEW'
    : scoreValue >= 25
      ? 'POSSIBLE_DUPLICATE'
      : 'NO_MATCH';

  return {
    candidateType: 'CONTACT',
    entityA: incoming,
    entityB: existing,
    score: scoreValue,
    confidence: confidence(scoreValue, signals),
    signals,
    conflicts,
    recommendedDisposition,
  };
}

export function rankDuplicateAnalyses<T extends { score: number; recommendedDisposition: IndustrialDuplicateDisposition }>(analyses: T[]) {
  const dispositionRank: Record<IndustrialDuplicateDisposition, number> = {
    LIKELY_DUPLICATE: 5,
    CONTACT_MATCH: 5,
    SAME_COMPANY_DIFFERENT_PLANT: 4,
    POSSIBLE_DUPLICATE: 3,
    MANUAL_REVIEW: 2,
    NO_MATCH: 1,
  };
  return [...analyses].sort((left, right) => {
    const dispositionDelta = dispositionRank[right.recommendedDisposition] - dispositionRank[left.recommendedDisposition];
    return dispositionDelta || right.score - left.score;
  });
}
