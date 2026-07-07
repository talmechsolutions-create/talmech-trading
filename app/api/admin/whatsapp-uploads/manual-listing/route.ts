import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { createManualAdminClientListing } from '@/lib/manualAdminListing';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await createManualAdminClientListing(body);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status || 400 });
}
