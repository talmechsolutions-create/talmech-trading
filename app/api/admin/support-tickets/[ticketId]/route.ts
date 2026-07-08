import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { publicStorageError } from '@/lib/storageMode';
import { updateSupportTicket } from '@/lib/supportTicketStore';
import { sanitizeMultiline, sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const ticket = await updateSupportTicket(params.ticketId, {
      status: sanitizeString(body.status, 60),
      adminNote: sanitizeMultiline(body.adminNote, 1200),
      reply: sanitizeMultiline(body.reply, 1200),
      by: 'admin',
    });
    if (!ticket) return NextResponse.json({ ok: false, error: 'Ticket not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update support ticket.' }, { status: 500 });
  }
}
