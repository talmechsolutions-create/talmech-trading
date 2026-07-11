'use client';

import { useState } from 'react';

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusClass(status: string) {
  const lower = String(status || '').toLowerCase();
  if (lower === 'sent') return 'pill green';
  if (lower === 'failed' || lower === 'preview' || lower.includes('error')) return 'pill gold';
  return 'pill';
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="waDetailField">
      <span>{label}</span>
      <b>{String(value || '-')}</b>
    </div>
  );
}

export default function AdminListingClientEmailActions({
  listingId,
  initialNotification,
  initialMissingInformation = [],
}: {
  listingId: string;
  initialNotification: any;
  initialMissingInformation?: any[];
}) {
  const [notification, setNotification] = useState(initialNotification || {});
  const [missingInformation, setMissingInformation] = useState(initialMissingInformation);
  const [manualCopy, setManualCopy] = useState<{ temporaryPassword?: string; instructions?: string } | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    setManualCopy(null);
    const res = await fetch(`/api/admin/listings/${encodeURIComponent(listingId)}/resend-client-email`, {
      method: 'POST',
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to resend client email.' }));
    setSending(false);

    if (!res.ok) {
      setMessage(res.error || 'Unable to resend client email.');
      return;
    }

    const tracking = res.email?.tracking || {};
    setNotification(tracking);
    setMissingInformation(Array.isArray(res.missingInformation) ? res.missingInformation : []);
    setManualCopy(res.manualCopy || null);
    setMessage(res.email?.status === 'sent'
      ? 'Client email sent.'
      : res.email?.status === 'preview'
        ? 'Email preview is available because SMTP is not configured.'
        : 'Email failed. Please check SMTP settings or copy the instructions.');
  }

  async function copyManualInstructions() {
    if (!manualCopy?.instructions) return;
    await navigator.clipboard.writeText(manualCopy.instructions);
    setMessage('One-time instructions copied.');
  }

  return (
    <section className="waDetailPanel wide">
      <div className="sectionHead">
        <div>
          <h2>Client email</h2>
          <p className="muted">Business/client communication uses the configured notification sender.</p>
        </div>
        <button className="btn" type="button" disabled={sending} onClick={resend}>
          {sending ? 'Sending...' : 'Resend client email'}
        </button>
      </div>
      {message && <p className="notice slimNotice">{message}</p>}
      <div className="waAccountStatusGrid">
        <div className="waDetailField">
          <span>Status</span>
          <b><span className={statusClass(notification.emailStatus)}>{notification.emailStatus || 'not sent'}</span></b>
        </div>
        <Field label="Provider" value={notification.emailProvider} />
        <Field label="Recipient" value={notification.emailRecipient} />
        <Field label="Sender" value={notification.emailSender} />
        <Field label="Last attempt" value={formatDate(notification.lastAttemptAt || '')} />
        <Field label="Last sent" value={formatDate(notification.lastEmailSentAt || notification.lastSentAt || '')} />
        {notification.emailError && <Field label="Email error" value={notification.emailError} />}
      </div>
      {missingInformation.length > 0 && (
        <div className="manualMissingInfo">
          <span className="pill gold">Missing information</span>
          <div className="strategyWarningList">
            {missingInformation.map((item: any) => <span key={item.key || item.label || item.message}>{item.label || item.message}</span>)}
          </div>
        </div>
      )}
      {manualCopy && (
        <div className="manualCopyBox adminManualCopy">
          <span className="pill gold">Shown once</span>
          {manualCopy.temporaryPassword && <label>Temporary password<input className="input" readOnly value={manualCopy.temporaryPassword} onFocus={(event) => event.currentTarget.select()} /></label>}
          <label>Message preview<textarea readOnly value={manualCopy.instructions || ''} onFocus={(event) => event.currentTarget.select()} /></label>
          <button className="btn secondary" type="button" onClick={copyManualInstructions}>Copy instructions</button>
        </div>
      )}
    </section>
  );
}
