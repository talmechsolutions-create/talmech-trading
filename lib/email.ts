import { promises as fs } from 'fs';
import path from 'path';
import { canUseJsonFileStorage, requireJsonFileStorage } from '@/lib/storageMode';

const outboxFile = path.join(process.cwd(), 'data', 'email-outbox.json');

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

export async function sendOrQueueEmail({ to, subject, html, text, leadId }: { to?: string; subject: string; html: string; text?: string; leadId: string }) {
  if (!to) return { status: 'skipped', reason: 'No recipient email provided' };
  const row = { id: `EMAIL-${Date.now()}`, leadId, to, subject, html, text, createdAt: new Date().toISOString(), status: 'queued' };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.NOTIFICATION_FROM_EMAIL || 'Talmech Trading <onboarding@resend.dev>';
  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html, text })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return { status: 'sent', provider: 'resend', data };
      row.status = 'queued_after_provider_error';
      (row as any).providerError = data;
    } catch (err: any) {
      row.status = 'queued_after_send_exception';
      (row as any).providerError = err?.message || String(err);
    }
  }
  if (!canUseJsonFileStorage()) {
    return {
      status: row.status === 'queued' ? 'not_sent_no_provider' : 'provider_error_not_queued',
      provider: apiKey ? 'resend' : 'none',
      reason: 'Email provider is not configured or failed, and local email outbox is disabled in production.',
      providerError: (row as any).providerError,
    };
  }
  const rows = await readOutbox();
  rows.unshift(row);
  await writeOutbox(rows);
  return { status: row.status, provider: 'local_outbox' };
}
