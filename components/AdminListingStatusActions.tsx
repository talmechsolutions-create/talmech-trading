'use client';

import { useState } from 'react';

const actions = [
  { label: 'Verified', status: 'Open', rawStatus: 'approved', visibility: 'public', verified: true },
  { label: 'Needs photos', status: 'Needs photos', rawStatus: 'needs_photos' },
  { label: 'Needs price confirmation', status: 'Needs price confirmation', rawStatus: 'needs_price_confirmation' },
  { label: 'Needs buyer outreach', status: 'Needs buyer outreach', rawStatus: 'needs_buyer_outreach' },
  { label: 'Matched with buyer', status: 'Matched with buyer', rawStatus: 'matched_with_buyer' },
  { label: 'Paused', status: 'Paused', rawStatus: 'paused', visibility: 'private' },
  { label: 'Sold/Fulfilled', status: 'Sold/Fulfilled', rawStatus: 'fulfilled', lockStatus: 'Closed' },
];

export default function AdminListingStatusActions({ listingId, raw }: { listingId: string; raw: Record<string, any> }) {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState('');

  async function apply(action: typeof actions[number]) {
    setSaving(action.label);
    const res = await fetch('/api/marketplace-listings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: listingId,
        patch: {
          status: action.status,
          lockStatus: action.lockStatus,
          verified: action.verified,
          raw: {
            ...raw,
            listingVisibility: action.visibility || raw.listingVisibility || 'public',
            listingApprovalStatus: action.rawStatus,
            adminActionStatus: action.label,
          },
        },
      }),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to update listing.' }));
    setSaving('');
    setMessage(res.ok ? `${listingId} marked ${action.label}.` : res.error || 'Unable to update listing.');
  }

  return (
    <div className="adminListingActionPanel">
      <div className="waActionRow">
        {actions.map((action) => (
          <button className="btn secondary" type="button" key={action.label} disabled={saving === action.label} onClick={() => apply(action)}>
            {saving === action.label ? 'Updating...' : action.label}
          </button>
        ))}
      </div>
      {message && <p className="notice slimNotice">{message}</p>}
    </div>
  );
}
