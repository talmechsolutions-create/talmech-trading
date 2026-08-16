import { NextRequest } from 'next/server';
import { getIndustrialSummary } from '@/lib/industrialIntelligenceService';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialViewApi } from '@/lib/industrialIntelligenceApi';
import { apiOk } from '@/lib/security/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const access = requireIndustrialViewApi(req);
  if (!access.ok) return access.response;

  try {
    const result = await getIndustrialSummary();
    return apiOk({ ...result.data, schemaReady: result.schemaReady, updatedAt: new Date().toISOString() }, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}
