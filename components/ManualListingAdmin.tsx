'use client';

import Link from 'next/link';
import { useState } from 'react';
import ListingImagePicker from '@/components/ListingImagePicker';
import MetalProductSelector from '@/components/MetalProductSelector';
import type { ListingImage } from '@/lib/listingImages';
import {
  WHATSAPP_CERTIFICATE_OPTIONS,
  WHATSAPP_PRICE_UNITS,
  WHATSAPP_QUANTITY_UNITS,
  WHATSAPP_STOCK_STATUS_OPTIONS,
  WHATSAPP_TAX_STATUS_OPTIONS,
} from '@/lib/whatsappUploadTypes';

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
  quantityUnit: 'kg',
  price: '',
  priceUnit: 'price on request',
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

function FieldLabel({ label, status }: { label: string; status: 'Required' | 'Optional' | 'Recommended' }) {
  return (
    <span className="fieldLabel">
      {label}
      <span className={`fieldBadge ${status.toLowerCase()}`}>{status}</span>
    </span>
  );
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

  function mergeListing(patch: Record<string, any>) {
    setListingForm((form) => ({ ...form, ...patch }));
  }

  async function submit() {
    setSaving(true);
    setMessage('Creating client account and listing...');
    setResult(null);
    const res = await fetch('/api/admin/whatsapp-uploads/manual-listing', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ account, listing }),
    }).then((response) => response.json()).catch(() => ({ ok: false, message: 'Unable to create account and listing.' }));
    setSaving(false);
    if (!res.ok) {
      setMessage(res.message || res.error || 'Unable to create account and listing.');
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
            <p className="notice slimNotice">Only primary details are required. Talmech can complete the remaining information after verification.</p>
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
                <Field label="Recipient" value={result.email?.tracking?.emailRecipient || result.account?.email} />
                <Field label="Last attempt" value={result.email?.tracking?.lastAttemptAt} />
                {result.email?.tracking?.clientFollowUpRequired && <span className="pill gold">Client follow-up required</span>}
                <p className="muted">{result.email?.status === 'sent' ? 'Login email was sent by the configured provider.' : 'Email provider is missing or failed. Copy the one-time instructions below.'}</p>
              </div>
            </div>
            {Array.isArray(result.missingInformation) && result.missingInformation.length > 0 && (
              <div className="manualMissingInfo">
                <span className="pill gold">Missing information</span>
                <h3>Client follow-up requested</h3>
                <div className="strategyWarningList">
                  {result.missingInformation.map((item: any) => <span key={item.key || item.label || item.message}>{item.label || item.message}</span>)}
                </div>
              </div>
            )}
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
            <h2>Primary client details</h2>
            <p className="muted">If email or mobile already exists, this flow links the listing to the existing account instead of creating a duplicate.</p>
            <div className="formGrid">
              <label><FieldLabel label="Account type" status="Required" /><select value={account.accountType} onChange={(event) => setAccount('accountType', event.target.value)}>{accountTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><FieldLabel label="Full name" status="Recommended" /><input className="input" value={account.fullName} onChange={(event) => setAccount('fullName', event.target.value)} placeholder="Required if firm name is blank" /></label>
              <label><FieldLabel label="Firm name" status="Recommended" /><input className="input" value={account.firmName} onChange={(event) => setAccount('firmName', event.target.value)} placeholder="Required if full name is blank" /></label>
              <label><FieldLabel label="Email" status="Recommended" /><input className="input" type="email" value={account.email} onChange={(event) => setAccount('email', event.target.value)} placeholder="Required if mobile is blank" /></label>
              <label><FieldLabel label="Mobile" status="Recommended" /><input className="input" value={account.mobile} onChange={(event) => setAccount('mobile', event.target.value)} placeholder="Required if email is blank" /></label>
              <label><FieldLabel label="City" status="Recommended" /><input className="input" value={account.city} onChange={(event) => setAccount('city', event.target.value)} /></label>
              <label><FieldLabel label="State" status="Recommended" /><input className="input" value={account.state} onChange={(event) => setAccount('state', event.target.value)} /></label>
              <label><FieldLabel label="GST number" status="Optional" /><input className="input" value={account.gstNumber} onChange={(event) => setAccount('gstNumber', event.target.value.toUpperCase())} /></label>
              <label><FieldLabel label="Alternate mobile" status="Optional" /><input className="input" value={account.alternateMobile} onChange={(event) => setAccount('alternateMobile', event.target.value)} /></label>
              <label className="span2"><FieldLabel label="Address" status="Optional" /><textarea value={account.address} onChange={(event) => setAccount('address', event.target.value)} /></label>
            </div>
            <div className="manualPasswordStrategy">
              <b>Password strategy</b>
              <p>New manual accounts receive a generated temporary password, email/mobile OTP is bypassed only for this admin-created account, and the client must change the password after first login.</p>
            </div>
          </section>

          <section className="panel manualListingPanel">
            <span className="pill">Section 2</span>
            <h2>Primary listing details</h2>
            <p className="muted">Admin-created listings are linked to the client workspace and appear in the admin listings console.</p>
            <div className="formGrid">
              <label><FieldLabel label="Listing type" status="Required" /><select value={listing.listingType} onChange={(event) => setListing('listingType', event.target.value)}>{listingTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><FieldLabel label="Quantity" status="Required" /><input className="input" value={listing.quantity} onChange={(event) => setListing('quantity', event.target.value)} placeholder="Example: 5000" /></label>
              <label><FieldLabel label="Quantity unit" status="Required" /><select value={listing.quantityUnit} onChange={(event) => setListing('quantityUnit', event.target.value)}>{WHATSAPP_QUANTITY_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
              <div className="span2">
                <MetalProductSelector value={listing} onChange={mergeListing} requiredLevel="metal-product" mode="admin" />
              </div>
              <label><FieldLabel label="Listing city" status="Recommended" /><input className="input" value={listing.city} onChange={(event) => setListing('city', event.target.value)} placeholder={account.city || 'Auto-fills from client city if blank'} /></label>
              <label><FieldLabel label="Listing state" status="Recommended" /><input className="input" value={listing.state} onChange={(event) => setListing('state', event.target.value)} placeholder={account.state || 'Auto-fills from client state if blank'} /></label>
              <label className="span2"><FieldLabel label="Stock note / remarks" status="Optional" /><textarea value={listing.remarks} onChange={(event) => setListing('remarks', event.target.value)} placeholder="Use this if quantity is not confirmed yet." /></label>
            </div>

            <div className="manualSubsection">
              <h3>Optional commercial details</h3>
              <div className="formGrid">
                <label><FieldLabel label="Size / specification" status="Optional" /><input className="input" value={listing.sizeOrSpecification} onChange={(event) => setListing('sizeOrSpecification', event.target.value)} /></label>
                <label><FieldLabel label="Price / target price" status="Optional" /><input className="input" value={listing.price} onChange={(event) => setListing('price', event.target.value)} placeholder="Leave blank for price on request" /></label>
                <label><FieldLabel label="Price unit" status="Optional" /><select value={listing.priceUnit} onChange={(event) => setListing('priceUnit', event.target.value)}>{WHATSAPP_PRICE_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
                <label><FieldLabel label="Tax / GST status" status="Optional" /><select value={listing.taxStatus} onChange={(event) => setListing('taxStatus', event.target.value)}>{WHATSAPP_TAX_STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
                <label><FieldLabel label="Stock status" status="Optional" /><select value={listing.stockStatus} onChange={(event) => setListing('stockStatus', event.target.value)}>{WHATSAPP_STOCK_STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
                <label><FieldLabel label="Delivery timeline" status="Optional" /><input className="input" value={listing.deliveryTimeline} onChange={(event) => setListing('deliveryTimeline', event.target.value)} /></label>
                <label><FieldLabel label="Certificate available" status="Optional" /><select value={listing.certificateAvailable} onChange={(event) => setListing('certificateAvailable', event.target.value)}><option value="">Optional</option>{WHATSAPP_CERTIFICATE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
                <label><FieldLabel label="Certificate required" status="Optional" /><select value={listing.certificateRequired} onChange={(event) => setListing('certificateRequired', event.target.value)}><option value="">Optional</option>{WHATSAPP_CERTIFICATE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
                <label className="span2"><FieldLabel label="Dispatch location" status="Optional" /><textarea value={listing.dispatchLocation} onChange={(event) => setListing('dispatchLocation', event.target.value)} placeholder="Auto-generates from city/state if blank" /></label>
                <label className="span2"><FieldLabel label="Delivery location" status="Optional" /><textarea value={listing.deliveryLocation} onChange={(event) => setListing('deliveryLocation', event.target.value)} placeholder="Auto-generates from city/state if blank" /></label>
              </div>
            </div>

            <div className="manualSubsection">
              <h3>Optional photos / documents</h3>
              <ListingImagePicker
                images={listing.productImages || []}
                onChange={(images) => setListing('productImages', images as any)}
                helpText="Optional. Image URLs work immediately. Production file uploads need Cloudinary, Vercel Blob, Supabase, or R2."
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
