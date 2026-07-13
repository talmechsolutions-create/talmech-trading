import { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { markOutreachWhatsapp } from '@/lib/outreachStore';
import { auditAdminAction } from '@/lib/security/auditLog';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return apiError('ADMIN_AUTH_REQUIRED', 'Admin authentication required.', 401);

  const body = await req.json().catch(() => ({}));
  const prospectId = sanitizeString(body.prospectId, 100);
  const templateId = sanitizeString(body.templateId, 120);
  if (!prospectId) return apiError('PROSPECT_ID_REQUIRED', 'Prospect id is required.', 400);

  const result = await markOutreachWhatsapp(prospectId, templateId);
  if (!result.ok) return apiError((result as any).code || 'WHATSAPP_MARK_FAILED', (result as any).message || 'Unable to prepare WhatsApp message.', (result as any).code === 'NOT_FOUND' ? 404 : 400);

  await auditAdminAction({
    action: 'OUTREACH_WHATSAPP_PREPARED',
    entity: 'OutreachProspect',
    entityId: result.prospect.prospectId,
    note: 'manual-click-to-chat',
  });
  return apiOk(result);
}
