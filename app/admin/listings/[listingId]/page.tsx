import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminListingClientEmailActions from '@/components/AdminListingClientEmailActions';
import AdminListingStatusActions from '@/components/AdminListingStatusActions';
import { generateListingStrategy } from '@/lib/listingIntelligence';
import { productImagesFromListing } from '@/lib/listingImages';
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
  const images = productImagesFromListing(listing);
  const strategy = generateListingStrategy(listing);
  const notification = raw.clientNotification && typeof raw.clientNotification === 'object'
    ? raw.clientNotification
    : {
        emailStatus: raw.clientNotificationStatus,
        emailProvider: raw.clientNotificationProvider,
        emailRecipient: raw.clientNotificationRecipient || raw.ownerEmail,
        emailSender: raw.clientNotificationSender,
        lastAttemptAt: raw.clientNotificationLastAttemptAt,
        lastEmailSentAt: raw.clientNotificationLastEmailSentAt,
        lastSentAt: raw.clientNotificationLastSentAt,
        emailError: raw.clientNotificationEmailError || raw.clientNotificationError,
        clientFollowUpRequired: raw.clientFollowUpRequired,
      };
  const missingInformation = Array.isArray(raw.missingInformation) ? raw.missingInformation : [];

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
            <Link className="btn secondary" href="/admin/listing-intelligence">Listing Intelligence</Link>
            <Link className="btn secondary" href="/public-marketplace">Open marketplace</Link>
          </div>
        </div>
        <section className="waDetailPanel wide">
          <div className="sectionHead">
            <div>
              <h2>Product images</h2>
              <p className="muted">Up to 3 images are stored as safe listing image metadata. Missing images should be requested before buyer outreach.</p>
            </div>
            <span className={images.length ? 'pill green' : 'pill gold'}>{images.length ? `${images.length} image${images.length === 1 ? '' : 's'}` : 'Needs photos'}</span>
          </div>
          {images.length ? (
            <div className="listingImageGallery">
              {images.map((image) => <img key={image.imageId || image.url} src={image.url} alt={image.alt || listing.product} />)}
            </div>
          ) : <p className="notice slimNotice">No product images attached. Ask the client for clear product, lot, certificate, and loading photos.</p>}
        </section>
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
            <h2>Category classification</h2>
            <Field label="Metal" value={listing.metal || 'Insufficient data'} />
            <Field label="Product" value={listing.product || 'Insufficient data'} />
            <Field label="Grade" value={listing.grade || 'Insufficient data'} />
            <Field label="Product form" value={listing.productForm || raw.productForm || 'Insufficient data'} />
            <Field label="Region" value={[listing.city, listing.state].filter(Boolean).join(', ') || 'Insufficient data'} />
            <Field label="Listing type" value={raw.listingKind || listing.type || 'Insufficient data'} />
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
        <AdminListingClientEmailActions
          listingId={listing.id}
          initialNotification={notification}
          initialMissingInformation={missingInformation}
        />
        <section className="waDetailPanel wide">
          <div className="sectionHead">
            <div>
              <h2>Intelligence and strategy</h2>
              <p className="muted">Rules-based strategy generated from listing data. No exact market demand number is inferred.</p>
            </div>
            <span className={strategy.qualityScore >= 75 ? 'pill green' : 'pill gold'}>Quality {strategy.qualityScore}</span>
          </div>
          <div className="grid cards3">
            <div className="card">
              <h3>Target buyer profiles</h3>
              {strategy.targetBuyerProfiles.map((item) => <p key={item}>{item}</p>)}
            </div>
            <div className="card">
              <h3>Target industries</h3>
              {strategy.targetIndustries.map((item) => <p key={item}>{item}</p>)}
            </div>
            <div className="card">
              <h3>Admin actions</h3>
              {strategy.suggestedAdminActions.map((item) => <p key={item}>{item}</p>)}
            </div>
          </div>
          <p className="notice slimNotice">{strategy.recommendedPitch}</p>
          {strategy.missingDataWarnings.length > 0 && <p className="notice slimNotice">{strategy.missingDataWarnings.join(' ')}</p>}
        </section>
        <section className="waDetailPanel wide">
          <h2>Admin status actions</h2>
          <AdminListingStatusActions listingId={listing.id} raw={raw} />
        </section>
      </div>
    </main>
  );
}
