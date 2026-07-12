import { NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(req: Request) {
  const limited = await rateLimitResponse(req, { keyPrefix: 'invoices', limit: 20, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    invoiceNo: `TT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    invoice: body,
  });
}
