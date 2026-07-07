import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { findUser } from '@/lib/proDb';
import { adminSecret } from '@/lib/adminSecurity';
import { sanitizeString } from '@/lib/validation';

export const CLIENT_COOKIE = 'talmech_client_session';
const maxAgeSeconds = 60 * 60 * 24 * 14;

function base64url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function secret() {
  return process.env.CLIENT_SESSION_SECRET || adminSecret();
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function createClientSessionToken(user: any) {
  const payload = {
    id: sanitizeString(user?.id, 80),
    email: sanitizeString(user?.email, 254).toLowerCase(),
    mobile: sanitizeString(user?.primaryMobile || user?.mobile || user?.phone, 20),
    iat: Date.now(),
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function setClientSessionCookie(res: NextResponse, user: any) {
  res.cookies.set(CLIENT_COOKIE, createClientSessionToken(user), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export function clearClientSessionCookie(res: NextResponse) {
  res.cookies.set(CLIENT_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function verifyClientSessionToken(token?: string) {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sign(payload), sig)) return null;
  try {
    const parsed = JSON.parse(fromBase64url(payload));
    const age = Date.now() - Number(parsed.iat || 0);
    if (!Number.isFinite(age) || age < 0 || age > maxAgeSeconds * 1000) return null;
    return {
      id: sanitizeString(parsed.id, 80),
      email: sanitizeString(parsed.email, 254).toLowerCase(),
      mobile: sanitizeString(parsed.mobile, 20),
    };
  } catch {
    return null;
  }
}

export async function getClientSessionUser(req: NextRequest) {
  const session = verifyClientSessionToken(req.cookies.get(CLIENT_COOKIE)?.value);
  if (!session?.id) return null;
  const user = await findUser(session.id);
  if (!user) return null;
  return user;
}

export function safeClientUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    status: user.status || 'PENDING_PROFILE_CONFIRMATION',
    accountType: user.accountType || 'Buyer',
    roleCategory: user.roleCategory || '',
    firmName: user.firmName || '',
    ownerName: user.ownerName || '',
    businessRole: user.businessRole || '',
    gstNumber: user.gstNumber || '',
    primaryMobile: user.primaryMobile || '',
    alternateMobile: user.alternateMobile || '',
    email: user.email || '',
    state: user.state || '',
    city: user.city || '',
    area: user.area || '',
    pincode: user.pincode || '',
    fullAddress: user.fullAddress || '',
    tradingProducts: user.tradingProducts || '',
    documents: typeof user.documents === 'string' ? user.documents : JSON.stringify(user.documents || ''),
    adminCreated: Boolean(user.adminCreated),
    onboardingSource: user.onboardingSource || '',
    mustChangePassword: Boolean(user.mustChangePassword),
    profileConfirmationRequired: user.profileConfirmationRequired !== false,
    verificationStatus: user.verificationStatus || '',
  };
}
