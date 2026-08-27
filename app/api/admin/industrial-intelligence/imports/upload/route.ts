import { NextRequest } from 'next/server';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission } from '@/lib/industrialIntelligenceApi';
import { createIndustrialImportBatch } from '@/lib/industrial/importService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.import');
  if (!access.ok) return access.response;
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return apiError('IMPORT_FILE_REQUIRED', 'Upload a CSV or XLSX file.', 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await createIndustrialImportBatch({
      fileName: file.name,
      mimeType: file.type,
      bytes,
      actor: access.actor.username,
      importMode: String(formData.get('importMode') || ''),
      sourceSystem: String(formData.get('sourceSystem') || 'ADMIN_UPLOAD'),
    });
    return apiOk(result, { headers: industrialNoStoreHeaders });
  } catch (error) {
    if (error instanceof Error) return apiError(error.message, 'Unable to parse import file safely.', 400);
    return industrialApiFailure(error);
  }
}

