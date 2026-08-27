import { NextRequest } from 'next/server';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission } from '@/lib/industrialIntelligenceApi';
import { confirmIndustrialImportMapping } from '@/lib/industrial/importService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.import');
  if (!access.ok) return access.response;
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.sheetName || !body.mapping || typeof body.mapping !== 'object') {
      return apiError('IMPORT_MAPPING_REQUIRED', 'Select a sheet and provide reviewed column mapping.', 400);
    }
    const batch = await confirmIndustrialImportMapping({
      batchId: params.id,
      actor: access.actor.username,
      sheetName: String(body.sheetName),
      mapping: body.mapping,
      importMode: body.importMode,
    });
    return apiOk({ batch }, { headers: industrialNoStoreHeaders });
  } catch (error) {
    if (error instanceof Error) return apiError(error.message, 'Unable to confirm import mapping.', 400);
    return industrialApiFailure(error);
  }
}

