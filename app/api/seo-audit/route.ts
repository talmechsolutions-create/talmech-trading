import { NextResponse } from 'next/server';
import { generateSeoAudit } from '@/lib/marketingSeo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const audit = await generateSeoAudit();
  return NextResponse.json({ ok: true, audit });
}
