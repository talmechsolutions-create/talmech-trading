import { NextRequest, NextResponse } from 'next/server';
import { geocodeIndiaAddress } from '@/lib/routeService';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!process.env.OPENROUTESERVICE_API_KEY) return NextResponse.json({ ok:false, error:'OPENROUTESERVICE_API_KEY is not configured.', results: [] });
  const results = await geocodeIndiaAddress(q).catch(() => []);
  return NextResponse.json({ ok:true, results, provider:'openrouteservice' });
}
