import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const ADMIN_COOKIE = 'talmech_admin_session';
export const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 10;

type AttemptRecord = { count: number; until: number; lastFailure: number };
const g = globalThis as unknown as { talmechAdminAttempts?: Record<string, AttemptRecord> };
g.talmechAdminAttempts ||= {};

export function adminUsername() {
  return process.env.ADMIN_USERNAME?.trim() || 'admin';
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'change_this_admin_password';
}

export function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'change-this-admin-session-secret';
}

export function isWeakAdminConfig() {
  const pass = adminPassword();
  const secret = adminSecret();
  return pass.length < 14 || secret.length < 32 || /change|password|admin/i.test(pass) || /change|secret/i.test(secret);
}

export function adminConfigError() {
  if (process.env.NODE_ENV !== 'production') return '';
  if (!process.env.ADMIN_USERNAME?.trim()) return 'ADMIN_USERNAME is required in production.';
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return 'ADMIN_PASSWORD and ADMIN_SESSION_SECRET are required in production.';
  }
  if (isWeakAdminConfig()) {
    return 'Weak admin credentials/session secret are blocked in production.';
  }
  return '';
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function sign(value: string) {
  return createHmac('sha256', adminSecret()).update(value).digest('hex');
}

export function createAdminToken() {
  const configError = adminConfigError();
  if (configError) throw new Error(configError);
  const ts = String(Date.now());
  const nonce = randomBytes(12).toString('hex');
  const payload = `${ts}.${nonce}.${adminUsername()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string) {
  if (adminConfigError()) return false;
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [ts, nonce, username, sig] = parts;
  if (!ts || !nonce || !username || !sig) return false;
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > ADMIN_MAX_AGE_SECONDS * 1000) return false;
  if (!safeEqual(username, adminUsername())) return false;
  const expected = sign(`${ts}.${nonce}.${username}`);
  return safeEqual(sig, expected);
}

export function clientKey(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

export function isLockedOut(key: string) {
  const record = g.talmechAdminAttempts![key];
  return Boolean(record?.until && record.until > Date.now());
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const record = g.talmechAdminAttempts![key] || { count: 0, until: 0, lastFailure: 0 };
  const count = now - record.lastFailure > 30 * 60 * 1000 ? 1 : record.count + 1;
  const until = count >= 5 ? now + Math.min(60, 15 + count * 3) * 60 * 1000 : 0;
  g.talmechAdminAttempts![key] = { count, until, lastFailure: now };
  return g.talmechAdminAttempts![key];
}

export function clearFailedLogin(key: string) {
  g.talmechAdminAttempts![key] = { count: 0, until: 0, lastFailure: 0 };
}
