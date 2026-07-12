import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const CSRF_COOKIE = 'talmech_csrf_seed';
const maxAgeSeconds = 60 * 60 * 8;

function secret() {
  return process.env.CSRF_SECRET || process.env.ADMIN_SESSION_SECRET || 'talmech-local-csrf-secret';
}

function sign(seed: string) {
  return createHmac('sha256', secret()).update(seed).digest('hex');
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

export function createCsrfSeed() {
  return randomBytes(24).toString('hex');
}

export function createCsrfToken(seed: string) {
  return `${seed}.${sign(seed)}`;
}

export function setCsrfCookie(res: NextResponse, seed = createCsrfSeed()) {
  res.cookies.set(CSRF_COOKIE, seed, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
  return createCsrfToken(seed);
}

export function verifyCsrfToken(token: string, seed: string) {
  const [tokenSeed, signature] = String(token || '').split('.');
  return Boolean(tokenSeed && signature && safeEqual(tokenSeed, seed) && safeEqual(signature, sign(seed)));
}

export function sameOriginRequest(req: NextRequest) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const site = req.nextUrl.origin;
  if (origin) return origin === site;
  if (referer) return referer.startsWith(`${site}/`);
  return process.env.NODE_ENV !== 'production';
}

export function verifyCsrfRequest(req: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return { ok: true as const };
  const seed = req.cookies.get(CSRF_COOKIE)?.value || '';
  const token = req.headers.get('x-csrf-token') || '';
  if (seed && token && verifyCsrfToken(token, seed)) return { ok: true as const };
  if (sameOriginRequest(req)) return { ok: true as const, sameOriginFallback: true as const };
  return { ok: false as const, code: 'CSRF_CHECK_FAILED', message: 'Security token check failed.' };
}
