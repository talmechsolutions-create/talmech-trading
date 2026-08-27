import { NextRequest } from 'next/server';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission } from '@/lib/industrialIntelligenceApi';
import { createIndustrialResearchProspect } from '@/lib/industrial/managementService';
import { apiOk } from '@/lib/security/apiResponse';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.edit');
  if (!access.ok) return access.response;

  try {
    const result = await createIndustrialResearchProspect(await req.json(), access.actor.username);
    const status = result.status === 'DUPLICATE_REVIEW_REQUIRED' ? 409 : 201;
    return apiOk(result, { status, headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}
