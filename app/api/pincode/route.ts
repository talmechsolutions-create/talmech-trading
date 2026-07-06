import { NextRequest, NextResponse } from 'next/server';
import { lookupPincode } from '@/lib/pincodeData';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin') || '';
  const info = lookupPincode(pin);
  return NextResponse.json({ ok: Boolean(info), info });
}
