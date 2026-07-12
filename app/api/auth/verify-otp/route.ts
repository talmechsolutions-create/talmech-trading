import { NextResponse } from 'next/server';
import { normalizeOtpContact, verifyOtpChallenge } from '@/lib/otpStore';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ipLimit = await rateLimitResponse(req, { keyPrefix: 'otp-verify-ip', limit: 30, windowMs: 15 * 60 * 1000 });
  if (ipLimit) return ipLimit;

  const body = await req.json().catch(() => ({}));
  const normalized = normalizeOtpContact(body.contact || body.mobile || body.email, body.channel);

  if (!normalized.ok) {
    return NextResponse.json({ ok: false, error: normalized.error }, { status: 400 });
  }

  const contactLimit = await rateLimitResponse(req, { keyPrefix: 'otp-verify-contact', identifier: normalized.contact, limit: 8, windowMs: 15 * 60 * 1000 });
  if (contactLimit) return contactLimit;

  const otp = sanitizeString(body.otp, 8).replace(/\D/g, '');
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json({ ok: false, error: 'Enter the 6 digit OTP.' }, { status: 400 });
  }

  const purpose = sanitizeString(body.purpose || 'onboarding', 60) || 'onboarding';
  const result = verifyOtpChallenge({ contact: normalized.contact, purpose, otp });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    verified: true,
    verifiedAt: result.verifiedAt,
  });
}
