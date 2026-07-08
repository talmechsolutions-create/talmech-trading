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
  WHATSAPP_STATUS_OPTIONS,
  WHATSAPP_STOCK_STATUS_OPTIONS,
  WHATSAPP_TAX_STATUS_OPTIONS,
  WhatsappAccountCreation,
  WhatsappUploadStatus,
  WhatsappUploadSubmission,
} from '@/lib/whatsappUploadTypes';

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="waDetailField">
      <span>{label}</span>
      <b>{String(value || '-')}</b>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function optionOrFallback(value: string, options: readonly string[], fallback = '') {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  return options.find((option) => option.toLowerCase() === normalized.toLowerCase()) || normalized;
}

const accountTypeOptions = [
  'Buyer',
  'Seller / Supplier',
  'Manufacturer',
  'Trader - buyer and seller access',
  'Scrap dealer',
];

type AccountForm = {
  role: string;
  accountType: string;
  fullName: string;
  firmName: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  gstNumber: string;
  city: string;
  state: string;
  address: string;
  productInterest: string;
  selectedMetal: string;
  selectedProduct: string;
  selectedGrade: string;
  selectedProductForm: string;
  adminNote: string;
};

type ListingForm = {
  accountId: string;
  firmName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  role: string;
  submissionType: string;
  listingType: string;
  metal: string;
  product: string;
  grade: string;
  productForm: string;
  sizeOrSpecification: string;
  quantity: string;
  quantityUnit: string;
  price: string;
  priceUnit: string;
  targetPrice: string;
  taxStatus: string;
  stockStatus: string;
  minimumOrderQuantity: string;
  certificateAvailable: string;
  certificateRequired: string;
  photosAvailable: string;
  dispatchLocation: string;
  deliveryLocation: string;
  city: string;
  state: string;
  deliveryTimeline: string;
  applicationOrUse: string;
  remarks: string;
  listingVisibility: string;
  productImages: ListingImage[];
};

function accountTypeForRole(role: string) {
  const lower = role.toLowerCase();
  if (lower.includes('trader')) return 'Trader - buyer and seller access';
  if (lower.includes('supplier')) return 'Seller / Supplier';
  if (lower.includes('manufacturer')) return 'Manufacturer';
  if (lower.includes('seller')) return 'Seller / Supplier';
  return 'Buyer';
}

function initialAccountForm(submission: WhatsappUploadSubmission): AccountForm {
  return {
    role: submission.role || 'Buyer',
    accountType: accountTypeForRole(submission.role || 'Buyer'),
    fullName: submission.fullName || '',
    firmName: submission.firmName || '',
    mobile: submission.mobile || '',
    alternateMobile: submission.alternateMobile || '',
    email: submission.email || '',
    gstNumber: submission.gstNumber || '',
    city: submission.city || '',
    state: submission.state || '',
    address: submission.dispatchLocation || submission.deliveryLocation || '',
    productInterest: [
      submission.finalMetalLabel || submission.selectedMetal || submission.customMetal,
      submission.finalProductLabel || submission.selectedProduct || submission.customProduct,
      submission.finalGradeLabel || submission.selectedGrade || submission.customGrade,
      submission.finalProductFormLabel || submission.selectedProductForm || submission.customProductForm,
      [submission.quantity, submission.quantityUnit].filter(Boolean).join(' '),
    ].filter(Boolean).join(' / '),
    selectedMetal: submission.finalMetalLabel || submission.selectedMetal || submission.customMetal || '',
    selectedProduct: submission.finalProductLabel || submission.selectedProduct || submission.customProduct || '',
    selectedGrade: submission.finalGradeLabel || submission.selectedGrade || submission.customGrade || '',
    selectedProductForm: submission.finalProductFormLabel || submission.selectedProductForm || submission.customProductForm || '',
    adminNote: '',
  };
}

function initialListingForm(submission: WhatsappUploadSubmission): ListingForm {
  return {
    accountId: submission.accountCreation?.accountId || '',
    firmName: submission.firmName || '',
    contactPerson: submission.fullName || '',
    mobile: submission.mobile || '',
    email: submission.email || '',
    role: submission.role || '',
    submissionType: submission.submissionType || '',
    listingType: submission.role === 'Buyer' || submission.submissionType === 'Buy requirement / RFQ' ? 'Buy requirement' : 'Sell listing',
    metal: submission.finalMetalLabel || submission.selectedMetal || submission.customMetal || '',
    product: submission.finalProductLabel || submission.selectedProduct || submission.customProduct || '',
    grade: submission.finalGradeLabel || submission.selectedGrade || submission.customGrade || '',
    productForm: submission.finalProductFormLabel || submission.selectedProductForm || submission.customProductForm || '',
    sizeOrSpecification: submission.sizeOrSpecification || '',
    quantity: submission.quantity || '',
    quantityUnit: optionOrFallback(submission.quantityUnit || '', WHATSAPP_QUANTITY_UNITS, 'kg'),
    price: submission.price || '',
    priceUnit: optionOrFallback(submission.priceUnit || '', WHATSAPP_PRICE_UNITS, 'price on request'),
    targetPrice: submission.targetPrice || '',
    taxStatus: optionOrFallback(submission.taxStatus || '', WHATSAPP_TAX_STATUS_OPTIONS, 'not sure'),
    stockStatus: optionOrFallback(submission.stockStatus || '', WHATSAPP_STOCK_STATUS_OPTIONS, 'Ready stock'),
    minimumOrderQuantity: submission.minimumOrderQuantity || '',
    certificateAvailable: submission.certificateAvailable || '',
    certificateRequired: submission.certificateRequired || '',
    photosAvailable: submission.photosAvailable || '',
    dispatchLocation: submission.dispatchLocation || '',
    deliveryLocation: submission.deliveryLocation || '',
    city: submission.city || '',
    state: submission.state || '',
    deliveryTimeline: submission.deliveryTimeline || '',
    applicationOrUse: submission.applicationOrUse || '',
    remarks: submission.remarks || '',
    listingVisibility: 'public',
    productImages: [],
  };
}

function accountPillClass(account?: WhatsappAccountCreation) {
  if (!account?.accountId) return 'pill';
  if (account.status === 'Needs Follow-up') return 'pill gold';
  return 'pill green';
}

export default function WhatsappUploadDetailAdmin({ submission }: { submission: WhatsappUploadSubmission }) {
  const [status, setStatus] = useState<WhatsappUploadStatus>(submission.status);
  const [internalAdminNotes, setInternalAdminNotes] = useState(submission.internalAdminNotes || '');
  const [note, setNote] = useState('');
  const [current, setCurrent] = useState(submission);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountForm>(() => initialAccountForm(submission));
  const [accountSaving, setAccountSaving] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [manualActivationUrl, setManualActivationUrl] = useState('');
  const [listingForm, setListingForm] = useState<ListingForm>(() => initialListingForm(submission));
  const [listingSaving, setListingSaving] = useState(false);
  const [allowAnotherListing, setAllowAnotherListing] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/whatsapp-uploads/${encodeURIComponent(submission.submissionId)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, internalAdminNotes, note }),
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to update submission.' }));
    setSaving(false);
    if (res.ok) {
      setCurrent(res.submission);
      setNote('');
      setMessage('Submission updated.');
    } else {
      setMessage(res.error || 'Unable to update submission.');
    }
  }

  function setAccountField(key: keyof AccountForm, value: string) {
    setAccountForm((form) => {
      const next = { ...form, [key]: value };
      if (key === 'role') next.accountType = accountTypeForRole(value);
      return next;
    });
  }

  function setListingField(key: keyof ListingForm, value: any) {
    setListingForm((form) => ({ ...form, [key]: value }));
  }

  function mergeListingProduct(patch: Record<string, any>) {
    setListingForm((form) => ({ ...form, ...patch }));
  }

  async function createAccount() {
    if (current.accountCreation?.accountId) {
      setMessage('An account is already linked to this WhatsApp submission.');
      return;
    }
    if (!window.confirm('Create an admin-assisted client account from this WhatsApp submission?')) return;

    setAccountSaving(true);
    setManualActivationUrl('');
    const res = await fetch(`/api/admin/whatsapp-uploads/${encodeURIComponent(current.submissionId)}/create-account`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(accountForm),
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to create account.' }));
    setAccountSaving(false);

    if (!res.ok) {
      setMessage(res.error || 'Unable to create account.');
      return;
    }

    if (res.submission) {
      setCurrent(res.submission);
      setStatus(res.submission.status);
      setInternalAdminNotes(res.submission.internalAdminNotes || '');
      setListingForm((form) => ({ ...form, accountId: res.submission.accountCreation?.accountId || form.accountId }));
    }
    setManualActivationUrl(res.manualActivationUrl || '');
    setMessage(res.manualActivationUrl
      ? 'Account created. Email was queued or not sent; copy the one-time activation link before leaving this page.'
      : 'Account created and activation email sent or queued.');
  }

  async function resendEmail() {
    setEmailSending(true);
    setManualActivationUrl('');
    const res = await fetch(`/api/admin/whatsapp-uploads/${encodeURIComponent(current.submissionId)}/resend-account-email`, {
      method: 'POST',
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to resend account email.' }));
    setEmailSending(false);

    if (!res.ok) {
      setMessage(res.error || 'Unable to resend account email.');
      return;
    }

    if (res.submission) setCurrent(res.submission);
    setManualActivationUrl(res.manualActivationUrl || '');
    setMessage(res.manualActivationUrl
      ? 'Account email queued. Copy the fresh activation link before leaving this page.'
      : 'Account email resent or queued.');
  }

  async function copyActivationLink() {
    if (!manualActivationUrl) return;
    await navigator.clipboard.writeText(manualActivationUrl);
    setMessage('Activation link copied.');
  }

  async function copyLoginInstructions() {
    const account = current.accountCreation;
    const loginUrl = `${window.location.origin}/signin`;
    const instructions = [
      `Hello ${accountForm.fullName || current.fullName || ''},`,
      '',
      'Your Talmech Trading account has been created from the details shared through WhatsApp.',
      `Account type: ${account?.accountType || accountForm.accountType}`,
      `Firm name: ${accountForm.firmName || current.firmName}`,
      `Registered mobile: ${accountForm.mobile || current.mobile}`,
      `Registered email: ${accountForm.email || current.email}`,
      manualActivationUrl ? `Activation link: ${manualActivationUrl}` : 'Activation link: sent/queued by email. Ask Talmech admin if you need a fresh link.',
      `Login URL: ${loginUrl}`,
      '',
      'For security, please set your password through the activation link and review your business details after first login.',
      'If you did not request this account, contact Talmech support immediately.',
    ].join('\n');
    await navigator.clipboard.writeText(instructions);
    setMessage('Login instructions copied.');
  }

  async function createListing() {
    if (current.listingCreation?.listingIds?.length && !allowAnotherListing) {
      setMessage('A listing is already linked. Click Create another listing first if this submission needs another listing.');
      return;
    }
    if (!window.confirm('Create a marketplace listing or requirement from this WhatsApp submission?')) return;

    setListingSaving(true);
    const res = await fetch(`/api/admin/whatsapp-uploads/${encodeURIComponent(current.submissionId)}/create-listing`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...listingForm,
        accountId: listingForm.accountId || current.accountCreation?.accountId || '',
        allowAnother: allowAnotherListing,
      }),
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to create listing.' }));
    setListingSaving(false);

    if (!res.ok) {
      setMessage(res.error || 'Unable to create listing.');
      return;
    }

    if (res.submission) {
      setCurrent(res.submission);
      setStatus(res.submission.status);
    }
    setAllowAnotherListing(false);
    setMessage(`Listing ${res.listing?.id || ''} created from WhatsApp submission.`);
  }

  return (
    <main className="adminShell section">
      <div className="container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">WhatsApp upload detail</span>
            <h1 className="pageTitle">{current.submissionId}</h1>
            <p className="muted">Protected full submission details. Public users never see this review page.</p>
          </div>
          <Link className="btn secondary" href="/admin/whatsapp-uploads">Back to queue</Link>
        </div>

        {message && <p className="notice">{message}</p>}

        <section className="waDetailGrid">
          <article className="waDetailPanel">
            <h2>User details</h2>
            <Field label="Contact person" value={current.fullName} />
            <Field label="Mobile" value={current.mobile} />
            <Field label="Alternate mobile" value={current.alternateMobile} />
            <Field label="Email" value={current.email} />
            <Field label="Role" value={current.role} />
            <Field label="Language" value={current.language} />
          </article>

          <article className="waDetailPanel">
            <h2>Business details</h2>
            <Field label="Firm name" value={current.firmName} />
            <Field label="GST number" value={current.gstNumber} />
            <Field label="Submission type" value={current.submissionType} />
            <Field label="Status" value={current.status} />
            <Field label="Created" value={formatDate(current.createdAt)} />
            <Field label="Updated" value={formatDate(current.updatedAt)} />
          </article>

          <article className="waDetailPanel">
            <h2>Product or requirement details</h2>
            <Field label="Metal / Material" value={current.finalMetalLabel || current.selectedMetal || current.customMetal} />
            <Field label="Selected metal" value={current.selectedMetal} />
            <Field label="Custom metal" value={current.customMetal} />
            <Field label="Product" value={current.finalProductLabel || current.selectedProduct || current.customProduct} />
            <Field label="Selected product" value={current.selectedProduct} />
            <Field label="Custom product" value={current.customProduct} />
            <Field label="Grade" value={current.finalGradeLabel || current.selectedGrade || current.customGrade} />
            <Field label="Selected grade" value={current.selectedGrade} />
            <Field label="Custom grade" value={current.customGrade} />
            <Field label="Product form" value={current.finalProductFormLabel || current.selectedProductForm || current.customProductForm} />
            <Field label="Selected product form" value={current.selectedProductForm} />
            <Field label="Custom product form" value={current.customProductForm} />
            <Field label="Size / Specification" value={current.sizeOrSpecification} />
          </article>

          <article className="waDetailPanel">
            <h2>Quantity and price details</h2>
            <Field label="Quantity" value={[current.quantity, current.quantityUnit].filter(Boolean).join(' ')} />
            <Field label="Price" value={current.price} />
            <Field label="Price unit" value={current.priceUnit} />
            <Field label="Target price" value={current.targetPrice} />
            <Field label="Tax status" value={current.taxStatus} />
            <Field label="Stock status" value={current.stockStatus} />
            <Field label="Minimum order quantity" value={current.minimumOrderQuantity} />
          </article>

          <article className="waDetailPanel">
            <h2>Quality / certificate details</h2>
            <Field label="Certificate available" value={current.certificateAvailable} />
            <Field label="Certificate required" value={current.certificateRequired} />
            <Field label="Photos available" value={current.photosAvailable} />
            <Field label="Application / Use" value={current.applicationOrUse} />
          </article>

          <article className="waDetailPanel">
            <h2>Location and delivery details</h2>
            <Field label="City" value={current.city} />
            <Field label="State" value={current.state} />
            <Field label="Dispatch location" value={current.dispatchLocation} />
            <Field label="Delivery location" value={current.deliveryLocation} />
            <Field label="Delivery timeline" value={current.deliveryTimeline} />
          </article>
        </section>

        <section className="waDetailPanel wide">
          <h2>Remarks</h2>
          <p>{current.remarks || '-'}</p>
        </section>

        <section className="waDetailPanel wide">
          <h2>Admin notes and status</h2>
          <div className="waAdminEditGrid">
            <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as WhatsappUploadStatus)}>{WHATSAPP_STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Status note<input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional timeline note" /></label>
            <label className="span2">internalAdminNotes<textarea value={internalAdminNotes} onChange={(event) => setInternalAdminNotes(event.target.value)} placeholder="Private operator note, call summary, missing details, conversion plan" /></label>
          </div>
          <button className="btn" type="button" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save admin review'}</button>
        </section>

        <section className="waDetailPanel wide waAccountCreationPanel">
          <div className="waAccountPanelIntro">
            <div>
              <span className={accountPillClass(current.accountCreation)}>{current.accountCreation?.status || 'Not Created'}</span>
              <h2>Create Client Account from WhatsApp Submission</h2>
              <p className="muted">Admin-created accounts use activation links. Email and mobile OTP stay disabled only for this admin-assisted setup record.</p>
            </div>
            {current.accountCreation?.accountId && <Link className="btn secondary" href="/admin-users">Open user admin</Link>}
          </div>

          {current.accountCreation?.accountId ? (
            <div className="waAccountStatusPanel">
              <div className="waAccountStatusGrid">
                <Field label="Linked account ID" value={current.accountCreation.accountId} />
                <Field label="Account type" value={current.accountCreation.accountType} />
                <Field label="Verification status" value={current.accountCreation.verificationStatus} />
                <Field label="Activation status" value={current.accountCreation.activationStatus} />
                <Field label="Credentials sent" value={formatDate(current.accountCreation.credentialsSentAt || '')} />
                <Field label="Email status" value={[current.accountCreation.emailStatus, current.accountCreation.emailProvider].filter(Boolean).join(' / ')} />
              </div>
              {manualActivationUrl && (
                <div className="waSensitiveBox">
                  <b>Manual activation link</b>
                  <p className="muted">Shown only after this protected create/resend action because email delivery is queued or not configured.</p>
                  <input className="input waMonoInput" value={manualActivationUrl} readOnly />
                  <button className="btn secondary" type="button" onClick={copyActivationLink}>Copy activation link</button>
                </div>
              )}
              <div className="waActionRow">
                <button className="btn" type="button" disabled={emailSending} onClick={resendEmail}>{emailSending ? 'Sending...' : 'Resend account email'}</button>
                <button className="btn secondary" type="button" onClick={copyLoginInstructions}>Copy login instructions</button>
                <Link className="btn secondary" href="/signin">Open login URL</Link>
              </div>
            </div>
          ) : (
            <div className="waAdminAccountGrid">
              <label>Role<select value={accountForm.role} onChange={(event) => setAccountField('role', event.target.value)}>
                <option>Buyer</option>
                <option>Seller</option>
                <option>Trader</option>
                <option>Supplier</option>
                <option>Manufacturer</option>
              </select></label>
              <label>Account type<select value={accountForm.accountType} onChange={(event) => setAccountField('accountType', event.target.value)}>{accountTypeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Full name<input className="input" value={accountForm.fullName} onChange={(event) => setAccountField('fullName', event.target.value)} /></label>
              <label>Firm name<input className="input" value={accountForm.firmName} onChange={(event) => setAccountField('firmName', event.target.value)} /></label>
              <label>Mobile<input className="input" value={accountForm.mobile} onChange={(event) => setAccountField('mobile', event.target.value)} /></label>
              <label>Alternate mobile<input className="input" value={accountForm.alternateMobile} onChange={(event) => setAccountField('alternateMobile', event.target.value)} /></label>
              <label>Email<input className="input" value={accountForm.email} onChange={(event) => setAccountField('email', event.target.value)} /></label>
              <label>GST number<input className="input" value={accountForm.gstNumber} onChange={(event) => setAccountField('gstNumber', event.target.value.toUpperCase())} /></label>
              <label>City<input className="input" value={accountForm.city} onChange={(event) => setAccountField('city', event.target.value)} /></label>
              <label>State<input className="input" value={accountForm.state} onChange={(event) => setAccountField('state', event.target.value)} /></label>
              <label className="span2">Address / dispatch or delivery location<textarea value={accountForm.address} onChange={(event) => setAccountField('address', event.target.value)} /></label>
              <label className="span2">Product / requirement interest<textarea value={accountForm.productInterest} onChange={(event) => setAccountField('productInterest', event.target.value)} /></label>
              <label>Selected metal<input className="input" value={accountForm.selectedMetal} onChange={(event) => setAccountField('selectedMetal', event.target.value)} /></label>
              <label>Selected product<input className="input" value={accountForm.selectedProduct} onChange={(event) => setAccountField('selectedProduct', event.target.value)} /></label>
              <label>Selected grade<input className="input" value={accountForm.selectedGrade} onChange={(event) => setAccountField('selectedGrade', event.target.value)} /></label>
              <label>Selected product form<input className="input" value={accountForm.selectedProductForm} onChange={(event) => setAccountField('selectedProductForm', event.target.value)} /></label>
              <label className="span2">Internal account note<textarea value={accountForm.adminNote} onChange={(event) => setAccountField('adminNote', event.target.value)} placeholder="Private note about review, call, missing details, or profile confirmation" /></label>
              <div className="span2 waAccountConfirmBox">
                <p><b>Security:</b> No permanent password will be emailed. The user receives an activation link and sets a password without OTP for this admin-created setup only.</p>
                <button className="btn" type="button" disabled={accountSaving} onClick={createAccount}>{accountSaving ? 'Creating account...' : 'Create Account'}</button>
              </div>
            </div>
          )}
        </section>

        <section className="waDetailPanel wide waListingCreationPanel">
          <div className="waAccountPanelIntro">
            <div>
              <span className={current.listingCreation?.status === 'Listing Created' ? 'pill green' : 'pill'}>{current.listingCreation?.status || 'Not Created'}</span>
              <h2>Create Listing / Requirement from WhatsApp Submission</h2>
              <p className="muted">Create a public, draft, or admin-created listing from the reviewed WhatsApp details. This does not auto-publish duplicate listings.</p>
            </div>
            {current.listingCreation?.lastListingId && <Link className="btn secondary" href={`/admin/listings/${current.listingCreation.lastListingId}`}>Open Admin Listing</Link>}
          </div>

          {current.listingCreation?.listingIds?.length ? (
            <div className="waAccountStatusPanel">
              <div className="waAccountStatusGrid">
                <Field label="Latest listing ID" value={current.listingCreation.lastListingId} />
                <Field label="Linked account ID" value={current.listingCreation.accountId || current.accountCreation?.accountId} />
                <Field label="Listing type" value={current.listingCreation.lastListingType} />
                <Field label="Created listings" value={current.listingCreation.listingIds.join(', ')} />
              </div>
              <div className="waActionRow">
                <Link className="btn" href={`/admin/listings/${current.listingCreation.lastListingId}`}>Open Admin Listing</Link>
                <Link className="btn secondary" href="/public-marketplace">Open Marketplace</Link>
                <button className="btn secondary" type="button" onClick={() => setAllowAnotherListing(true)}>Create another listing</button>
              </div>
            </div>
          ) : null}

          {(!current.listingCreation?.listingIds?.length || allowAnotherListing) && (
            <div className="waAdminAccountGrid">
              <label>Linked account ID<input className="input" value={listingForm.accountId || current.accountCreation?.accountId || ''} onChange={(event) => setListingField('accountId', event.target.value)} placeholder="Optional but recommended" /></label>
              <label>Listing type<select value={listingForm.listingType} onChange={(event) => setListingField('listingType', event.target.value)}>
                <option>Sell listing</option>
                <option>Buy requirement</option>
                <option>Scrap listing</option>
                <option>Trader deal listing</option>
              </select></label>
              <label>Firm name<input className="input" value={listingForm.firmName} onChange={(event) => setListingField('firmName', event.target.value)} /></label>
              <label>Contact person<input className="input" value={listingForm.contactPerson} onChange={(event) => setListingField('contactPerson', event.target.value)} /></label>
              <label>Mobile<input className="input" value={listingForm.mobile} onChange={(event) => setListingField('mobile', event.target.value)} /></label>
              <label>Email<input className="input" value={listingForm.email} onChange={(event) => setListingField('email', event.target.value)} /></label>
              <label>Role<input className="input" value={listingForm.role} onChange={(event) => setListingField('role', event.target.value)} /></label>
              <label>Submission type<input className="input" value={listingForm.submissionType} onChange={(event) => setListingField('submissionType', event.target.value)} /></label>
              <div className="span2">
                <MetalProductSelector value={listingForm} onChange={mergeListingProduct} requiredLevel="metal-product" mode="admin" />
              </div>
              <label className="span2">Size / specification<input className="input" value={listingForm.sizeOrSpecification} onChange={(event) => setListingField('sizeOrSpecification', event.target.value)} /></label>
              <label>Quantity<input className="input" value={listingForm.quantity} onChange={(event) => setListingField('quantity', event.target.value)} /></label>
              <label>Quantity unit<select value={listingForm.quantityUnit} onChange={(event) => setListingField('quantityUnit', event.target.value)}>{WHATSAPP_QUANTITY_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
              <label>Price<input className="input" value={listingForm.price} onChange={(event) => setListingField('price', event.target.value)} /></label>
              <label>Price unit<select value={listingForm.priceUnit} onChange={(event) => setListingField('priceUnit', event.target.value)}>{WHATSAPP_PRICE_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
              <label>Target price<input className="input" value={listingForm.targetPrice} onChange={(event) => setListingField('targetPrice', event.target.value)} /></label>
              <label>Tax status<select value={listingForm.taxStatus} onChange={(event) => setListingField('taxStatus', event.target.value)}>{WHATSAPP_TAX_STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Stock status<select value={listingForm.stockStatus} onChange={(event) => setListingField('stockStatus', event.target.value)}>{WHATSAPP_STOCK_STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Minimum order quantity<input className="input" value={listingForm.minimumOrderQuantity} onChange={(event) => setListingField('minimumOrderQuantity', event.target.value)} /></label>
              <label>Certificate available<select value={listingForm.certificateAvailable} onChange={(event) => setListingField('certificateAvailable', event.target.value)}><option value="">Optional</option>{WHATSAPP_CERTIFICATE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Certificate required<select value={listingForm.certificateRequired} onChange={(event) => setListingField('certificateRequired', event.target.value)}><option value="">Optional</option>{WHATSAPP_CERTIFICATE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Photos available<input className="input" value={listingForm.photosAvailable} onChange={(event) => setListingField('photosAvailable', event.target.value)} /></label>
              <label>Visibility<select value={listingForm.listingVisibility} onChange={(event) => setListingField('listingVisibility', event.target.value)}>
                <option value="public">Public / admin-created</option>
                <option value="draft">Draft / private</option>
              </select></label>
              <label className="span2">Dispatch location<textarea value={listingForm.dispatchLocation} onChange={(event) => setListingField('dispatchLocation', event.target.value)} /></label>
              <label className="span2">Delivery location<textarea value={listingForm.deliveryLocation} onChange={(event) => setListingField('deliveryLocation', event.target.value)} /></label>
              <label>City<input className="input" value={listingForm.city} onChange={(event) => setListingField('city', event.target.value)} /></label>
              <label>State<input className="input" value={listingForm.state} onChange={(event) => setListingField('state', event.target.value)} /></label>
              <label>Delivery timeline<input className="input" value={listingForm.deliveryTimeline} onChange={(event) => setListingField('deliveryTimeline', event.target.value)} /></label>
              <label>Application / use<input className="input" value={listingForm.applicationOrUse} onChange={(event) => setListingField('applicationOrUse', event.target.value)} /></label>
              <label className="span2">Remarks<textarea value={listingForm.remarks} onChange={(event) => setListingField('remarks', event.target.value)} /></label>
              <ListingImagePicker
                images={listingForm.productImages || []}
                onChange={(images) => setListingField('productImages', images)}
                helpText="Optional. Add up to 3 product images from the WhatsApp conversation, hosted URL, or local-dev upload."
              />
              <div className="span2 waAccountConfirmBox">
                <p><b>Review:</b> Confirm product, price, GST, stock, documents, and dispatch location before creating the listing.</p>
                <button className="btn" type="button" disabled={listingSaving} onClick={createListing}>{listingSaving ? 'Creating listing...' : allowAnotherListing ? 'Create another listing' : 'Create Listing'}</button>
              </div>
            </div>
          )}
        </section>

        <section className="waDetailPanel wide">
          <h2>Status timeline</h2>
          <div className="waTimeline">
            {current.statusTimeline.map((item, index) => (
              <div key={`${item.at}-${index}`}>
                <b>{item.status}</b>
                <span>{formatDate(item.at)} / {item.by}</span>
                {item.note && <p>{item.note}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
