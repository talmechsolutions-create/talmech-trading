'use client';

import Link from 'next/link';
import { useState } from 'react';
import ListingImagePicker from '@/components/ListingImagePicker';
import type { ListingImage } from '@/lib/listingImages';

const accountTypes = ['Buyer', 'Seller', 'Trader', 'Supplier', 'Manufacturer'];
const listingTypes = ['Sell Listing', 'Buy Requirement', 'Scrap Listing', 'Trader Deal'];

const initialAccount = {
  accountType: 'Buyer',
  fullName: '',
  firmName: '',
  email: '',
  mobile: '',
  alternateMobile: '',
  gstNumber: '',
  city: '',
  state: '',
  address: '',
};

const initialListing = {
  listingType: 'Sell Listing',
  metal: '',
  product: '',
  grade: '',
  productForm: '',
  sizeOrSpecification: '',
  quantity: '',
  quantityUnit: 'KG',
  price: '',
  priceUnit: 'per kg',
  taxStatus: 'not sure',
  stockStatus: 'Ready stock',
  certificateAvailable: '',
  certificateRequired: '',
  dispatchLocation: '',
  deliveryLocation: '',
  city: '',
  state: '',
  deliveryTimeline: '',
  remarks: '',
  productImages: [] as ListingImage[],
};

function Field({ label, value }: { label: string; value: unknown }) {
  return <p><b>{label}:</b> {String(value || '-')}</p>;
}

export default function ManualListingAdmin() {
  const [account, setAccountForm] = useState(initialAccount);
  const [listing, setListingForm] = useState(initialListing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);

  function setAccount(key: string, value: string) {
    setAccountForm((form) => ({ ...form, [key]: value }));
  }

  function setListing(key: string, value: any) {
    setListingForm((form) => ({ ...form, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    setMessage('Creating client account and listing...');
    setResult(null);
    const res = await fetch('/api/admin/whatsapp-uploads/manual-listing', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ account, listing }),
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to create account and listing.' }));
    setSaving(false);
    if (!res.ok) {
      setMessage(res.error || 'Unable to create account and listing.');
      return;
    }
    setMessage(res.accountAction === 'created'
      ? 'Client account and listing created.'
      : 'Existing client account linked and listing created.');
    setResult(res);
  }

  return (
    <section className="adminShell section">
      <div className="container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Protected manual workflow</span>
            <h1 className="pageTitle">Create Client + Listing</h1>
            <p className="muted">Use this when the client details came through WhatsApp, phone, email, or an offline conversation and there is no public WhatsApp submission row yet.</p>
          </div>
          <div className="row">
            <Link className="btn secondary" href="/admin/whatsapp-uploads">Back to WhatsApp uploads</Link>
            <Link className="btn secondary" href="/admin/listings">Open admin listings</Link>
          </div>
        </div>

        {message && <p className={result ? 'success' : 'notice'}>{message}</p>}

        {result && (
          <section className="panel manualResultPanel">
            <div className="sectionHead">
              <div>
                <span className="pill green">{result.accountAction === 'created' ? 'Account created' : 'Existing account linked'}</span>
                <h2>Creation result</h2>
                <p className="muted">The listing is linked to the account through server-side owner metadata.</p>
              </div>
              <div className="row">
                <Link className="btn" href={`/admin/listings/${result.listing?.id}`}>View admin listing</Link>
                <Link className="btn secondary" href="/account">Client dashboard path</Link>
              </div>
            </div>
            <div className="grid cards3">
              <div className="card">
                <h3>Account</h3>
                <Field label="ID" value={result.account?.id} />
                <Field label="Firm" value={result.account?.firmName} />
                <Field label="Email" value={result.account?.email} />
                <Field label="Mobile" value={result.account?.primaryMobile} />
              </div>
              <div className="card">
                <h3>Listing</h3>
                <Field label="ID" value={result.listing?.id} />
                <Field label="Type" value={result.listing?.listingKind || result.listing?.type} />
                <Field label="Product" value={[result.listing?.metal, result.listing?.product, result.listing?.grade].filter(Boolean).join(' / ')} />
                <Field label="Status" value={result.listing?.status} />
              </div>
              <div className="card">
                <h3>Email</h3>
                <Field label="Status" value={result.email?.status} />
                <Field label="Provider" value={result.email?.provider} />
                <p className="muted">{result.email?.status === 'sent' ? 'Login email was sent by the configured provider.' : 'Email provider is missing or failed. Copy the one-time instructions below.'}</p>
              </div>
            </div>
            {result.manualCopy && (
              <div className="manualCopyBox">
                <span className="pill gold">Shown once</span>
                <h3>Temporary password and login instructions</h3>
                <p className="notice">Copy this now. The temporary password is not stored in plain text and will not be shown again after leaving this result.</p>
                <label>Temporary password<input className="input" readOnly value={result.manualCopy.temporaryPassword || ''} onFocus={(event) => event.currentTarget.select()} /></label>
                <label>Message preview<textarea readOnly value={result.manualCopy.instructions || ''} onFocus={(event) => event.currentTarget.select()} /></label>
              </div>
            )}
          </section>
        )}

        <div className="manualListingLayout">
          <section className="panel manualListingPanel">
            <span className="pill">Section 1</span>
            <h2>Client Account</h2>
            <p className="muted">If email or mobile already exists, this flow links the listing to the existing account instead of creating a duplicate.</p>
            <div className="formGrid">
              <label>Account type<select value={account.accountType} onChange={(event) => setAccount('accountType', event.target.value)}>{accountTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Full name<input className="input" value={account.fullName} onChange={(event) => setAccount('fullName', event.target.value)} /></label>
              <label>Firm name<input className="input" value={account.firmName} onChange={(event) => setAccount('firmName', event.target.value)} /></label>
              <label>Email<input className="input" type="email" value={account.email} onChange={(event) => setAccount('email', event.target.value)} /></label>
              <label>Mobile<input className="input" value={account.mobile} onChange={(event) => setAccount('mobile', event.target.value)} /></label>
              <label>Alternate mobile<input className="input" value={account.alternateMobile} onChange={(event) => setAccount('alternateMobile', event.target.value)} /></label>
              <label>GST number<input className="input" value={account.gstNumber} onChange={(event) => setAccount('gstNumber', event.target.value.toUpperCase())} /></label>
              <label>City<input className="input" value={account.city} onChange={(event) => setAccount('city', event.target.value)} /></label>
              <label>State<input className="input" value={account.state} onChange={(event) => setAccount('state', event.target.value)} /></label>
              <label className="span2">Address<textarea value={account.address} onChange={(event) => setAccount('address', event.target.value)} /></label>
            </div>
            <div className="manualPasswordStrategy">
              <b>Password strategy</b>
              <p>New manual accounts receive a generated temporary password, email/mobile OTP is bypassed only for this admin-created account, and the client must change the password after first login.</p>
            </div>
          </section>

          <section className="panel manualListingPanel">
            <span className="pill">Section 2</span>
            <h2>Listing / Requirement</h2>
            <p className="muted">Admin-created listings are linked to the client workspace and appear in the admin listings console.</p>
            <div className="formGrid">
              <label>Listing type<select value={listing.listingType} onChange={(event) => setListing('listingType', event.target.value)}>{listingTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Metal<input className="input" value={listing.metal} onChange={(event) => setListing('metal', event.target.value)} /></label>
              <label>Product<input className="input" value={listing.product} onChange={(event) => setListing('product', event.target.value)} /></label>
              <label>Grade<input className="input" value={listing.grade} onChange={(event) => setListing('grade', event.target.value)} /></label>
              <label>Product form<input className="input" value={listing.productForm} onChange={(event) => setListing('productForm', event.target.value)} /></label>
              <label>Size / specification<input className="input" value={listing.sizeOrSpecification} onChange={(event) => setListing('sizeOrSpecification', event.target.value)} /></label>
              <label>Quantity<input className="input" value={listing.quantity} onChange={(event) => setListing('quantity', event.target.value)} /></label>
              <label>Quantity unit<input className="input" value={listing.quantityUnit} onChange={(event) => setListing('quantityUnit', event.target.value)} /></label>
              <label>Price / target price<input className="input" value={listing.price} onChange={(event) => setListing('price', event.target.value)} /></label>
              <label>Price unit<input className="input" value={listing.priceUnit} onChange={(event) => setListing('priceUnit', event.target.value)} /></label>
              <label>GST<select value={listing.taxStatus} onChange={(event) => setListing('taxStatus', event.target.value)}><option>not sure</option><option>GST included</option><option>GST extra</option></select></label>
              <label>Stock status<input className="input" value={listing.stockStatus} onChange={(event) => setListing('stockStatus', event.target.value)} /></label>
              <label>Certificate available<input className="input" value={listing.certificateAvailable} onChange={(event) => setListing('certificateAvailable', event.target.value)} /></label>
              <label>Certificate required<input className="input" value={listing.certificateRequired} onChange={(event) => setListing('certificateRequired', event.target.value)} /></label>
              <label className="span2">Dispatch location<textarea value={listing.dispatchLocation} onChange={(event) => setListing('dispatchLocation', event.target.value)} /></label>
              <label className="span2">Delivery location<textarea value={listing.deliveryLocation} onChange={(event) => setListing('deliveryLocation', event.target.value)} /></label>
              <label>City<input className="input" value={listing.city} onChange={(event) => setListing('city', event.target.value)} /></label>
              <label>State<input className="input" value={listing.state} onChange={(event) => setListing('state', event.target.value)} /></label>
              <label>Delivery timeline<input className="input" value={listing.deliveryTimeline} onChange={(event) => setListing('deliveryTimeline', event.target.value)} /></label>
              <label className="span2">Remarks<textarea value={listing.remarks} onChange={(event) => setListing('remarks', event.target.value)} /></label>
              <ListingImagePicker
                images={listing.productImages || []}
                onChange={(images) => setListing('productImages', images as any)}
                helpText="Optional. Product images improve buyer response. Upload works in local dev; production should use a configured storage provider or hosted image URLs."
              />
            </div>
          </section>
        </div>

        <div className="manualSubmitBar">
          <div>
            <b>Create Account & Listing</b>
            <p className="muted">This action requires an admin session and stores only a password hash for new accounts.</p>
          </div>
          <button className="btn" type="button" disabled={saving} onClick={submit}>{saving ? 'Creating...' : 'Create Account & Listing'}</button>
        </div>
      </div>
    </section>
  );
}
