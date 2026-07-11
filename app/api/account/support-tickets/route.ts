import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionUser } from '@/lib/clientAuth';
import { publicStorageError } from '@/lib/storageMode';
import { sendSupportTicketCreatedEmails } from '@/lib/supportTicketEmails';
import { createSupportTicket, listSupportTicketsForUser, recordSupportTicketEmailStatus } from '@/lib/supportTicketStore';
import { sanitizeMultiline, sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  const tickets = await listSupportTicketsForUser(user.id);
  return NextResponse.json({ ok: true, tickets, updatedAt: new Date().toISOString() });
}

export async function POST(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!sanitizeString(body.subject, 160) || !sanitizeMultiline(body.message, 2000)) {
    return NextResponse.json({ ok: false, error: 'Subject and message are required.' }, { status: 400 });
  }
  try {
    const attachmentNote = sanitizeMultiline(body.attachmentNote, 600);
    const message = [
      sanitizeMultiline(body.message, 2000),
      attachmentNote ? `Attachment note: ${attachmentNote}` : '',
    ].filter(Boolean).join('\n\n');
    let ticket = await createSupportTicket({
      ownerUserId: user.id,
      accountId: user.id,
      firmName: user.firmName || '',
      contactName: user.ownerName || '',
      email: user.email || '',
      mobile: user.primaryMobile || '',
      category: sanitizeString(body.category || 'General support', 80),
      priority: sanitizeString(body.priority || 'Normal', 40),
      subject: sanitizeString(body.subject, 160),
      message,
    });
    try {
      const emailResults = await sendSupportTicketCreatedEmails(ticket);
      for (const tracking of emailResults) {
        const updated = await recordSupportTicketEmailStatus(ticket.ticketId, tracking);
        if (updated) ticket = updated;
      }
    } catch (emailError) {
      console.error('[Support ticket email error]', emailError);
    }
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to create support ticket.' }, { status: 500 });
  }
}
