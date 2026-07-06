import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_MAX_AGE_SECONDS, adminConfigError, adminPassword, adminUsername, clearFailedLogin, clientKey, createAdminToken, isLockedOut, isWeakAdminConfig, recordFailedLogin, safeEqual } from '@/lib/adminSecurity';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const configError = adminConfigError();
  if (configError) return NextResponse.json({ ok: false, error: configError }, { status: 500 });

  const key = clientKey(req);
  if (isLockedOut(key)) {
    return NextResponse.json({ ok: false, error: 'Too many failed attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '');
  const password = String(body.password || '');

  const valid = safeEqual(username, adminUsername()) && safeEqual(password, adminPassword());
  if (!valid) {
    recordFailedLogin(key);
    return NextResponse.json({ ok: false, error: 'Invalid admin username or password.' }, { status: 401 });
  }

  clearFailedLogin(key);
  const res = NextResponse.json({ ok: true, weakConfig: isWeakAdminConfig() });
  res.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_MAX_AGE_SECONDS,
  });
  return res;
}
