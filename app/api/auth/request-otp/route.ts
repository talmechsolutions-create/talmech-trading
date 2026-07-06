import { NextResponse } from 'next/server';
import {
  createOtpChallenge,
  deliverOtp,
  isOtpProviderConfigured,
  normalizeOtpContact,
} from '@/lib/otpStore';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const normalized = normalizeOtpContact(body.contact || body.mobile || body.email, body.channel);

  if (!normalized.ok) {
    return NextResponse.json({ ok: false, error: normalized.error }, { status: 400 });
  }

  const purpose = sanitizeString(body.purpose || 'onboarding', 60) || 'onboarding';

  if (process.env.NODE_ENV === 'production' && !isOtpProviderConfigured(normalized.channel)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'OTP delivery provider is not configured for production.',
        errorCode: 'OTP_PROVIDER_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  const challenge = createOtpChallenge({
    contact: normalized.contact,
    channel: normalized.channel,
    purpose,
  });

  if (!challenge.ok) {
    return NextResponse.json(
      { ok: false, error: challenge.error, retryAfterSeconds: challenge.retryAfterSeconds },
      { status: challenge.status }
    );
  }

  const delivery = await deliverOtp({
    contact: normalized.contact,
    channel: normalized.channel,
    purpose,
    otp: challenge.otp,
  });

  if (process.env.NODE_ENV === 'production' && !delivery.sent) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to deliver OTP. Please contact Talmech support.',
        errorCode: 'OTP_DELIVERY_FAILED',
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    channel: normalized.channel,
    contact:
      normalized.channel === 'sms'
        ? `******${normalized.contact.slice(-4)}`
        : normalized.contact.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
    expiresAt: challenge.expiresAt,
    retryAfterSeconds: challenge.retryAfterSeconds,
    delivery,
    developmentOnlyOtp: process.env.NODE_ENV === 'production' ? undefined : challenge.otp,
  });
}
