import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { auditAdminAction } from '@/lib/security/auditLog';
import { publicStorageError } from '@/lib/storageMode';
import { sendSupportTicketUpdateEmail } from '@/lib/supportTicketEmails';
import { recordSupportTicketEmailStatus, updateSupportTicket } from '@/lib/supportTicketStore';
import { sanitizeMultiline, sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const reply = sanitizeMultiline(body.reply, 1200);
  try {
    let ticket = await updateSupportTicket(params.ticketId, {
      status: sanitizeString(body.status, 60),
      adminNote: sanitizeMultiline(body.adminNote, 1200),
      reply,
      by: 'admin',
    });
    if (!ticket) return NextResponse.json({ ok: false, error: 'Ticket not found.' }, { status: 404 });
    if (reply) {
      try {
        const emailTracking = await sendSupportTicketUpdateEmail(ticket, reply);
        if (emailTracking) {
          const updated = await recordSupportTicketEmailStatus(ticket.ticketId, emailTracking);
          if (updated) ticket = updated;
        }
      } catch (emailError) {
        console.error('[Support ticket email error]', emailError);
      }
    }
    await auditAdminAction({
      action: 'ADMIN_SUPPORT_TICKET_UPDATE',
      entity: 'SupportTicket',
      entityId: params.ticketId,
      note: `status:${sanitizeString(body.status, 60)}`,
    });
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update support ticket.' }, { status: 500 });
  }
}
