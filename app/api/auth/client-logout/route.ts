import { NextResponse } from 'next/server';
import { clearClientSessionCookie } from '@/lib/clientAuth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearClientSessionCookie(res);
  return res;
}
