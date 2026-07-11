'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function raw(row: any) {
  return row?.raw && typeof row.raw === 'object' ? row.raw : {};
}

function ownerLabel(row: any) {
  const r = raw(row);
  return r.firmName || r.contactPerson || r.ownerEmail || r.ownerMobile || 'Unlinked listing';
}

function listingImages(row: any) {
  const images = row.productImages || raw(row).productImages || row.previewImages || [];
  if (!Array.isArray(images)) return [];
  return images.slice(0, 3).map((image, index) => {
    if (typeof image === 'string') return { imageId: `${row.id || 'listing'}-${index}`, url: image, alt: row.product || `Listing image ${index + 1}` };
    return image;
  });
}

export default function AdminListingsConsole({ initialListings, initialStrategies = {} }: { initialListings: any[]; initialStrategies?: Record<string, any> }) {
  const [listings, setListings] = useState(initialListings);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [emailLoadingId, setEmailLoadingId] = useState('');
  const [manualCopy, setManualCopy] = useState<{ listingId: string; temporaryPassword?: string; instructions?: string } | null>(null);

  const filtered = useMemo(() => listings.filter((listing) => {
    if (!query) return true;
    return JSON.stringify(listing).toLowerCase().includes(query.toLowerCase());
  }), [listings, query]);

  async function patchListing(id: string, patch: any, success: string) {
    const res = await fetch('/api/marketplace-listings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, patch }),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to update listing.' }));
    if (res.ok) {
      setListings((rows) => rows.map((row) => row.id === id ? { ...row, ...res.listing } : row));
      setMessage(success);
    } else {
      setMessage(res.error || 'Unable to update listing.');
    }
  }

  async function deleteListing(id: string) {
    if (!window.confirm(`Delete listing ${id}? This cannot be undone.`)) return;
    const res = await fetch(`/api/marketplace-listings?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to delete listing.' }));
    if (res.ok) {
      setListings((rows) => rows.filter((row) => row.id !== id));
      setMessage(`${id} deleted.`);
    } else {
      setMessage(res.error || 'Unable to delete listing.');
    }
  }

  function notification(row: any) {
    const r = raw(row);
    return r.clientNotification && typeof r.clientNotification === 'object'
      ? r.clientNotification
      : {
          emailStatus: r.clientNotificationStatus,
          emailProvider: r.clientNotificationProvider,
          emailRecipient: r.clientNotificationRecipient || r.ownerEmail,
          emailSender: r.clientNotificationSender,
          lastAttemptAt: r.clientNotificationLastAttemptAt,
          lastEmailSentAt: r.clientNotificationLastEmailSentAt,
          lastSentAt: r.clientNotificationLastSentAt,
          emailError: r.clientNotificationEmailError || r.clientNotificationError,
          clientFollowUpRequired: r.clientFollowUpRequired,
        };
  }

  function missingItems(row: any) {
    const fromRaw = raw(row).missingInformation;
    if (Array.isArray(fromRaw)) return fromRaw;
    const strategy = initialStrategies[row.id];
    return Array.isArray(strategy?.missingDataWarnings)
      ? strategy.missingDataWarnings.map((message: string) => ({ label: 'Listing warning', message }))
      : [];
  }

  function emailStatusClass(row: any) {
    const status = String(notification(row).emailStatus || '').toLowerCase();
    if (status === 'sent') return 'pill green';
    if (status === 'failed' || status === 'preview' || status.includes('error')) return 'pill gold';
    return 'pill';
  }

  async function resendClientEmail(row: any) {
    setEmailLoadingId(row.id);
    setManualCopy(null);
    const res = await fetch(`/api/admin/listings/${encodeURIComponent(row.id)}/resend-client-email`, {
      method: 'POST',
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to resend client email.' }));
    setEmailLoadingId('');

    if (!res.ok) {
      setMessage(res.error || 'Unable to resend client email.');
      return;
    }

    const tracking = res.email?.tracking || {};
    const missing = Array.isArray(res.missingInformation) ? res.missingInformation : [];
    setListings((rows) => rows.map((listing) => listing.id === row.id ? {
      ...listing,
      raw: {
        ...raw(listing),
        clientNotification: tracking,
        clientNotificationStatus: tracking.emailStatus || res.email?.status,
        clientNotificationRecipient: tracking.emailRecipient,
        clientNotificationSender: tracking.emailSender,
        clientNotificationProvider: tracking.emailProvider || res.email?.provider,
        clientNotificationLastAttemptAt: tracking.lastAttemptAt,
        clientNotificationLastEmailSentAt: tracking.lastEmailSentAt,
        clientNotificationLastSentAt: tracking.lastSentAt,
        clientNotificationEmailError: tracking.emailError,
        clientNotificationError: tracking.errorMessage,
        missingInformation: missing,
        clientFollowUpRequired: missing.length > 0 || tracking.emailStatus !== 'sent',
      },
    } : listing));
    if (res.manualCopy) setManualCopy({ listingId: row.id, ...res.manualCopy });
    setMessage(res.email?.status === 'sent'
      ? `Client email sent for ${row.id}.`
      : res.email?.status === 'preview'
        ? `Client email preview is available for ${row.id}. Configure SMTP or copy the instructions.`
        : `Client email failed for ${row.id}. Check SMTP settings or copy the instructions.`);
  }

  async function copyManualInstructions() {
    if (!manualCopy?.instructions) return;
    await navigator.clipboard.writeText(manualCopy.instructions);
    setMessage(`One-time instructions copied for ${manualCopy.listingId}.`);
  }

  return (
    <main className="adminShell section">
      <div className="container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Admin listings</span>
            <h1 className="pageTitle">Marketplace listings</h1>
            <p className="muted">Real listings only. Demo marketplace rows are excluded from this admin surface.</p>
          </div>
          <Link className="btn secondary" href="/admin">Admin home</Link>
        </div>
        <div className="panel adminToolbar listingAdminToolbar">
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search listing, owner, metal, product, city..." />
          <div className="row">
            <Link className="btn secondary" href="/admin/listing-intelligence">Listing Intelligence</Link>
            <Link className="btn secondary" href="/admin/whatsapp-uploads">WhatsApp queue</Link>
            <Link className="btn" href="/admin/whatsapp-uploads/manual-listing">Create Client + Listing</Link>
          </div>
        </div>
        {message && <p className="notice">{message}</p>}
        {manualCopy && (
          <div className="manualCopyBox adminManualCopy">
            <span className="pill gold">Shown once</span>
            <h3>Manual delivery instructions for {manualCopy.listingId}</h3>
            <p className="muted">Email delivery was not confirmed. Copy these instructions now if the client needs credentials; the temporary password is not stored in plain text.</p>
            {manualCopy.temporaryPassword && <label>Temporary password<input className="input" readOnly value={manualCopy.temporaryPassword} onFocus={(event) => event.currentTarget.select()} /></label>}
            <label>Message preview<textarea readOnly value={manualCopy.instructions || ''} onFocus={(event) => event.currentTarget.select()} /></label>
            <button className="btn secondary" type="button" onClick={copyManualInstructions}>Copy instructions</button>
          </div>
        )}
        <div className="waAdminTableWrap">
          <table className="waAdminTable adminListingTable">
            <thead>
              <tr>
                <th>Listing ID</th>
                <th>Images</th>
                <th>Owner account / firm</th>
                <th>Source</th>
                <th>Type</th>
                <th>Metal</th>
                <th>Product</th>
                <th>Grade</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>City / State</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Strategy</th>
                <th>Email / follow-up</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => {
                const r = raw(listing);
                const note = notification(listing);
                const missing = missingItems(listing);
                const followUpRequired = Boolean(note.clientFollowUpRequired || r.clientFollowUpRequired || missing.length || note.emailStatus !== 'sent');
                return (
                  <tr key={listing.id}>
                    <td><Link href={`/admin/listings/${listing.id}`}>{listing.id}</Link></td>
                    <td><div className="listingMiniImages">{listingImages(listing).map((image: any) => <img key={image.imageId || image.url} src={image.url} alt={image.alt || listing.product} />)}{!listingImages(listing).length && <span className="pill gold">Needs photos</span>}</div></td>
                    <td><b>{ownerLabel(listing)}</b><br /><span>{r.accountId || r.ownerUserId || '-'}</span></td>
                    <td>{r.source || listing.source || '-'}</td>
                    <td>{r.listingKind || listing.type}</td>
                    <td>{listing.metal || '-'}</td>
                    <td>{listing.product || '-'}</td>
                    <td>{listing.grade || '-'}</td>
                    <td>{[listing.quantity, listing.unit].filter(Boolean).join(' ') || '-'}</td>
                    <td>{listing.targetPrice || listing.priceType || 'Quote'}</td>
                    <td>{[listing.city, listing.state].filter(Boolean).join(', ') || '-'}</td>
                    <td><span className="pill">{listing.status || '-'}</span></td>
                    <td><span className={r.listingVisibility === 'public' ? 'pill green' : 'pill gold'}>{r.listingVisibility || 'public'} / {r.listingApprovalStatus || 'approved'}</span></td>
                    <td><span className={(initialStrategies[listing.id]?.qualityScore || 0) >= 75 ? 'pill green' : 'pill gold'}>Quality {initialStrategies[listing.id]?.qualityScore || '-'}</span><p className="waAccountMini">{initialStrategies[listing.id]?.suggestedAdminActions?.[0] || 'Needs admin verification'}</p></td>
                    <td>
                      <span className={emailStatusClass(listing)}>{note.emailStatus || 'not sent'}</span>
                      {followUpRequired && <span className="pill gold followUpPill">Client follow-up required</span>}
                      <p className="waAccountMini">{note.emailRecipient || r.ownerEmail || 'No recipient email'}</p>
                      {note.emailSender && <p className="waAccountMini">From: {note.emailSender}</p>}
                      {missing.length > 0 && <p className="waAccountMini">{missing.slice(0, 2).map((item: any) => item.label || item.message || String(item)).join(' / ')}</p>}
                      {note.emailError && <p className="waAccountMini">{note.emailError}</p>}
                    </td>
                    <td>{formatDate(listing.createdAt)}</td>
                    <td>
                      <div className="waAdminActions">
                        <Link className="btn secondary" href={`/admin/listings/${listing.id}`}>View</Link>
                        <button className="btn secondary" type="button" disabled={emailLoadingId === listing.id} onClick={() => resendClientEmail(listing)}>{emailLoadingId === listing.id ? 'Sending...' : 'Resend email'}</button>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: 'Open', verified: true, raw: { ...r, listingVisibility: 'public', listingApprovalStatus: 'approved', adminActionStatus: 'Verified' } }, `${listing.id} verified.`)}>Verified</button>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: 'Needs photos', raw: { ...r, listingApprovalStatus: 'needs_photos', adminActionStatus: 'Needs photos' } }, `${listing.id} marked needs photos.`)}>Needs photos</button>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: 'Needs price confirmation', raw: { ...r, listingApprovalStatus: 'needs_price_confirmation', adminActionStatus: 'Needs price confirmation' } }, `${listing.id} marked needs price confirmation.`)}>Needs price</button>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: 'Needs buyer outreach', raw: { ...r, listingApprovalStatus: 'needs_buyer_outreach', adminActionStatus: 'Needs buyer outreach' } }, `${listing.id} marked for buyer outreach.`)}>Buyer outreach</button>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: 'Matched with buyer', raw: { ...r, listingApprovalStatus: 'matched_with_buyer', adminActionStatus: 'Matched with buyer' } }, `${listing.id} matched with buyer.`)}>Matched</button>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: 'Paused', raw: { ...r, listingVisibility: 'private', listingApprovalStatus: 'paused', adminActionStatus: 'Paused' } }, `${listing.id} paused.`)}>Paused</button>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: listing.type === 'BUY' ? 'Fulfilled' : 'Sold', lockStatus: 'Closed', raw: { ...r, listingApprovalStatus: 'fulfilled', adminActionStatus: 'Sold/Fulfilled' } }, `${listing.id} closed.`)}>Sold / Fulfilled</button>
                        <button className="btn dark" type="button" onClick={() => deleteListing(listing.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={17}>No real marketplace listings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
