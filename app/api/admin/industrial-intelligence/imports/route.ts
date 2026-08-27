import { NextRequest } from 'next/server';
import { apiOk } from '@/lib/security/apiResponse';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialViewApi } from '@/lib/industrialIntelligenceApi';
import { listIndustrialImportBatches, parseIndustrialImportListFilters } from '@/lib/industrial/importService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const access = requireIndustrialViewApi(req);
  if (!access.ok) return access.response;
  try {
    const result = await listIndustrialImportBatches(parseIndustrialImportListFilters(req.nextUrl.searchParams));
    return apiOk(result, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}

