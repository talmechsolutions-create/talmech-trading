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

export default function AdminListingsConsole({ initialListings }: { initialListings: any[] }) {
  const [listings, setListings] = useState(initialListings);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

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
            <Link className="btn secondary" href="/admin/whatsapp-uploads">WhatsApp queue</Link>
            <Link className="btn" href="/admin/whatsapp-uploads/manual-listing">Create Client + Listing</Link>
          </div>
        </div>
        {message && <p className="notice">{message}</p>}
        <div className="waAdminTableWrap">
          <table className="waAdminTable adminListingTable">
            <thead>
              <tr>
                <th>Listing ID</th>
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
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => {
                const r = raw(listing);
                return (
                  <tr key={listing.id}>
                    <td><Link href={`/admin/listings/${listing.id}`}>{listing.id}</Link></td>
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
                    <td>{formatDate(listing.createdAt)}</td>
                    <td>
                      <div className="waAdminActions">
                        <Link className="btn secondary" href={`/admin/listings/${listing.id}`}>View</Link>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: 'Paused', raw: { ...r, listingVisibility: 'private', listingApprovalStatus: 'paused' } }, `${listing.id} paused.`)}>Pause</button>
                        <button className="btn secondary" type="button" onClick={() => patchListing(listing.id, { status: listing.type === 'BUY' ? 'Fulfilled' : 'Sold', lockStatus: 'Closed', raw: { ...r, listingApprovalStatus: 'fulfilled' } }, `${listing.id} closed.`)}>Sold / Fulfilled</button>
                        <button className="btn dark" type="button" onClick={() => deleteListing(listing.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={14}>No real marketplace listings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
