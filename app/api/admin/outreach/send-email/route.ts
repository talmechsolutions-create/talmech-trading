import { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { sendOutreachEmail } from '@/lib/outreachStore';
import { auditAdminAction } from '@/lib/security/auditLog';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { publicStorageError } from '@/lib/storageMode';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return apiError('ADMIN_AUTH_REQUIRED', 'Admin authentication required.', 401);

  const limited = await rateLimitResponse(req, { keyPrefix: 'outreach-send-email', limit: 20, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const prospectId = sanitizeString(body.prospectId, 100);
  const templateId = sanitizeString(body.templateId, 120);
  if (!prospectId) return apiError('PROSPECT_ID_REQUIRED', 'Prospect id is required.', 400);

  try {
    const result = await sendOutreachEmail(prospectId, templateId);
    if (!result.ok) return apiError(result.code, result.message, result.code === 'NOT_FOUND' ? 404 : 400);
    await auditAdminAction({
      action: 'OUTREACH_EMAIL_SEND_ATTEMPT',
      entity: 'OutreachProspect',
      entityId: result.prospect.prospectId,
      note: `status:${result.send.status};provider:${result.send.provider}`,
    });
    return apiOk(result);
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return apiError(storageError.code, storageError.message, storageError.status);
    console.error('OUTREACH_EMAIL_SEND_FAILED', error);
    return apiError('OUTREACH_EMAIL_SEND_FAILED', 'Unable to send or prepare outreach email.', 500);
  }
}
