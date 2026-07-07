import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { listSupportTickets } from '@/lib/supportTicketStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }
  const tickets = await listSupportTickets();
  return NextResponse.json({ ok: true, tickets, updatedAt: new Date().toISOString() });
}
