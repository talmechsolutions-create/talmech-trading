'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type FormProps = {
  endpoint: string;
  title: string;
  action?: string;
  fields: Array<{ name: string; label: string; type?: string; required?: boolean; placeholder?: string }>;
};

function toBody(form: HTMLFormElement, action?: string) {
  const body: Record<string, string> = {};
  for (const [key, value] of new FormData(form).entries()) body[key] = String(value);
  if (action) body.action = action;
  return body;
}

export function IndustrialQuickForm({ endpoint, title, action, fields }: FormProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(toBody(event.currentTarget, action)),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !payload.ok) {
      const duplicateHint = payload.status === 'DUPLICATE_REVIEW_REQUIRED' || payload.candidates?.length ? ' Duplicate candidates were returned; add a justification or use an existing record.' : '';
      setMessage(`${payload.message || 'Action needs review.'}${duplicateHint}`);
      return;
    }
    setMessage(payload.status === 'DUPLICATE_REVIEW_REQUIRED' ? 'Duplicate review required.' : 'Saved.');
    router.refresh();
  }

  return (
    <form className="panel industrialImportForm" onSubmit={submit}>
      <div className="industrialPanelHead"><h2>{title}</h2></div>
      {fields.map((field) => (
        <label key={field.name}>
          {field.label}
          <input className="input" name={field.name} type={field.type || 'text'} required={field.required} placeholder={field.placeholder} />
        </label>
      ))}
      <button className="btn secondary" type="submit" disabled={busy}>{busy ? 'Saving...' : title}</button>
      {message ? <p className="notice slimNotice">{message}</p> : null}
    </form>
  );
}

export function IndustrialDashboardActions() {
  return (
    <section className="industrialTwoColumn">
      <IndustrialQuickForm
        endpoint="/api/admin/industrial-intelligence/companies"
        title="Add Company"
        fields={[
          { name: 'companyName', label: 'Company name', required: true },
          { name: 'industryCategory', label: 'Industry', placeholder: 'FORGING / STEEL / OTHER' },
          { name: 'state', label: 'State' },
          { name: 'city', label: 'City / Cluster' },
          { name: 'officialWebsite', label: 'Official website' },
          { name: 'createAnywayJustification', label: 'Duplicate override justification' },
        ]}
      />
      <IndustrialQuickForm
        endpoint="/api/admin/industrial-intelligence/research-prospects"
        title="Add Research Prospect"
        fields={[
          { name: 'companyName', label: 'Company or prospect name', required: true },
          { name: 'sourceType', label: 'Research source', placeholder: 'Google Maps, IndiaMART, referral...' },
          { name: 'state', label: 'State' },
          { name: 'city', label: 'City / Cluster' },
          { name: 'notes', label: 'Notes / next action' },
        ]}
      />
    </section>
  );
}

export function IndustrialCompanyActions({ companyId }: { companyId: string }) {
  const endpoint = `/api/admin/industrial-intelligence/companies/${companyId}`;
  return (
    <section className="industrialTwoColumn">
      <IndustrialQuickForm endpoint={endpoint} title="Add Plant" action="addPlant" fields={[{ name: 'plantName', label: 'Plant / unit name', required: true }, { name: 'city', label: 'City' }, { name: 'state', label: 'State' }, { name: 'pincode', label: 'PIN' }, { name: 'address', label: 'Plant address' }, { name: 'createAnywayJustification', label: 'Duplicate override justification' }]} />
      <IndustrialQuickForm endpoint={endpoint} title="Add Contact" action="addContact" fields={[{ name: 'personName', label: 'Person' }, { name: 'designation', label: 'Designation' }, { name: 'department', label: 'Department' }, { name: 'phone', label: 'Phone' }, { name: 'whatsapp', label: 'WhatsApp' }, { name: 'email', label: 'Email' }, { name: 'source', label: 'Source' }, { name: 'createAnywayJustification', label: 'Duplicate override justification' }]} />
      <IndustrialQuickForm endpoint={endpoint} title="Add Capability" action="addCapability" fields={[{ name: 'capabilityType', label: 'Capability / process', required: true }, { name: 'product', label: 'Product' }, { name: 'material', label: 'Material' }, { name: 'capacityText', label: 'Capacity / scale' }]} />
      <IndustrialQuickForm endpoint={endpoint} title="Add Service Opportunity" action="addServiceOpportunity" fields={[{ name: 'serviceType', label: 'Service type', required: true }, { name: 'score', label: 'Score', type: 'number' }, { name: 'priority', label: 'Priority' }, { name: 'evidence', label: 'Evidence' }]} />
      <IndustrialQuickForm endpoint={endpoint} title="Add Source / Evidence" action="addSource" fields={[{ name: 'sourceType', label: 'Source type', required: true }, { name: 'sourceUrl', label: 'Source URL' }, { name: 'sourceTitle', label: 'Source title' }, { name: 'verificationLevel', label: 'Verification level' }, { name: 'notes', label: 'Notes' }]} />
    </section>
  );
}
