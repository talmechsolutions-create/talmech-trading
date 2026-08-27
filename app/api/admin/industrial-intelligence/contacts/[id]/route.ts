import { NextRequest } from 'next/server';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission } from '@/lib/industrialIntelligenceApi';
import { updateManualIndustrialContact } from '@/lib/industrial/managementService';
import { apiOk } from '@/lib/security/apiResponse';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.edit');
  if (!access.ok) return access.response;

  try {
    const result = await updateManualIndustrialContact(params.id, await req.json(), access.actor.username);
    return apiOk(result, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}
