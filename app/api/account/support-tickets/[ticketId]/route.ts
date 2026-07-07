import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionUser } from '@/lib/clientAuth';
import { listSupportTicketsForUser, updateSupportTicket } from '@/lib/supportTicketStore';
import { sanitizeMultiline } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  const ownTickets = await listSupportTicketsForUser(user.id);
  if (!ownTickets.some((ticket: { ticketId: string }) => ticket.ticketId === params.ticketId)) {
    return NextResponse.json({ ok: false, error: 'Ticket not found.' }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const reply = sanitizeMultiline(body.reply || body.message, 1200);
  if (!reply) return NextResponse.json({ ok: false, error: 'Reply message is required.' }, { status: 400 });
  const ticket = await updateSupportTicket(params.ticketId, { reply, by: 'client', status: 'Waiting for Client' });
  return NextResponse.json({ ok: true, ticket });
}
