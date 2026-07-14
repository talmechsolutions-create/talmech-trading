import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionUser } from '@/lib/clientAuth';
import { publicStorageError } from '@/lib/storageMode';
import { sendSupportTicketAdminReplyNotification } from '@/lib/supportTicketEmails';
import { listSupportTicketsForUser, recordSupportTicketEmailStatus, updateSupportTicket } from '@/lib/supportTicketStore';
import { sanitizeMultiline } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  try {
    const ownTickets = await listSupportTicketsForUser(user.id);
    if (!ownTickets.some((ticket: { ticketId: string }) => ticket.ticketId === params.ticketId)) {
      return NextResponse.json({ ok: false, error: 'Ticket not found.' }, { status: 404 });
    }
    const body = await req.json().catch(() => ({}));
    const reply = sanitizeMultiline(body.reply || body.message, 1200);
    if (!reply) return NextResponse.json({ ok: false, error: 'Reply message is required.' }, { status: 400 });
    let ticket = await updateSupportTicket(params.ticketId, { reply, by: 'client', status: 'Waiting for Client' });
    if (!ticket) return NextResponse.json({ ok: false, error: 'Ticket not found.' }, { status: 404 });
    try {
      const emailTracking = await sendSupportTicketAdminReplyNotification(ticket, reply);
      if (emailTracking) {
        const updated = await recordSupportTicketEmailStatus(ticket.ticketId, emailTracking);
        if (updated) ticket = updated;
      }
    } catch (emailError) {
      console.error('[Support ticket email error]', emailError);
    }
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update support ticket.' }, { status: 500 });
  }
}
