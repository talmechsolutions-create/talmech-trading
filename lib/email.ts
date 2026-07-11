import { promises as fs } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getBusinessEmailFrom, getSmtpConfig } from '@/lib/emailConfig';
import { canUseJsonFileStorage, requireJsonFileStorage } from '@/lib/storageMode';

const outboxFile = path.join(process.cwd(), 'data', 'email-outbox.json');

type EmailStatus = 'sent' | 'failed' | 'preview';

type EmailSendInput = {
  to?: string;
  subject: string;
  html: string;
  text?: string;
  leadId: string;
  from?: string;
};

type OutboxRow = {
  id: string;
  leadId: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  createdAt: string;
  status: EmailStatus;
  provider: string;
  providerError?: unknown;
};

async function readOutbox() {
  if (!canUseJsonFileStorage()) return [];
  await fs.mkdir(path.dirname(outboxFile), { recursive: true });
  try { return JSON.parse(await fs.readFile(outboxFile, 'utf8')); } catch { return []; }
}

async function writeOutbox(rows: any[]) {
  requireJsonFileStorage();
  await fs.mkdir(path.dirname(outboxFile), { recursive: true });
  await fs.writeFile(outboxFile, JSON.stringify(rows, null, 2));
}

function publicError(error: unknown) {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Email provider error';
  }
}

async function queuePreview(row: OutboxRow) {
  if (!canUseJsonFileStorage()) return false;
  const rows = await readOutbox();
  rows.unshift(row);
  await writeOutbox(rows);
  return true;
}

async function sendViaSmtp(input: EmailSendInput & { from: string; to: string }) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false as const, missing: true, provider: smtp.provider || 'smtp' };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
  });

  const info = await transporter.sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return {
    ok: true as const,
    provider: smtp.provider || 'smtp',
    data: {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    },
  };
}

async function sendViaResend(input: EmailSendInput & { from: string; to: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false as const, missing: true, provider: 'resend' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, provider: 'resend', error: data };
  return { ok: true as const, provider: 'resend', data };
}

export function leadEmailHtml(lead: any) {
  const media = Array.isArray(lead.mediaLinks) ? lead.mediaLinks.join('<br/>') : String(lead.mediaLinks || '');
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
    <h2 style="margin:0 0 10px">Talmech Trading confirmation</h2>
    <p>Thank you for sharing your metal trading requirement. Your reference number is <b>${lead.id}</b>.</p>
    <table style="border-collapse:collapse;width:100%;max-width:760px">
      ${[
        ['Requirement type', lead.intent], ['Metal', lead.metal], ['Product', lead.product], ['Grade / quality', lead.grade],
        ['Quantity', `${lead.quantity || ''} ${lead.unit || ''}`], ['Location', [lead.area, lead.city, lead.state, lead.pincode].filter(Boolean).join(', ')],
        ['Dispatch readiness', lead.dispatchReadiness || 'To be verified'], ['Delivery estimate', lead.deliveryEta || 'To be verified'],
        ['Target quote', lead.targetPrice || 'Quote after verification'], ['Company', lead.companyName], ['Contact person', lead.contactName],
        ['Phone', lead.phone], ['Email', lead.email], ['Technical details', lead.technicalDetails], ['Images / documents', media || 'Submitted file names/links recorded']
      ].map(([k,v])=>`<tr><td style="border:1px solid #dbe4ee;padding:10px;background:#f8fafc;font-weight:700;width:190px">${k}</td><td style="border:1px solid #dbe4ee;padding:10px">${v || '-'}</td></tr>`).join('')}
    </table>
    <p style="margin-top:18px">Our team will verify grade, quantity, location, documents, dispatch timeline and commercial terms before matching buyers/suppliers.</p>
    <p><b>Talmech Trading</b><br/>WhatsApp / Support: +91 7389642874</p>
  </div>`;
}

export async function sendOrQueueEmail(input: EmailSendInput) {
  const from = input.from || getBusinessEmailFrom();
  if (!input.to) {
    return {
      status: 'failed' as const,
      provider: 'none',
      from,
      reason: 'No recipient email provided',
      error: 'No recipient email provided',
    };
  }

  const row: OutboxRow = {
    id: `EMAIL-${Date.now()}`,
    leadId: input.leadId,
    to: input.to,
    from,
    subject: input.subject,
    html: input.html,
    text: input.text,
    createdAt: new Date().toISOString(),
    status: 'preview',
    provider: 'preview',
  };

  const smtp = getSmtpConfig();
  const smtpPreferred = smtp.configured || smtp.provider === 'zoho_smtp';
  const errors: Record<string, unknown> = {};

  if (smtpPreferred && smtp.configured) {
    try {
      const sent = await sendViaSmtp({ ...input, to: input.to, from });
      if (sent.ok) return { status: 'sent' as const, provider: sent.provider || 'zoho_smtp', from, data: sent.data };
    } catch (error) {
      errors.smtp = publicError(error);
    }
  }

  try {
    const resend = await sendViaResend({ ...input, to: input.to, from });
    if (resend.ok) return { status: 'sent' as const, provider: resend.provider, from, data: resend.data };
    if (!resend.missing) errors.resend = resend.error || 'Resend delivery failed';
  } catch (error) {
    errors.resend = publicError(error);
  }

  const providerWasConfigured = Boolean(smtp.configured || process.env.RESEND_API_KEY?.trim());
  row.status = providerWasConfigured ? 'failed' : 'preview';
  row.provider = providerWasConfigured ? (smtp.configured ? smtp.provider || 'smtp' : 'resend') : 'preview';
  row.providerError = errors;
  const previewQueued = await queuePreview(row);

  if (providerWasConfigured) {
    return {
      status: 'failed' as const,
      provider: row.provider,
      from,
      reason: 'Email provider failed. The message preview is available for manual delivery.',
      providerError: errors,
      previewQueued,
      html: input.html,
      text: input.text,
    };
  }

  return {
    status: 'preview' as const,
    provider: previewQueued ? 'local_outbox' : 'preview',
    from,
    reason: 'Business email provider is not configured. The message preview is available for manual delivery.',
    previewQueued,
    html: input.html,
    text: input.text,
  };
}
