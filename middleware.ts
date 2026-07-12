import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders, isPrivatePath } from '@/lib/security/securityHeaders';

const COOKIE = 'talmech_admin_session';
const maxAgeMs = 60 * 60 * 10 * 1000;
const protectedPagePrefixes = [
  '/dashboard', '/crm', '/supplier-search', '/industry-search', '/admin-logistics', '/strategy', '/knowledge', '/small-deals', '/admin', '/admin-tmis', '/analytics', '/seo-tracker', '/admin-leads', '/admin-users', '/admin-price-locks', '/admin-payments', '/invoices', '/book-order', '/scrap-funnel'
];

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'change_this_admin_password';
}

function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'change-this-admin-session-secret';
}

function isWeakAdminConfig() {
  const pass = adminPassword();
  const secret = adminSecret();
  return pass.length < 14 || secret.length < 32 || /change|password|admin/i.test(pass) || /change|secret/i.test(secret);
}

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hasAdminSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return false;

  if (process.env.NODE_ENV === 'production' && isWeakAdminConfig()) return false;

  const secret = adminSecret();

  // New signed token: ts.nonce.username.signature
  const parts = token.split('.');
  if (parts.length === 4) {
    const [ts, nonce, username, sig] = parts;
    const age = Date.now() - Number(ts);
    if (!ts || !nonce || !username || !sig || !Number.isFinite(age) || age < 0 || age > maxAgeMs) return false;
    if (username !== (process.env.ADMIN_USERNAME?.trim() || 'admin')) return false;
    const expected = await hmac(`${ts}.${nonce}.${username}`, secret);
    return safeEqual(sig, expected);
  }

  // Backward-compatible token from older builds: ts.signature
  if (parts.length === 2) {
    const [ts, sig] = parts;
    const age = Date.now() - Number(ts);
    if (!Number.isFinite(age) || age < 0 || age > maxAgeMs) return false;
    const expected = await hmac(ts, secret);
    return safeEqual(sig, expected);
  }

  return false;
}

function isProtectedApi(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method.toUpperCase();

  if (pathname === '/api/admin-session') return false;
  if (pathname === '/api/admin-login') return false;
  if (pathname === '/api/marketing-events') return method !== 'POST';
  if (pathname === '/api/whatsapp-uploads') return method !== 'POST';
  if (pathname.startsWith('/api/whatsapp-uploads/')) return true;
  if (pathname === '/api/seo-audit') return true;
  if (pathname === '/api/marketing-campaigns') return true;
  if (pathname === '/api/admin-payments') return true;
  if (pathname === '/api/public-requirements') return method !== 'POST';
  if (pathname === '/api/marketplace-listings') return ['PATCH', 'DELETE'].includes(method);
  if (pathname === '/api/user-registrations') return !(method === 'POST' || (method === 'GET' && searchParams.has('statusBy')));
  if (pathname === '/api/price-locks') return method === 'GET';
  if (pathname === '/api/logistics-providers') return true;
  if (pathname === '/api/crm-leads') return true;
  if (pathname.startsWith('/api/admin')) return true;
  return false;
}

function securityHeaders(req: NextRequest, res: NextResponse, noindex = false) {
  return applySecurityHeaders(res, { noindex, req });
}

function isMutating(req: NextRequest) {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method.toUpperCase());
}

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const site = req.nextUrl.origin;
  if (origin) return origin === site;
  if (referer) return referer.startsWith(`${site}/`);
  return process.env.NODE_ENV !== 'production';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminLogin = pathname === '/admin-login' || pathname.startsWith('/api/admin-session') || pathname.startsWith('/api/admin-login');
  const protectedPage = protectedPagePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const protectedApi = isProtectedApi(req);
  const noindex = protectedPage || protectedApi || isPrivatePath(pathname);

  if (isAdminLogin) return securityHeaders(req, NextResponse.next(), true);
  if (!protectedPage && !protectedApi) return securityHeaders(req, NextResponse.next(), noindex);

  if (await hasAdminSession(req)) {
    if (protectedApi && isMutating(req) && !sameOrigin(req)) {
      return securityHeaders(
        req,
        NextResponse.json({ ok: false, code: 'CSRF_CHECK_FAILED', message: 'Security token check failed.' }, { status: 403 }),
        true
      );
    }
    return securityHeaders(req, NextResponse.next(), true);
  }

  if (protectedApi) {
    return securityHeaders(
      req,
      NextResponse.json({ ok: false, code: 'ADMIN_AUTH_REQUIRED', message: 'Admin authentication required.' }, { status: 401 }),
      true
    );
  }
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin-login';
  loginUrl.searchParams.set('next', pathname);
  return securityHeaders(req, NextResponse.redirect(loginUrl), true);
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'] };
