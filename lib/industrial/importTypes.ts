import type {
  IndustrialImportRowStatus,
  IndustrialImportStatus,
  IndustrialIndustryCategory,
  IndustrialPriority,
  IndustrialServiceType,
  IndustrialSourceType,
  IndustrialVerificationStatus,
} from '@prisma/client';
import type { NormalizedIndustrialCandidateInput } from './types';

export const industrialImportModes = ['COMPANY_PLANT_MASTER', 'CONTACT_ENRICHMENT', 'DISCOVERY_QUEUE', 'GENERIC_MAPPING'] as const;
export type IndustrialImportMode = (typeof industrialImportModes)[number];

export const industrialImportTargetFields = [
  'companyName',
  'legalName',
  'officialWebsite',
  'gstin',
  'pan',
  'plantName',
  'plantAddress',
  'state',
  'city',
  'district',
  'industrialArea',
  'pincode',
  'plantType',
  'contactPerson',
  'designation',
  'department',
  'phone',
  'whatsapp',
  'email',
  'processes',
  'products',
  'capacity',
  'mpiPotential',
  'visualInspectionPotential',
  'grindingFettlingPotential',
  'oilingPackingPotential',
  'managedManpowerPotential',
  'opportunityScore',
  'priority',
  'verificationStatus',
  'contactVerification',
  'researchStatus',
  'sourceType',
  'primarySourceUrl',
  'secondarySourceUrl',
  'researchDate',
  'notes',
  'exclude',
] as const;

export type IndustrialImportTargetField = (typeof industrialImportTargetFields)[number];

export type IndustrialSheetRow = Record<string, string>;

export type IndustrialParsedSheet = {
  name: string;
  headers: string[];
  rows: IndustrialSheetRow[];
  rowCount: number;
  columnCount: number;
  suggestedMode: IndustrialImportMode;
  shouldExclude: boolean;
};

export type IndustrialColumnMapping = Record<string, IndustrialImportTargetField | ''>;

export type IndustrialColumnSuggestion = {
  sourceColumn: string;
  targetField: IndustrialImportTargetField | '';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'AMBIGUOUS';
  reason: string;
};

export type IndustrialImportParseResult = {
  fileName: string;
  fileType: 'csv' | 'xlsx';
  sha256: string;
  sheets: IndustrialParsedSheet[];
  warnings: string[];
};

export type IndustrialImportIssue = {
  code: string;
  message: string;
  field?: IndustrialImportTargetField;
};

export type IndustrialImportClassification =
  | 'NEW_COMPANY'
  | 'MATCH_EXISTING_COMPANY'
  | 'POSSIBLE_COMPANY_DUPLICATE'
  | 'NEW_PLANT'
  | 'MATCH_EXISTING_PLANT'
  | 'SAME_COMPANY_DIFFERENT_PLANT'
  | 'POSSIBLE_PLANT_DUPLICATE'
  | 'NEW_CONTACT'
  | 'MATCH_EXISTING_CONTACT'
  | 'POSSIBLE_CONTACT_DUPLICATE'
  | 'MANUAL_REVIEW'
  | 'INVALID';

export type IndustrialPlannedAction =
  | 'CREATE_NEW_COMPANY'
  | 'USE_EXISTING_COMPANY'
  | 'CREATE_NEW_PLANT'
  | 'USE_EXISTING_PLANT'
  | 'CREATE_NEW_CONTACT'
  | 'USE_EXISTING_CONTACT'
  | 'HOLD_FOR_REVIEW'
  | 'REJECT_ROW'
  | 'SKIP_ANALYTICS_ROW';

export type IndustrialDryRunRow = {
  rowNumber: number;
  sourceSheet: string;
  raw: IndustrialSheetRow;
  normalized?: NormalizedIndustrialCandidateInput;
  validationIssues: IndustrialImportIssue[];
  classifications: IndustrialImportClassification[];
  duplicateSummary: {
    topScore: number;
    signals: string[];
    conflicts: string[];
  };
  verificationStatus: IndustrialVerificationStatus;
  sourceType: IndustrialSourceType;
  industryCategory: IndustrialIndustryCategory;
  priority: IndustrialPriority;
  opportunityScore: number;
  plannedAction: IndustrialPlannedAction;
  reviewStatus: 'APPROVED' | 'HOLD' | 'REJECTED' | 'REVIEW_REQUIRED';
};

export type IndustrialDryRunSummary = {
  totalSourceRows: number;
  validRows: number;
  invalidRows: number;
  newCompanies: number;
  existingCompanyMatches: number;
  possibleCompanyDuplicates: number;
  newPlants: number;
  existingPlantMatches: number;
  possiblePlantDuplicates: number;
  sameCompanyDifferentPlant: number;
  newContacts: number;
  existingContactMatches: number;
  possibleContactDuplicates: number;
  newCapabilities: number;
  newServiceOpportunities: number;
  newSources: number;
  manualReviewRequired: number;
  rejectedRows: number;
  committedRows: number;
};

export type IndustrialImportBatchRaw = {
  phase4: {
    status: string;
    importMode: IndustrialImportMode;
    selectedSheet?: string;
    mapping?: IndustrialColumnMapping;
    sheets: IndustrialParsedSheet[];
    suggestions?: IndustrialColumnSuggestion[];
    dryRunSummary?: IndustrialDryRunSummary;
    reviewDecisions?: Record<string, IndustrialPlannedAction>;
    commitSummary?: Record<string, number>;
    rollbackDesign?: string;
  };
};

export type IndustrialCommitResult = {
  status: IndustrialImportStatus;
  rowsProcessed: number;
  companiesCreated: number;
  plantsCreated: number;
  contactsCreated: number;
  rowsSkipped: number;
  errors: Array<{ rowNumber: number; message: string }>;
};

export type IndustrialImportListFilters = {
  page: number;
  limit: number;
  status: string;
  mode: string;
};

export type IndustrialImportRowFilters = {
  page: number;
  limit: number;
  classification: string;
  reviewStatus: string;
  state: string;
  industry: string;
  validStatus: string;
};

export type IndustrialPersistedRowShape = {
  dryRun: IndustrialDryRunRow;
  normalized: NormalizedIndustrialCandidateInput | null;
  services: IndustrialServiceType[];
};

export function toImportRowStatus(row: IndustrialDryRunRow): IndustrialImportRowStatus {
  if (row.classifications.includes('INVALID')) return 'INVALID';
  if (row.reviewStatus === 'REVIEW_REQUIRED') return 'DUPLICATE_CANDIDATE';
  return 'READY_TO_COMMIT';
}

