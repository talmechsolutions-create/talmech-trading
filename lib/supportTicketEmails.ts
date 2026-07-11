import { sendOrQueueEmail } from '@/lib/email';
import { getBusinessEmailFrom } from '@/lib/emailConfig';
import { sanitizeMultiline, sanitizeString } from '@/lib/validation';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function status(result: any): 'sent' | 'failed' | 'preview' {
  if (result?.status === 'sent') return 'sent';
  if (result?.status === 'preview') return 'preview';
  return 'failed';
}

function tracking(type: string, result: any, recipient: string) {
  const emailStatus = status(result);
  return {
    type,
    emailStatus,
    emailRecipient: recipient,
    emailSender: sanitizeString(result?.from || getBusinessEmailFrom(), 254),
    emailProvider: sanitizeString(result?.provider, 80),
    emailError: emailStatus === 'failed'
      ? sanitizeMultiline(JSON.stringify(result?.providerError || result?.error || result?.reason || ''), 500)
      : '',
  };
}

function ticketHtml(title: string, ticket: any, body: string) {
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
    <h2 style="margin:0 0 10px">${escapeHtml(title)}</h2>
    <p><b>Ticket:</b> ${escapeHtml(ticket.ticketId)}</p>
    <p><b>Firm:</b> ${escapeHtml(ticket.firmName || '-')}</p>
    <p><b>Subject:</b> ${escapeHtml(ticket.subject || '-')}</p>
    <p>${escapeHtml(body)}</p>
    <p style="white-space:pre-line">${escapeHtml(ticket.message || '')}</p>
    <p>Regards,<br/><b>Raghavendra Tiwari</b><br/>Talmech Trading<br/>Support: +91 7389642874</p>
  </div>`;
}

export async function sendSupportTicketCreatedEmails(ticket: any) {
  const results: Record<string, any>[] = [];
  const adminRecipient = sanitizeString(process.env.ADMIN_NOTIFICATION_EMAIL, 254);

  if (ticket.email) {
    const result = await sendOrQueueEmail({
      to: ticket.email,
      subject: `Talmech support ticket received ${ticket.ticketId}`,
      html: ticketHtml('Talmech support ticket received', ticket, 'We have received your support ticket and will review it.'),
      text: [
        `Ticket received: ${ticket.ticketId}`,
        `Subject: ${ticket.subject || '-'}`,
        ticket.message || '',
        'Raghavendra Tiwari | Talmech Trading | Support: +91 7389642874',
      ].join('\n'),
      leadId: ticket.ticketId,
    });
    results.push(tracking('support_ticket_client_confirmation', result, ticket.email));
  }

  if (adminRecipient) {
    const result = await sendOrQueueEmail({
      to: adminRecipient,
      subject: `New support ticket ${ticket.ticketId} - ${ticket.subject || 'Talmech client'}`,
      html: ticketHtml('New Talmech support ticket', ticket, 'A client opened a support ticket.'),
      text: [
        `New support ticket: ${ticket.ticketId}`,
        `Firm: ${ticket.firmName || '-'}`,
        `Client: ${ticket.contactName || '-'}`,
        `Email: ${ticket.email || '-'}`,
        `Mobile: ${ticket.mobile || '-'}`,
        `Subject: ${ticket.subject || '-'}`,
        ticket.message || '',
      ].join('\n'),
      leadId: ticket.ticketId,
    });
    results.push(tracking('support_ticket_admin_notification', result, adminRecipient));
  }

  return results;
}

export async function sendSupportTicketUpdateEmail(ticket: any, reply: string) {
  if (!ticket.email) return null;
  const result = await sendOrQueueEmail({
    to: ticket.email,
    subject: `Talmech support ticket update ${ticket.ticketId}`,
    html: ticketHtml('Talmech support ticket update', ticket, reply || `Status updated to ${ticket.status}.`),
    text: [
      `Ticket update: ${ticket.ticketId}`,
      `Status: ${ticket.status || '-'}`,
      reply || '',
      'Raghavendra Tiwari | Talmech Trading | Support: +91 7389642874',
    ].join('\n'),
    leadId: ticket.ticketId,
  });
  return tracking('support_ticket_client_update', result, ticket.email);
}

export async function sendSupportTicketAdminReplyNotification(ticket: any, reply: string) {
  const adminRecipient = sanitizeString(process.env.ADMIN_NOTIFICATION_EMAIL, 254);
  if (!adminRecipient) return null;
  const result = await sendOrQueueEmail({
    to: adminRecipient,
    subject: `Client reply on support ticket ${ticket.ticketId}`,
    html: ticketHtml('Client replied to support ticket', ticket, reply),
    text: [
      `Client reply: ${ticket.ticketId}`,
      `Firm: ${ticket.firmName || '-'}`,
      `Subject: ${ticket.subject || '-'}`,
      reply,
    ].join('\n'),
    leadId: ticket.ticketId,
  });
  return tracking('support_ticket_admin_reply_notification', result, adminRecipient);
}
