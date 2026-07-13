import { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { optOutOutreachProspect } from '@/lib/outreachStore';
import { auditAdminAction } from '@/lib/security/auditLog';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return apiError('ADMIN_AUTH_REQUIRED', 'Admin authentication required.', 401);

  const body = await req.json().catch(() => ({}));
  try {
    const result = await optOutOutreachProspect(body);
    if (!result.ok) return apiError(result.code, (result as any).message || 'Unable to update opt-out preference.', 400);
    await auditAdminAction({
      action: 'OUTREACH_OPT_OUT',
      entity: 'OutreachProspect',
      entityId: result.prospect.prospectId,
      note: 'do-not-contact',
    });
    return apiOk(result);
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return apiError(storageError.code, storageError.message, storageError.status);
    console.error('OUTREACH_OPT_OUT_FAILED', error);
    return apiError('OUTREACH_OPT_OUT_FAILED', 'Unable to update opt-out preference.', 500);
  }
}
