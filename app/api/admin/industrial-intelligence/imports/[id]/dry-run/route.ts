import { NextRequest } from 'next/server';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission } from '@/lib/industrialIntelligenceApi';
import { runIndustrialImportDryRun } from '@/lib/industrial/importService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.import');
  if (!access.ok) return access.response;
  try {
    const batch = await runIndustrialImportDryRun(params.id, access.actor.username);
    return apiOk({ batch }, { headers: industrialNoStoreHeaders });
  } catch (error) {
    if (error instanceof Error) return apiError(error.message, 'Unable to run controlled dry run.', 400);
    return industrialApiFailure(error);
  }
}

