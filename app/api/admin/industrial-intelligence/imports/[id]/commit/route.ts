import { NextRequest } from 'next/server';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission } from '@/lib/industrialIntelligenceApi';
import { commitIndustrialImportBatch } from '@/lib/industrial/importService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.import');
  if (!access.ok) return access.response;
  try {
    const result = await commitIndustrialImportBatch(params.id, access.actor.username);
    return apiOk({ result }, { headers: industrialNoStoreHeaders });
  } catch (error) {
    if (error instanceof Error) return apiError(error.message, 'Unable to commit import batch.', 400);
    return industrialApiFailure(error);
  }
}

