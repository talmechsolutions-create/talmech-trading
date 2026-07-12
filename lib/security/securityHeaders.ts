import { NextRequest, NextResponse } from 'next/server';

function cspFor(req?: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  const site = req?.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "'self'";
  const imageProviders = [
    process.env.NEXT_PUBLIC_IMAGE_CDN_HOST,
    process.env.CLOUDINARY_CLOUD_NAME ? 'https://res.cloudinary.com' : '',
  ].filter(Boolean);

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://checkout.razorpay.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https: ${imageProviders.join(' ')}`,
    "font-src 'self' data:",
    `connect-src 'self' ${site} https://api.razorpay.com https://checkout.razorpay.com https://api.resend.com https://challenges.cloudflare.com`,
    'frame-src https://api.razorpay.com https://checkout.razorpay.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].filter(Boolean).join('; ');
}

export function isPrivatePath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/admin-') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/crm') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/invoices')
  );
}

export function applySecurityHeaders(res: NextResponse, options: { noindex?: boolean; req?: NextRequest } = {}) {
  res.headers.set('Content-Security-Policy', cspFor(options.req));
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('X-Robots-Tag', options.noindex ? 'noindex, nofollow, noarchive' : 'index, follow');
  return res;
}
