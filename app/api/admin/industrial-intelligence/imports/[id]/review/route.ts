import { NextRequest } from 'next/server';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission } from '@/lib/industrialIntelligenceApi';
import { reviewIndustrialImportRows } from '@/lib/industrial/importService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.import');
  if (!access.ok) return access.response;
  try {
    const body = await req.json().catch(() => ({}));
    if (!Array.isArray(body.decisions)) return apiError('IMPORT_REVIEW_DECISIONS_REQUIRED', 'Provide review decisions.', 400);
    const result = await reviewIndustrialImportRows({ batchId: params.id, actor: access.actor.username, decisions: body.decisions });
    return apiOk(result, { headers: industrialNoStoreHeaders });
  } catch (error) {
    if (error instanceof Error) return apiError(error.message, 'Unable to save review decision.', 400);
    return industrialApiFailure(error);
  }
}

