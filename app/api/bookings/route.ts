import { NextResponse } from 'next/server';
import { calcQuote, getMetal } from '@/lib/data';
import { rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(req: Request) {
  const limited = await rateLimitResponse(req, { keyPrefix: 'bookings', limit: 20, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const metal = getMetal(body.metal || 'steel');
  if (!metal) return NextResponse.json({ success: false, error: 'Invalid metal' }, { status: 400 });
  const qty = Math.max(1, Number(body.qty || 1));
  return NextResponse.json({ success: true, bookingId: `BK-${Date.now()}`, metal: metal.name, qty, quote: calcQuote(metal.price, qty) });
}
