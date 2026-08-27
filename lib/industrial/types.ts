import type { IndustrialIndustryCategory, IndustrialServiceType } from '@prisma/client';

export type NormalizedField = {
  original: string;
  normalized: string;
  valid: boolean;
};

export type NormalizedCompanyName = {
  original: string;
  normalized: string;
  displayName: string;
};

export type NormalizedDomain = {
  original: string;
  normalized: string;
  valid: boolean;
  reason?: string;
};

export type NormalizedGstin = NormalizedField & {
  stateCode?: string;
};

export type NormalizedPhone = NormalizedField & {
  countryCode?: string;
  nationalNumber?: string;
  e164?: string;
  type: 'MOBILE' | 'LANDLINE' | 'UNKNOWN';
  confidence: 'HIGH' | 'LOW';
};

export type NormalizedEmail = NormalizedField;

export type NormalizedLocation = {
  country?: NormalizedField;
  region?: NormalizedField;
  state?: NormalizedField;
  district?: NormalizedField;
  city?: NormalizedField;
  industrialCluster?: NormalizedField;
  industrialArea?: NormalizedField;
  pincode?: NormalizedField;
  address?: NormalizedField;
};

export type NormalizedDepartment = {
  original: string;
  normalized: IndustrialDepartmentCategory;
  valid: boolean;
};

export type IndustrialDepartmentCategory =
  | 'QUALITY'
  | 'NDT_MPI'
  | 'PURCHASE_PROCUREMENT'
  | 'SUPPLY_CHAIN'
  | 'HR'
  | 'PRODUCTION_OPERATIONS'
  | 'MAINTENANCE'
  | 'ADMINISTRATION'
  | 'PLANT_FACTORY'
  | 'SALES'
  | 'MANAGEMENT'
  | 'OTHER';

export type NormalizedProcess = {
  sourceLabel: string;
  normalized: IndustrialProcessCategory;
  industryCategory: IndustrialIndustryCategory;
  valid: boolean;
};

export type IndustrialProcessCategory =
  | 'FORGING'
  | 'RING_ROLLING'
  | 'ROLLING_MILL'
  | 'RE_ROLLING_MILL'
  | 'SPONGE_IRON_DRI'
  | 'INDUCTION_FURNACE'
  | 'ELECTRIC_ARC_FURNACE'
  | 'BILLET_INGOT'
  | 'SPECIAL_ALLOY_STEEL'
  | 'FOUNDRY_CASTING'
  | 'HEAT_TREATMENT'
  | 'MACHINING'
  | 'AUTOMOTIVE_COMPONENTS'
  | 'OTHER_MANUFACTURING';

export type NormalizedServiceOpportunity = {
  sourceLabel: string;
  normalized: IndustrialServiceType;
  valid: boolean;
};

export type NormalizedCompanyInput = {
  originalName: string;
  companyName: NormalizedCompanyName;
  officialDomain?: NormalizedDomain;
  gstin?: NormalizedGstin;
  location?: NormalizedLocation;
  industryCategory?: IndustrialIndustryCategory;
  processLabels: NormalizedProcess[];
  source?: NormalizedSourceInput;
};

export type NormalizedPlantInput = {
  companyName: NormalizedCompanyName;
  plantName?: NormalizedCompanyName;
  plantCode?: string;
  location?: NormalizedLocation;
  processLabels: NormalizedProcess[];
  source?: NormalizedSourceInput;
};

export type NormalizedContactInput = {
  companyName: NormalizedCompanyName;
  plantName?: NormalizedCompanyName;
  personName?: NormalizedField;
  designation?: NormalizedField;
  department?: NormalizedDepartment;
  phone?: NormalizedPhone;
  whatsapp?: NormalizedPhone;
  email?: NormalizedEmail;
  source?: NormalizedSourceInput;
};

export type NormalizedCapabilityInput = {
  sourceLabel: string;
  process?: NormalizedProcess;
  product?: NormalizedField;
  material?: NormalizedField;
  capacityText?: string;
  source?: NormalizedSourceInput;
};

export type NormalizedOpportunityInput = {
  sourceLabel: string;
  serviceType: NormalizedServiceOpportunity;
  evidence?: string;
  estimatedNeed?: string;
  source?: NormalizedSourceInput;
};

export type NormalizedSourceInput = {
  sourceSystem?: string;
  sourceUrl?: NormalizedDomain;
  sourceTitle?: string;
  sheetName?: string;
  sheetTab?: string;
  rowNumber?: number;
};

export type NormalizedIndustrialCandidateInput = {
  company: NormalizedCompanyInput;
  plant?: NormalizedPlantInput;
  contact?: NormalizedContactInput;
  capabilities?: NormalizedCapabilityInput[];
  opportunities?: NormalizedOpportunityInput[];
  source?: NormalizedSourceInput;
};
