import { NextRequest } from 'next/server';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialViewApi } from '@/lib/industrialIntelligenceApi';
import { getIndustrialCompanyDetail } from '@/lib/industrialIntelligenceService';
import { apiError, apiOk } from '@/lib/security/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialViewApi(req);
  if (!access.ok) return access.response;

  try {
    const result = await getIndustrialCompanyDetail(params.id);
    if (result.schemaReady && !result.data) return apiError('INDUSTRIAL_COMPANY_NOT_FOUND', 'Industrial company not found.', 404);
    return apiOk({ company: result.data, schemaReady: result.schemaReady, updatedAt: new Date().toISOString() }, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}
