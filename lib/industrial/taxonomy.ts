import type { IndustrialIndustryCategory, IndustrialServiceType } from '@prisma/client';
import { normalizeBasicText } from './text';
import {
  IndustrialDepartmentCategory,
  IndustrialProcessCategory,
  NormalizedDepartment,
  NormalizedProcess,
  NormalizedServiceOpportunity,
} from './types';

const departmentMap: Array<[RegExp, IndustrialDepartmentCategory]> = [
  [/\b(qa|quality assurance|quality|qc|quality control)\b/, 'QUALITY'],
  [/\b(ndt|mpi|magnetic particle inspection)\b/, 'NDT_MPI'],
  [/\b(purchase|purchasing|procurement)\b/, 'PURCHASE_PROCUREMENT'],
  [/\b(scm|supply chain)\b/, 'SUPPLY_CHAIN'],
  [/\b(hr|human resources)\b/, 'HR'],
  [/\b(production|operations)\b/, 'PRODUCTION_OPERATIONS'],
  [/\bmaintenance\b/, 'MAINTENANCE'],
  [/\b(admin|administration)\b/, 'ADMINISTRATION'],
  [/\b(plant|factory)\b/, 'PLANT_FACTORY'],
  [/\bsales\b/, 'SALES'],
  [/\b(management|director|owner)\b/, 'MANAGEMENT'],
];

const processMap: Array<[RegExp, IndustrialProcessCategory, IndustrialIndustryCategory]> = [
  [/\b(ring rolling|ring forging)\b/, 'RING_ROLLING', 'FORGING'],
  [/\b(forging|forge|forged components?)\b/, 'FORGING', 'FORGING'],
  [/\b(re rolling|rerolling|re rolling mill|re-rolling mill)\b/, 'RE_ROLLING_MILL', 'STEEL'],
  [/\b(rolling mill)\b/, 'ROLLING_MILL', 'STEEL'],
  [/\b(sponge iron|dri)\b/, 'SPONGE_IRON_DRI', 'STEEL'],
  [/\b(induction furnace|if)\b/, 'INDUCTION_FURNACE', 'STEEL'],
  [/\b(electric arc furnace|eaf)\b/, 'ELECTRIC_ARC_FURNACE', 'STEEL'],
  [/\b(billet|ingot)\b/, 'BILLET_INGOT', 'STEEL'],
  [/\b(special steel|alloy steel)\b/, 'SPECIAL_ALLOY_STEEL', 'STEEL'],
  [/\b(foundry|casting)\b/, 'FOUNDRY_CASTING', 'OTHER_MANUFACTURING'],
  [/\b(heat treatment|ht)\b/, 'HEAT_TREATMENT', 'OTHER_MANUFACTURING'],
  [/\b(machining|cnc machining)\b/, 'MACHINING', 'OTHER_MANUFACTURING'],
  [/\b(automotive components?|auto components?)\b/, 'AUTOMOTIVE_COMPONENTS', 'OTHER_MANUFACTURING'],
];

const serviceMap: Array<[RegExp, IndustrialServiceType]> = [
  [/\b(mp inspection|mpi|magnetic particle inspection|ndt)\b/, 'MPI_NDT'],
  [/\bvisual inspection\b/, 'VISUAL_INSPECTION'],
  [/\bgrinding\b/, 'GRINDING'],
  [/\bfettling\b/, 'FETTLING'],
  [/\bsorting\b/, 'SORTING'],
  [/\bsegregation\b/, 'SEGREGATION'],
  [/\brework\b/, 'REWORK'],
  [/\boiling\b/, 'OILING'],
  [/\bpacking\b/, 'PACKING'],
  [/\bmaterial handling\b/, 'MATERIAL_HANDLING'],
  [/\bproduction support\b/, 'PRODUCTION_SUPPORT'],
  [/\bquality containment\b/, 'QUALITY_CONTAINMENT'],
  [/\b(managed manpower|manpower)\b/, 'MANAGED_MANPOWER'],
];

export function normalizeDepartment(value: string): NormalizedDepartment {
  const original = String(value || '').trim();
  const text = normalizeBasicText(original);
  const match = departmentMap.find(([pattern]) => pattern.test(text));
  return {
    original,
    normalized: match ? match[1] : 'OTHER',
    valid: Boolean(original),
  };
}

export function normalizeProcessLabel(value: string): NormalizedProcess {
  const sourceLabel = String(value || '').trim();
  const text = normalizeBasicText(sourceLabel);
  const match = processMap.find(([pattern]) => pattern.test(text));
  return {
    sourceLabel,
    normalized: match ? match[1] : 'OTHER_MANUFACTURING',
    industryCategory: match ? match[2] : 'OTHER_MANUFACTURING',
    valid: Boolean(match),
  };
}

export function normalizeServiceOpportunity(value: string): NormalizedServiceOpportunity {
  const sourceLabel = String(value || '').trim();
  const text = normalizeBasicText(sourceLabel);
  const match = serviceMap.find(([pattern]) => pattern.test(text));
  return {
    sourceLabel,
    normalized: match ? match[1] : 'OTHER_INDUSTRIAL_SERVICES',
    valid: Boolean(sourceLabel),
  };
}
