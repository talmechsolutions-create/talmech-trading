import { NextRequest, NextResponse } from 'next/server';
import { activateAdminAssistedAccount } from '@/lib/adminAssistedAccounts';
import { setClientSessionCookie } from '@/lib/clientAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await activateAdminAssistedAccount(String(body.token || ''), String(body.password || ''));
  const res = NextResponse.json(result, { status: result.ok ? 200 : result.status || 400 });
  if (result.ok) setClientSessionCookie(res, result.user);
  return res;
}
