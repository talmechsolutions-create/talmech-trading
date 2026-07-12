import { NextResponse } from 'next/server';
import { marketingEventsFile, readJsonArray, writeJsonArray } from '@/lib/marketingSeo';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

function clean(value: unknown, fallback = '', max = 160) {
  return String(value ?? fallback).replace(/[<>]/g, '').slice(0, max);
}

export async function GET() {
  const events = await readJsonArray(marketingEventsFile);
  const bySource = events.reduce((acc: Record<string, number>, ev: any) => {
    const key = ev.source || 'direct';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const byRole = events.reduce((acc: Record<string, number>, ev: any) => {
    const key = ev.role || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const byDevice = events.reduce((acc: Record<string, number>, ev: any) => {
    const key = ev.device || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const byCity = events.reduce((acc: Record<string, number>, ev: any) => {
    const key = ev.city || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return NextResponse.json({ ok: true, events: events.slice(0, 300), summary: { total: events.length, bySource, byRole, byDevice, byCity } });
}

export async function POST(req: Request) {
  const limited = await rateLimitResponse(req, { keyPrefix: 'marketing-events', limit: 120, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const raw = await req.text().catch(() => '');
  if (raw.length > 20_000) return NextResponse.json({ ok: false, error: 'Event payload too large.' }, { status: 413 });
  const body = raw ? JSON.parse(raw) : {};
  const events = await readJsonArray(marketingEventsFile);
  const event = {
    id: `me-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    eventType: clean(body.eventType, 'page_event', 80),
    source: clean(body.source || body.utm_source, 'direct', 100),
    medium: clean(body.medium || body.utm_medium, 'organic', 80),
    campaign: clean(body.campaign || body.utm_campaign, '', 120),
    page: clean(body.page, '', 240),
    keyword: clean(body.keyword || body.utm_term, '', 180),
    city: clean(body.city, '', 80),
    role: clean(body.role, '', 40),
    device: clean(body.device, '', 40),
    viewport: clean(body.viewport, '', 40),
  };
  try {
    events.unshift(event);
    await writeJsonArray(marketingEventsFile, events.slice(0, 10000));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to save marketing event.' }, { status: 500 });
  }
}
