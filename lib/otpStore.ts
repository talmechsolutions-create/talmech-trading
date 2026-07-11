import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { getOtpEmailFrom } from '@/lib/emailConfig';
import {
  isValidEmail,
  isValidIndianMobile,
  normalizeEmail,
  normalizeIndianMobile,
  sanitizeString,
} from '@/lib/validation';

type OtpChannel = 'sms' | 'email';

type OtpRecord = {
  contact: string;
  channel: OtpChannel;
  purpose: string;
  hash: string;
  expiresAt: number;
  attempts: number;
  requestCount: number;
  windowStartedAt: number;
  lastRequestedAt: number;
};

type OtpGlobal = {
  talmechOtpRecords?: Map<string, OtpRecord>;
};

const g = globalThis as unknown as OtpGlobal;
g.talmechOtpRecords ||= new Map<string, OtpRecord>();

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_REQUESTS_PER_WINDOW = 5;
const OTP_MAX_VERIFY_ATTEMPTS = 5;

function otpSecret() {
  return (
    process.env.OTP_HASH_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'development-only-otp-secret'
  );
}

function hashOtp(contact: string, purpose: string, otp: string) {
  return createHmac('sha256', otpSecret()).update(`${purpose}:${contact}:${otp}`).digest('hex');
}

function safeCompareHex(a: string, b: string) {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function normalizeOtpContact(contact: unknown, preferredChannel?: unknown) {
  const channelHint = sanitizeString(preferredChannel, 20).toLowerCase();
  const raw = sanitizeString(contact, 254);

  if (channelHint === 'email' || raw.includes('@')) {
    const email = normalizeEmail(raw);
    return isValidEmail(email)
      ? { ok: true as const, contact: email, channel: 'email' as const }
      : { ok: false as const, error: 'Enter a valid email address for OTP.' };
  }

  const mobile = normalizeIndianMobile(raw);
  return isValidIndianMobile(mobile)
    ? { ok: true as const, contact: mobile, channel: 'sms' as const }
    : { ok: false as const, error: 'Enter a valid 10 digit Indian mobile number for OTP.' };
}

function recordKey(contact: string, purpose: string) {
  return `${purpose}:${contact}`;
}

export function isOtpProviderConfigured(channel: OtpChannel) {
  if (channel === 'sms') {
    return Boolean(process.env.OTP_PROVIDER_ENDPOINT && process.env.OTP_PROVIDER_API_KEY);
  }
  return Boolean(process.env.OTP_PROVIDER_ENDPOINT && process.env.OTP_PROVIDER_API_KEY);
}

export async function deliverOtp({
  contact,
  channel,
  purpose,
  otp,
}: {
  contact: string;
  channel: OtpChannel;
  purpose: string;
  otp: string;
}) {
  const endpoint = process.env.OTP_PROVIDER_ENDPOINT?.trim();
  const apiKey = process.env.OTP_PROVIDER_API_KEY?.trim();

  if (!endpoint || !apiKey) {
    return { sent: false, provider: 'not-configured' };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      channel,
      contact,
      purpose,
      message: `Your Talmech OTP is ${otp}. It expires in 5 minutes.`,
      ...(channel === 'email' && getOtpEmailFrom() ? { from: getOtpEmailFrom() } : {}),
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { sent: false, provider: 'otp-provider', status: response.status };
  }

  return { sent: true, provider: 'otp-provider', status: response.status };
}

export function createOtpChallenge({
  contact,
  channel,
  purpose,
}: {
  contact: string;
  channel: OtpChannel;
  purpose: string;
}) {
  const now = Date.now();
  const key = recordKey(contact, purpose);
  const existing = g.talmechOtpRecords!.get(key);
  const windowStartedAt =
    existing && now - existing.windowStartedAt < OTP_REQUEST_WINDOW_MS
      ? existing.windowStartedAt
      : now;
  const requestCount =
    existing && now - existing.windowStartedAt < OTP_REQUEST_WINDOW_MS
      ? existing.requestCount + 1
      : 1;

  if (existing && now - existing.lastRequestedAt < OTP_RESEND_MS) {
    return {
      ok: false as const,
      status: 429,
      error: 'Please wait before requesting another OTP.',
      retryAfterSeconds: Math.ceil((OTP_RESEND_MS - (now - existing.lastRequestedAt)) / 1000),
    };
  }

  if (requestCount > OTP_MAX_REQUESTS_PER_WINDOW) {
    return {
      ok: false as const,
      status: 429,
      error: 'Too many OTP requests. Please try again later.',
      retryAfterSeconds: Math.ceil(
        (OTP_REQUEST_WINDOW_MS - (now - windowStartedAt)) / 1000
      ),
    };
  }

  const otp = String(randomInt(100000, 1000000));
  const record: OtpRecord = {
    contact,
    channel,
    purpose,
    hash: hashOtp(contact, purpose, otp),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    requestCount,
    windowStartedAt,
    lastRequestedAt: now,
  };

  g.talmechOtpRecords!.set(key, record);

  return {
    ok: true as const,
    otp,
    expiresAt: new Date(record.expiresAt).toISOString(),
    retryAfterSeconds: Math.ceil(OTP_RESEND_MS / 1000),
  };
}

export function verifyOtpChallenge({
  contact,
  purpose,
  otp,
}: {
  contact: string;
  purpose: string;
  otp: string;
}) {
  const key = recordKey(contact, purpose);
  const record = g.talmechOtpRecords!.get(key);
  const now = Date.now();

  if (!record) {
    return { ok: false as const, status: 400, error: 'OTP was not requested or has expired.' };
  }

  if (record.expiresAt < now) {
    g.talmechOtpRecords!.delete(key);
    return { ok: false as const, status: 400, error: 'OTP expired. Please request a new OTP.' };
  }

  if (record.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    g.talmechOtpRecords!.delete(key);
    return { ok: false as const, status: 429, error: 'Too many incorrect OTP attempts. Please request a new OTP.' };
  }

  record.attempts += 1;
  const expected = hashOtp(contact, purpose, otp);
  const matched = safeCompareHex(expected, record.hash);

  if (!matched) {
    return { ok: false as const, status: 400, error: 'Invalid OTP.' };
  }

  g.talmechOtpRecords!.delete(key);
  return { ok: true as const, verifiedAt: new Date().toISOString() };
}
