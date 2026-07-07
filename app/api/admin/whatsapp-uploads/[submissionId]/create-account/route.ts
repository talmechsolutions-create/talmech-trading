import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { createAdminAssistedAccount } from '@/lib/adminAssistedAccounts';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { submissionId: string };
};

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await createAdminAssistedAccount(params.submissionId, body);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status || 400 });
}
