import { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { updateOutreachProspect } from '@/lib/outreachStore';
import { auditAdminAction } from '@/lib/security/auditLog';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

function resultStatus(code: string) {
  if (code === 'NOT_FOUND') return 404;
  if (code === 'DUPLICATE_PROSPECT') return 409;
  return 400;
}

export async function PATCH(req: NextRequest, { params }: { params: { prospectId: string } }) {
  if (!requireAdmin(req)) return apiError('ADMIN_AUTH_REQUIRED', 'Admin authentication required.', 401);

  const body = await req.json().catch(() => ({}));
  try {
    const result = await updateOutreachProspect(params.prospectId, body);
    if (!result.ok) {
      return apiError(result.code, (result as any).message || 'Prospect could not be updated.', resultStatus(result.code), {
        issues: (result as any).issues,
        duplicate: (result as any).duplicate,
      });
    }
    await auditAdminAction({
      action: 'OUTREACH_PROSPECT_UPDATED',
      entity: 'OutreachProspect',
      entityId: result.prospect.prospectId,
      note: result.prospect.outreachStatus,
    });
    return apiOk({ prospect: result.prospect });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return apiError(storageError.code, storageError.message, storageError.status);
    console.error('OUTREACH_PROSPECT_UPDATE_FAILED', error);
    return apiError('OUTREACH_PROSPECT_UPDATE_FAILED', 'Unable to update prospect.', 500);
  }
}
