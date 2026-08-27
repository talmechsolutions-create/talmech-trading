import { NextRequest } from 'next/server';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission, requireIndustrialViewApi } from '@/lib/industrialIntelligenceApi';
import { parseIndustrialCompanyFilters } from '@/lib/industrialIntelligenceQuery';
import { listIndustrialCompanies } from '@/lib/industrialIntelligenceService';
import { createManualIndustrialCompany } from '@/lib/industrial/managementService';
import { apiOk } from '@/lib/security/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const access = requireIndustrialViewApi(req);
  if (!access.ok) return access.response;

  try {
    const filters = parseIndustrialCompanyFilters(req.nextUrl.searchParams);
    const result = await listIndustrialCompanies(filters);
    return apiOk({ ...result.data, filters, schemaReady: result.schemaReady, updatedAt: new Date().toISOString() }, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}

export async function POST(req: NextRequest) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.edit');
  if (!access.ok) return access.response;

  try {
    const result = await createManualIndustrialCompany(await req.json(), access.actor.username);
    const status = result.status === 'DUPLICATE_REVIEW_REQUIRED' ? 409 : 201;
    return apiOk(result, { status, headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}
