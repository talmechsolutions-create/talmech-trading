'use client';

import Link from 'next/link';
import { useState } from 'react';
import { WHATSAPP_STATUS_OPTIONS, WhatsappUploadStatus, WhatsappUploadSubmission } from '@/lib/whatsappUploadTypes';

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

export default function WhatsappUploadDetailAdmin({ submission }: { submission: WhatsappUploadSubmission }) {
  const [status, setStatus] = useState<WhatsappUploadStatus>(submission.status);
  const [internalAdminNotes, setInternalAdminNotes] = useState(submission.internalAdminNotes || '');
  const [note, setNote] = useState('');
  const [current, setCurrent] = useState(submission);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

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

  function placeholder(label: string) {
    setMessage(`${label}: Conversion is admin-assisted and will be implemented in the next phase.`);
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

        <section className="waDetailPanel wide">
          <h2>Conversion placeholders</h2>
          <p className="muted">Conversion is admin-assisted and will be implemented in the next phase.</p>
          <div className="waActionRow">
            <button className="btn secondary" type="button" onClick={() => placeholder('Create Seller Listing Placeholder')}>Create Seller Listing Placeholder</button>
            <button className="btn secondary" type="button" onClick={() => placeholder('Create Buyer Requirement Placeholder')}>Create Buyer Requirement Placeholder</button>
            <button className="btn secondary" type="button" onClick={() => placeholder('Link to Existing User Placeholder')}>Link to Existing User Placeholder</button>
          </div>
        </section>
      </div>
    </main>
  );
}
