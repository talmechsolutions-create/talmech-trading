import { randomInt, randomUUID, createHash } from 'crypto';
import { sendOrQueueEmail } from '@/lib/email';
import { sanitizeString } from '@/lib/validation';

type Challenge = {
  id: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  clientKey: string;
};

const g = globalThis as unknown as { talmechAdminMfa?: Map<string, Challenge> };
g.talmechAdminMfa ||= new Map();

function hashOtp(otp: string, id: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'local-admin-mfa-secret';
  return createHash('sha256').update(`${id}:${otp}:${secret}`).digest('hex');
}

export function isAdminMfaEnabled() {
  return String(process.env.ADMIN_MFA_ENABLED || '').toLowerCase() === 'true';
}

export function adminMfaEmail() {
  return sanitizeString(process.env.ADMIN_MFA_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL, 254);
}

export async function createAdminMfaChallenge(clientKey: string) {
  const email = adminMfaEmail();
  if (!email) {
    return { ok: false as const, error: 'ADMIN_MFA_EMAIL is required when ADMIN_MFA_ENABLED=true.' };
  }

  const id = randomUUID();
  const otp = String(randomInt(100000, 1000000));
  const challenge: Challenge = {
    id,
    otpHash: hashOtp(otp, id),
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
    clientKey,
  };
  g.talmechAdminMfa!.set(id, challenge);

  const delivery = await sendOrQueueEmail({
    to: email,
    subject: 'Talmech admin login verification code',
    leadId: `ADMIN-MFA-${Date.now()}`,
    html: `<p>Your Talmech admin verification code is <b>${otp}</b>.</p><p>This code expires in 10 minutes. If you did not request it, rotate admin credentials immediately.</p>`,
    text: `Your Talmech admin verification code is ${otp}. It expires in 10 minutes.`,
  });

  return {
    ok: true as const,
    challengeId: id,
    expiresAt: new Date(challenge.expiresAt).toISOString(),
    delivery,
    developmentOnlyOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
  };
}

export function verifyAdminMfaChallenge(challengeId: unknown, otpValue: unknown, clientKey: string) {
  const id = sanitizeString(challengeId, 120);
  const otp = sanitizeString(otpValue, 12).replace(/\D/g, '');
  const challenge = g.talmechAdminMfa!.get(id);
  if (!challenge) return { ok: false as const, error: 'Verification challenge not found.' };
  if (challenge.clientKey !== clientKey) return { ok: false as const, error: 'Verification challenge does not match this session.' };
  if (challenge.expiresAt < Date.now()) {
    g.talmechAdminMfa!.delete(id);
    return { ok: false as const, error: 'Verification code expired.' };
  }
  if (!/^\d{6}$/.test(otp)) return { ok: false as const, error: 'Enter the 6 digit verification code.' };

  challenge.attempts += 1;
  if (challenge.attempts > 5) {
    g.talmechAdminMfa!.delete(id);
    return { ok: false as const, error: 'Too many verification attempts.' };
  }

  if (hashOtp(otp, id) !== challenge.otpHash) {
    return { ok: false as const, error: 'Invalid verification code.' };
  }

  g.talmechAdminMfa!.delete(id);
  return { ok: true as const };
}
