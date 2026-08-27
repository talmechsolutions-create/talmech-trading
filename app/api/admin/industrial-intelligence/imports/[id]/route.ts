import { NextRequest } from 'next/server';
import { apiOk } from '@/lib/security/apiResponse';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialViewApi } from '@/lib/industrialIntelligenceApi';
import { getIndustrialImportBatch, parseIndustrialImportRowFilters } from '@/lib/industrial/importService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialViewApi(req);
  if (!access.ok) return access.response;
  try {
    const result = await getIndustrialImportBatch(params.id, parseIndustrialImportRowFilters(req.nextUrl.searchParams));
    return apiOk(result, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}

