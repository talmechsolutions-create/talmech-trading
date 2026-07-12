import { sanitizeMultiline, sanitizeString } from '@/lib/validation';

const HONEYPOT_FIELDS = ['talmechWebsite', 'homepage', 'confirmEmail', 'faxNumber', 'hp'];

export function sanitizePlainObject(input: unknown, maxValueLength = 1000) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      sanitizeString(key, 80),
      typeof value === 'string' ? sanitizeString(value, maxValueLength) : value,
    ])
  );
}

export function sanitizeLongText(value: unknown, maxLength = 2500) {
  return sanitizeMultiline(value, maxLength);
}

export function detectHoneypot(input: unknown) {
  if (!input || typeof input !== 'object') return false;
  const row = input as Record<string, unknown>;
  return HONEYPOT_FIELDS.some((field) => sanitizeString(row[field], 120));
}

export function formFillTimeOk(input: unknown, minMs = 2500) {
  if (!input || typeof input !== 'object') return true;
  const row = input as Record<string, unknown>;
  const startedAt = Number(row.formStartedAt || row.formStartedAtMs || 0);
  if (!startedAt) return true;
  return Number.isFinite(startedAt) && Date.now() - startedAt >= minMs;
}

export async function verifyTurnstileToken(token: unknown, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true as const, skipped: true as const };

  const form = new FormData();
  form.set('secret', secret);
  form.set('response', sanitizeString(token, 3000));
  if (remoteIp) form.set('remoteip', remoteIp);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  }).catch(() => null);

  if (!response) return { ok: false as const, error: 'Captcha verification is unavailable.' };
  const data = await response.json().catch(() => ({}));
  return data?.success
    ? { ok: true as const, skipped: false as const }
    : { ok: false as const, error: 'Captcha verification failed.' };
}
