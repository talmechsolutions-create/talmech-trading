import { NextRequest } from 'next/server';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialViewApi } from '@/lib/industrialIntelligenceApi';
import { parseIndustrialCompanyFilters } from '@/lib/industrialIntelligenceQuery';
import { listIndustrialCompanies } from '@/lib/industrialIntelligenceService';
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
