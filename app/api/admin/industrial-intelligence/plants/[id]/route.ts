import { NextRequest } from 'next/server';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission, requireIndustrialViewApi } from '@/lib/industrialIntelligenceApi';
import { getIndustrialPlantDetail } from '@/lib/industrialIntelligenceService';
import { updateManualIndustrialPlant } from '@/lib/industrial/managementService';
import { apiError, apiOk } from '@/lib/security/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialViewApi(req);
  if (!access.ok) return access.response;

  try {
    const result = await getIndustrialPlantDetail(params.id);
    if (result.schemaReady && !result.data) return apiError('INDUSTRIAL_PLANT_NOT_FOUND', 'Industrial plant not found.', 404);
    return apiOk({ plant: result.data, schemaReady: result.schemaReady, updatedAt: new Date().toISOString() }, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.edit');
  if (!access.ok) return access.response;

  try {
    const result = await updateManualIndustrialPlant(params.id, await req.json(), access.actor.username);
    return apiOk(result, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}
