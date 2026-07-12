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
import { createAdminMfaChallenge, isAdminMfaEnabled, verifyAdminMfaChallenge } from '@/lib/security/adminMfa';
import { auditAdminAction } from '@/lib/security/auditLog';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { createCsrfSeed, createCsrfToken, setCsrfCookie } from '@/lib/security/csrf';
import { rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const configError = adminConfigError();
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const csrfSeed = createCsrfSeed();
  const csrfToken = createCsrfToken(csrfSeed);
  const res = NextResponse.json({
    authenticated: configError ? false : verifyAdminToken(token),
    weakConfig: isWeakAdminConfig(),
    configError: configError || undefined,
    csrfToken,
  });
  setCsrfCookie(res, csrfSeed);
  return res;
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req, { keyPrefix: 'admin-session-login', limit: 8, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const configError = adminConfigError();
  if (configError) return apiError('ADMIN_CONFIG_ERROR', configError, 500);

  const key = clientKey(req);
  if (isLockedOut(key)) {
    return apiError('ADMIN_LOCKED_OUT', 'Too many failed attempts. Restart local server or try again later.', 429);
  }

  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '');
  const password = String(body.password || '');

  if (!safeEqual(username, adminUsername()) || !safeEqual(password, adminPassword())) {
    recordFailedLogin(key);
    await auditAdminAction({ actor: username || 'unknown', action: 'ADMIN_LOGIN_FAILED', entity: 'AdminSession', note: `ip:${key}` });
    return apiError('ADMIN_LOGIN_FAILED', 'Invalid admin credentials.', 401);
  }

  if (isAdminMfaEnabled()) {
    const otp = String(body.otp || '');
    const challengeId = String(body.challengeId || '');
    if (challengeId || otp) {
      const verified = verifyAdminMfaChallenge(challengeId, otp, key);
      if (!verified.ok) {
        recordFailedLogin(key);
        await auditAdminAction({ actor: username || adminUsername(), action: 'ADMIN_MFA_FAILED', entity: 'AdminSession', note: verified.error });
        return apiError('ADMIN_MFA_FAILED', verified.error, 401);
      }
    } else {
      const challenge = await createAdminMfaChallenge(key);
      if (!challenge.ok) return apiError('ADMIN_MFA_NOT_CONFIGURED', challenge.error, 500);
      await auditAdminAction({ actor: username || adminUsername(), action: 'ADMIN_MFA_CHALLENGE_CREATED', entity: 'AdminSession', note: `ip:${key}` });
      return apiOk({
        mfaRequired: true,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        delivery: challenge.delivery,
        developmentOnlyOtp: challenge.developmentOnlyOtp,
      });
    }
  }

  clearFailedLogin(key);
  await auditAdminAction({ actor: adminUsername(), action: 'ADMIN_LOGIN_SUCCESS', entity: 'AdminSession', note: `ip:${key}` });
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
  await auditAdminAction({ actor: adminUsername(), action: 'ADMIN_LOGOUT', entity: 'AdminSession' });
  return res;
}
