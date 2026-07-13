import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { importOutreachProspects } from '@/lib/outreachStore';
import { auditAdminAction } from '@/lib/security/auditLog';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { publicStorageError } from '@/lib/storageMode';
import { sanitizeMultiline } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return apiError('ADMIN_AUTH_REQUIRED', 'Admin authentication required.', 401);

  const limited = await rateLimitResponse(req, { keyPrefix: 'outreach-import', limit: 12, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const text = sanitizeMultiline(body.text || body.paste, 30000);
  if (!text) return apiError('IMPORT_TEXT_REQUIRED', 'Paste at least one prospect row.', 400);

  try {
    const result = await importOutreachProspects(text, {
      businessType: body.businessType,
      source: body.source,
      consentStatus: body.consentStatus,
      industryTags: body.industryTags,
    });
    await auditAdminAction({
      action: 'OUTREACH_PROSPECT_IMPORT',
      entity: 'OutreachProspect',
      note: `imported:${result.imported.length};skipped:${result.skipped.length}`,
    });
    return apiOk(result);
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    console.error('OUTREACH_IMPORT_FAILED', error);
    return apiError('OUTREACH_IMPORT_FAILED', 'Unable to import prospects.', 500);
  }
}
