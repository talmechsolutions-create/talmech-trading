import { NextResponse } from 'next/server';

type RateBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  identifier?: string;
};

export type RateLimitResult = {
  ok: boolean;
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  provider: 'memory' | 'upstash';
};

const g = globalThis as unknown as {
  talmechRateLimits?: Map<string, RateBucket>;
  talmechRateLimitWarned?: boolean;
};
g.talmechRateLimits ||= new Map();

export function getClientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local'
  );
}

function rateLimitKey(req: Request, options: RateLimitOptions) {
  const ip = getClientIp(req).replace(/[^a-zA-Z0-9:._-]/g, '_');
  const id = (options.identifier || '').toLowerCase().replace(/[^a-z0-9@._:-]/g, '_');
  return `talmech:${options.keyPrefix}:${id || ip}`;
}

async function upstashRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult | null> {
  if ((process.env.RATE_LIMIT_PROVIDER || '').toLowerCase() !== 'upstash') return null;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  try {
    const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
    const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, ttlSeconds],
      ]),
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Upstash rate limit failed: ${response.status}`);
    const count = Number(data?.[0]?.result || 0);
    const resetAt = Date.now() + options.windowMs;
    return {
      ok: count <= options.limit,
      key,
      limit: options.limit,
      remaining: Math.max(0, options.limit - count),
      resetAt,
      retryAfterSeconds: count > options.limit ? ttlSeconds : 0,
      provider: 'upstash',
    };
  } catch (error) {
    if (!g.talmechRateLimitWarned) {
      console.warn('Upstash rate limiting unavailable; falling back to in-memory limits.', error);
      g.talmechRateLimitWarned = true;
    }
    return null;
  }
}

function memoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = g.talmechRateLimits!.get(key);
  const record = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + options.windowMs };
  record.count += 1;
  g.talmechRateLimits!.set(key, record);

  const remaining = Math.max(0, options.limit - record.count);
  return {
    ok: record.count <= options.limit,
    key,
    limit: options.limit,
    remaining,
    resetAt: record.resetAt,
    retryAfterSeconds: record.count > options.limit ? Math.ceil((record.resetAt - now) / 1000) : 0,
    provider: 'memory',
  };
}

export async function checkRateLimit(req: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const key = rateLimitKey(req, options);
  return (await upstashRateLimit(key, options)) || memoryRateLimit(key, options);
}

export async function rateLimitResponse(req: Request, options: RateLimitOptions) {
  const result = await checkRateLimit(req, options);
  if (result.ok) return null;
  return NextResponse.json(
    {
      ok: false,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again shortly.',
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        'X-RateLimit-Provider': result.provider,
      },
    }
  );
}
