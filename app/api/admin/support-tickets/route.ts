import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { listSupportTickets } from '@/lib/supportTicketStore';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }
  try {
    const tickets = await listSupportTickets();
    return NextResponse.json({ ok: true, tickets, updatedAt: new Date().toISOString() });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    console.error('ADMIN_SUPPORT_TICKETS_GET_FAILED', error);
    return NextResponse.json({ ok: false, error: 'Unable to load support tickets.' }, { status: 500 });
  }
}
