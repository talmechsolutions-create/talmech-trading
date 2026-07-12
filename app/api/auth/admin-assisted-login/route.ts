import { NextRequest, NextResponse } from 'next/server';
import { clientKey } from '@/lib/adminSecurity';
import { loginAdminAssistedAccount } from '@/lib/adminAssistedAccounts';
import { setClientSessionCookie } from '@/lib/clientAuth';
import { rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

type Attempt = { count: number; until: number; last: number };
const g = globalThis as unknown as { talmechAdminAssistedLoginAttempts?: Record<string, Attempt> };
g.talmechAdminAssistedLoginAttempts ||= {};

function locked(key: string) {
  const record = g.talmechAdminAssistedLoginAttempts![key];
  return Boolean(record?.until && record.until > Date.now());
}

function recordFailure(key: string) {
  const now = Date.now();
  const prev = g.talmechAdminAssistedLoginAttempts![key] || { count: 0, until: 0, last: 0 };
  const count = now - prev.last > 30 * 60 * 1000 ? 1 : prev.count + 1;
  g.talmechAdminAssistedLoginAttempts![key] = {
    count,
    until: count >= 6 ? now + 15 * 60 * 1000 : 0,
    last: now,
  };
}

function clearFailure(key: string) {
  g.talmechAdminAssistedLoginAttempts![key] = { count: 0, until: 0, last: 0 };
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req, { keyPrefix: 'admin-assisted-login', limit: 12, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const key = clientKey(req);
  if (locked(key)) {
    return NextResponse.json({ ok: false, error: 'Too many failed login attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await loginAdminAssistedAccount(String(body.login || ''), String(body.password || ''));
  if (!result.ok) {
    recordFailure(key);
    return NextResponse.json(result, { status: result.status || 401 });
  }

  clearFailure(key);
  const res = NextResponse.json(result);
  setClientSessionCookie(res, result.user);
  return res;
}
