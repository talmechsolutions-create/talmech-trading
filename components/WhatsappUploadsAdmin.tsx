'use client';

import Link from 'next/link';
import { useState } from 'react';
import { WhatsappUploadStatus } from '@/lib/whatsappUploadTypes';

type AdminRow = {
  submissionId: string;
  date: string;
  role: string;
  submissionType: string;
  firmName: string;
  contactPerson: string;
  maskedMobile: string;
  city: string;
  state: string;
  productOrRequirementName: string;
  finalMetalLabel: string;
  finalProductLabel: string;
  finalGradeLabel: string;
  finalProductFormLabel: string;
  quantity: string;
  price: string;
  status: WhatsappUploadStatus;
  accountStatus: string;
  accountId: string;
  accountType: string;
  credentialsSentAt: string;
  emailDeliveryStatus: string;
  emailRecipient: string;
  clientFollowUpRequired: boolean;
  listingStatus: string;
  listingId: string;
};

const actionStatuses: WhatsappUploadStatus[] = [
  'Contacted',
  'Needs More Details',
  'Ready to Upload',
  'Converted',
  'Rejected',
];

function shortDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function accountPillClass(status: string) {
  if (status === 'Email Sent' || status === 'Account Created') return 'pill green';
  if (status === 'Needs Follow-up') return 'pill gold';
  return 'pill';
}

export default function WhatsappUploadsAdmin({ initialRows }: { initialRows: AdminRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState('');
  const [loadingId, setLoadingId] = useState('');

  async function refresh() {
    const data = await fetch('/api/whatsapp-uploads', { cache: 'no-store' }).then((res) => res.json());
    if (data.ok) setRows(data.rows || []);
  }

  async function setStatus(submissionId: string, status: WhatsappUploadStatus) {
    setLoadingId(`${submissionId}-${status}`);
    const res = await fetch(`/api/whatsapp-uploads/${encodeURIComponent(submissionId)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, note: `Quick action: ${status}` }),
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to update status.' }));
    setLoadingId('');
    if (res.ok) {
      setMessage(`${submissionId} marked ${status}.`);
      refresh().catch(() => {});
    } else {
      setMessage(res.error || 'Unable to update status.');
    }
  }

  return (
    <section className="adminShell section">
      <div className="container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Protected admin review</span>
            <h1 className="pageTitle">WhatsApp Assisted Uploads</h1>
            <p className="muted">Every public WhatsApp-assisted submission stays Pending Review until Talmech manually verifies and converts it.</p>
          </div>
          <div className="row">
            <Link className="btn secondary" href="/whatsapp-upload">Open public form</Link>
            <Link className="btn" href="/admin/whatsapp-uploads/manual-listing">Create Client + Listing</Link>
            <button className="btn" type="button" onClick={refresh}>Refresh</button>
          </div>
        </div>

        {message && <p className="notice">{message}</p>}

        <div className="waAdminModeStrip">
          <article>
            <span className="pill">1</span>
            <h2>WhatsApp submissions</h2>
            <p className="muted">Review public WhatsApp-assisted uploads, then create the client account and listing from a real submission row.</p>
          </article>
          <article>
            <span className="pill gold">2</span>
            <h2>Manual admin creation</h2>
            <p className="muted">Create a client account and listing even when there are zero WhatsApp submissions.</p>
            <Link className="btn secondary" href="/admin/whatsapp-uploads/manual-listing">Manual Listing</Link>
          </article>
        </div>

        <div className="grid cards4">
          <div className="card"><h2>{rows.length}</h2><p className="muted">Total submissions</p></div>
          <div className="card"><h2>{rows.filter((row) => row.status === 'Pending Review').length}</h2><p className="muted">Pending Review</p></div>
          <div className="card"><h2>{rows.filter((row) => row.status === 'Ready to Upload').length}</h2><p className="muted">Ready to Upload</p></div>
          <div className="card"><h2>{rows.filter((row) => row.status === 'Converted').length}</h2><p className="muted">Converted</p></div>
        </div>
        <div className="grid cards4 waAccountSummaryGrid">
          <div className="card"><h2>{rows.filter((row) => row.accountStatus === 'Not Created').length}</h2><p className="muted">Accounts not created</p></div>
          <div className="card"><h2>{rows.filter((row) => row.accountStatus === 'Account Created' || row.accountStatus === 'Email Sent').length}</h2><p className="muted">Accounts created</p></div>
          <div className="card"><h2>{rows.filter((row) => row.emailDeliveryStatus === 'sent').length}</h2><p className="muted">Client emails sent</p></div>
          <div className="card"><h2>{rows.filter((row) => row.accountStatus === 'Needs Follow-up' || row.clientFollowUpRequired).length}</h2><p className="muted">Needs follow-up</p></div>
        </div>

        <div className="waAdminTableWrap">
          <table className="waAdminTable">
            <thead>
              <tr>
                <th>Submission</th>
                <th>Date</th>
                <th>Role</th>
                <th>Submission Type</th>
                <th>Firm / Contact</th>
                <th>Location</th>
                <th>Product</th>
                <th>Material</th>
                <th>Grade</th>
                <th>Form</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
                <th>Account Status</th>
                <th>Listing Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.submissionId}>
                  <td><Link href={`/admin/whatsapp-uploads/${row.submissionId}`}>{row.submissionId}</Link></td>
                  <td>{shortDate(row.date)}</td>
                  <td>{row.role}</td>
                  <td>{row.submissionType}</td>
                  <td><b>{row.firmName || '-'}</b><br /><span>{row.contactPerson || '-'} / {row.maskedMobile || '-'}</span></td>
                  <td>{[row.city, row.state].filter(Boolean).join(', ') || '-'}</td>
                  <td>{row.finalProductLabel || row.productOrRequirementName || '-'}</td>
                  <td>{row.finalMetalLabel || '-'}</td>
                  <td>{row.finalGradeLabel || '-'}</td>
                  <td>{row.finalProductFormLabel || '-'}</td>
                  <td>{row.quantity || '-'}</td>
                  <td>{row.price || '-'}</td>
                  <td><span className="pill">{row.status}</span></td>
                  <td>
                    <span className={accountPillClass(row.accountStatus)}>{row.accountStatus || 'Not Created'}</span>
                    {row.clientFollowUpRequired && <span className="pill gold followUpPill">Client follow-up required</span>}
                    {row.accountId && <p className="waAccountMini">{row.accountId}<br />{row.accountType || '-'}</p>}
                    {row.credentialsSentAt && <p className="waAccountMini">Email: {row.emailDeliveryStatus || 'queued'}<br />{row.emailRecipient || ''}<br />{shortDate(row.credentialsSentAt)}</p>}
                  </td>
                  <td>
                    <span className={row.listingStatus === 'Listing Created' ? 'pill green' : 'pill'}>{row.listingStatus || 'Not Created'}</span>
                    {row.listingId && <p className="waAccountMini">{row.listingId}</p>}
                  </td>
                  <td>
                    <div className="waAdminActions">
                      <Link className="btn secondary" href={`/admin/whatsapp-uploads/${row.submissionId}`}>View</Link>
                      <Link className="btn secondary" href={`/admin/whatsapp-uploads/${row.submissionId}`}>{row.accountId ? 'Account Detail' : 'Create Account'}</Link>
                      {actionStatuses.map((status) => (
                        <button
                          className="btn secondary"
                          type="button"
                          key={status}
                          disabled={loadingId === `${row.submissionId}-${status}`}
                          onClick={() => setStatus(row.submissionId, status)}
                        >
                          {loadingId === `${row.submissionId}-${status}` ? 'Updating...' : status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={16}>
                    No WhatsApp-assisted submissions yet.
                    <div className="waEmptyAction"><Link className="btn" href="/admin/whatsapp-uploads/manual-listing">Create Client + Listing manually</Link></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
