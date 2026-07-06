import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE_SECONDS,
  adminConfigError,
  adminPassword,
  adminUsername,
  clearFailedLogin,
  clientKey,
  createAdminToken,
  isLockedOut,
  isWeakAdminConfig,
  recordFailedLogin,
  safeEqual,
  verifyAdminToken,
} from '@/lib/adminSecurity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const configError = adminConfigError();
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return NextResponse.json({
    authenticated: configError ? false : verifyAdminToken(token),
    weakConfig: isWeakAdminConfig(),
    configError: configError || undefined,
  });
}

export async function POST(req: NextRequest) {
  const configError = adminConfigError();
  if (configError) return NextResponse.json({ ok: false, error: configError }, { status: 500 });

  const key = clientKey(req);
  if (isLockedOut(key)) {
    return NextResponse.json({ ok: false, error: 'Too many failed attempts. Restart local server or try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '');
  const password = String(body.password || '');

  if (!safeEqual(username, adminUsername()) || !safeEqual(password, adminPassword())) {
    recordFailedLogin(key);
    return NextResponse.json({ ok: false, error: 'Invalid admin credentials.' }, { status: 401 });
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

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
