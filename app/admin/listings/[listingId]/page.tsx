import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findListing } from '@/lib/proDb';

export const metadata: Metadata = {
  title: 'Admin Listing Detail',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="waDetailField">
      <span>{label}</span>
      <b>{String(value || '-')}</b>
    </div>
  );
}

export default async function AdminListingDetailPage({ params }: { params: { listingId: string } }) {
  const listing = await findListing(params.listingId);
  if (!listing) notFound();
  const raw = listing.raw && typeof listing.raw === 'object' ? listing.raw : {};

  return (
    <main className="adminShell section">
      <div className="container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Listing detail</span>
            <h1 className="pageTitle">{listing.id}</h1>
            <p className="muted">Protected admin view for owner, source, and workflow metadata.</p>
          </div>
          <div className="waActionRow">
            <Link className="btn secondary" href="/admin/listings">Back to listings</Link>
            <Link className="btn secondary" href="/public-marketplace">Open marketplace</Link>
          </div>
        </div>
        <section className="waDetailGrid">
          <article className="waDetailPanel">
            <h2>Listing</h2>
            <Field label="Type" value={raw.listingKind || listing.type} />
            <Field label="Metal" value={listing.metal} />
            <Field label="Product" value={listing.product} />
            <Field label="Grade" value={listing.grade} />
            <Field label="Quantity" value={[listing.quantity, listing.unit].filter(Boolean).join(' ')} />
            <Field label="Price" value={listing.targetPrice || listing.priceType} />
            <Field label="Status" value={listing.status} />
            <Field label="Visibility" value={`${raw.listingVisibility || 'public'} / ${raw.listingApprovalStatus || 'approved'}`} />
          </article>
          <article className="waDetailPanel">
            <h2>Owner and source</h2>
            <Field label="Firm" value={raw.firmName} />
            <Field label="Contact" value={raw.contactPerson} />
            <Field label="Account ID" value={raw.accountId || raw.ownerUserId} />
            <Field label="Email" value={raw.ownerEmail} />
            <Field label="Mobile" value={raw.ownerMobile} />
            <Field label="Source" value={raw.source} />
            <Field label="WhatsApp submission" value={raw.whatsappSubmissionId} />
            <Field label="Created by admin" value={raw.createdByAdmin ? 'Yes' : 'No'} />
          </article>
        </section>
        <section className="waDetailPanel wide">
          <h2>Technical summary</h2>
          <p>{listing.technicalSummary || '-'}</p>
        </section>
      </div>
    </main>
  );
}
