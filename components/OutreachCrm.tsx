'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  defaultTemplateForBusinessType,
  followUpStrategy,
  renderOutreachEmail,
  renderWhatsAppMessage,
  suggestedPageLinks,
  whatsappClickToChat,
} from '@/lib/outreachTemplates';

type Prospect = Record<string, any>;
type Option = { value: string; label: string };
type Template = { id: string; label: string; subject: string; purpose: string };

type Props = {
  initialProspects: Prospect[];
  businessTypes: readonly Option[];
  consentStatuses: readonly string[];
  industryTags: readonly string[];
  sources: readonly string[];
  statuses: readonly string[];
  templates: readonly Template[];
  storageMode: string;
};

const emptyForm = {
  companyName: '',
  contactPerson: '',
  designation: '',
  email: '',
  mobile: '',
  whatsappNumber: '',
  city: '',
  state: '',
  country: 'India',
  website: '',
  businessType: 'buyer',
  industryTags: 'steel',
  source: 'manual entry',
  consentStatus: 'business-public-contact',
  notes: '',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function describeError(result: any) {
  if (Array.isArray(result?.issues) && result.issues.length) {
    return result.issues.map((issue: any) => issue.message || issue.field).join(' ');
  }
  return result?.message || result?.error || 'Action failed.';
}

function statusClass(status: string) {
  if (['email-sent', 'replied', 'converted'].includes(status)) return 'pill green';
  if (['follow-up-needed', 'whatsapp-prepared', 'draft'].includes(status)) return 'pill gold';
  if (['do-not-contact', 'not-interested'].includes(status)) return 'pill darkPill';
  return 'pill';
}

export default function OutreachCrm({
  initialProspects,
  businessTypes,
  consentStatuses,
  industryTags,
  sources,
  statuses,
  templates,
  storageMode,
}: Props) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects || []);
  const [selectedId, setSelectedId] = useState(initialProspects?.[0]?.prospectId || '');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaults, setBulkDefaults] = useState({ businessType: 'buyer', source: 'manual entry', consentStatus: 'business-public-contact' });
  const [filters, setFilters] = useState({ query: '', businessType: '', outreachStatus: '', city: '', state: '' });
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const selected = useMemo(
    () => prospects.find((prospect) => prospect.prospectId === selectedId) || prospects[0] || null,
    [prospects, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    setSelectedTemplate(selected.assignedTemplate || defaultTemplateForBusinessType(selected.businessType));
    setNotesDraft(selected.notes || '');
    setNextFollowUp(toDateInput(selected.nextFollowUpAt));
  }, [selected?.prospectId]);

  useEffect(() => {
    if (!selectedId && prospects[0]) setSelectedId(prospects[0].prospectId);
  }, [prospects, selectedId]);

  const summary = useMemo(() => {
    const counts = {
      total: prospects.length,
      ready: 0,
      emailSent: 0,
      whatsappPrepared: 0,
      followUp: 0,
      replied: 0,
      doNotContact: 0,
    };
    prospects.forEach((prospect) => {
      if (prospect.outreachStatus === 'ready') counts.ready += 1;
      if (prospect.outreachStatus === 'email-sent') counts.emailSent += 1;
      if (prospect.outreachStatus === 'whatsapp-prepared') counts.whatsappPrepared += 1;
      if (prospect.outreachStatus === 'follow-up-needed') counts.followUp += 1;
      if (prospect.outreachStatus === 'replied') counts.replied += 1;
      if (prospect.outreachStatus === 'do-not-contact' || ['do-not-contact', 'unsubscribed'].includes(prospect.consentStatus)) counts.doNotContact += 1;
    });
    return counts;
  }, [prospects]);

  const filtered = useMemo(() => prospects.filter((prospect) => {
    const query = filters.query.toLowerCase();
    if (query && !JSON.stringify(prospect).toLowerCase().includes(query)) return false;
    if (filters.businessType && prospect.businessType !== filters.businessType) return false;
    if (filters.outreachStatus && prospect.outreachStatus !== filters.outreachStatus) return false;
    if (filters.city && !String(prospect.city || '').toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.state && !String(prospect.state || '').toLowerCase().includes(filters.state.toLowerCase())) return false;
    return true;
  }), [prospects, filters]);

  const preview = useMemo(() => {
    if (!selected) return null;
    const prospect: Prospect = { ...(selected as Prospect), assignedTemplate: selectedTemplate || selected.assignedTemplate };
    const email = renderOutreachEmail(prospect, selectedTemplate);
    const whatsappMessage = renderWhatsAppMessage(prospect, selectedTemplate);
    const whatsappUrl = whatsappClickToChat(prospect.whatsappNumber || prospect.mobile, whatsappMessage);
    return {
      email,
      whatsappMessage,
      whatsappUrl,
      links: suggestedPageLinks(prospect.businessType),
      followUp: followUpStrategy(prospect.businessType),
    };
  }, [selected, selectedTemplate]);

  function upsertProspect(prospect: Prospect) {
    setProspects((rows) => {
      const exists = rows.some((row) => row.prospectId === prospect.prospectId);
      return exists
        ? rows.map((row) => (row.prospectId === prospect.prospectId ? prospect : row))
        : [prospect, ...rows];
    });
    setSelectedId(prospect.prospectId);
  }

  async function copyText(text: string, label: string) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setMessage(`${label} copied.`);
  }

  async function createProspect(event: FormEvent) {
    event.preventDefault();
    setLoading('create');
    const response = await fetch('/api/admin/outreach/prospects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    }).then((res) => res.json()).catch(() => ({ ok: false, message: 'Unable to save prospect.' }));
    setLoading('');
    if (!response.ok) {
      setMessage(describeError(response));
      return;
    }
    upsertProspect(response.prospect);
    setForm(emptyForm);
    setMessage(`Prospect saved: ${response.prospect.companyName || response.prospect.email || response.prospect.prospectId}`);
  }

  async function importProspects(event: FormEvent) {
    event.preventDefault();
    setLoading('import');
    const response = await fetch('/api/admin/outreach/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: bulkText, ...bulkDefaults }),
    }).then((res) => res.json()).catch(() => ({ ok: false, message: 'Unable to import prospects.' }));
    setLoading('');
    if (!response.ok) {
      setMessage(describeError(response));
      return;
    }
    setProspects((rows) => {
      const existing = new Set(rows.map((row) => row.prospectId));
      return [...response.imported.filter((row: Prospect) => !existing.has(row.prospectId)), ...rows];
    });
    if (response.imported[0]) setSelectedId(response.imported[0].prospectId);
    setBulkText('');
    setMessage(`Imported ${response.imported.length} prospect(s). Skipped ${response.skipped.length}.`);
  }

  async function patchSelected(patch: Prospect, success: string) {
    if (!selected) return;
    setLoading('patch');
    const response = await fetch(`/api/admin/outreach/prospects/${encodeURIComponent(selected.prospectId)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then((res) => res.json()).catch(() => ({ ok: false, message: 'Unable to update prospect.' }));
    setLoading('');
    if (!response.ok) {
      setMessage(describeError(response));
      return;
    }
    upsertProspect(response.prospect);
    setMessage(success);
  }

  async function sendEmail() {
    if (!selected) return;
    setLoading('send-email');
    const response = await fetch('/api/admin/outreach/send-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prospectId: selected.prospectId, templateId: selectedTemplate }),
    }).then((res) => res.json()).catch(() => ({ ok: false, message: 'Unable to send email.' }));
    setLoading('');
    if (!response.ok) {
      setMessage(describeError(response));
      return;
    }
    upsertProspect(response.prospect);
    setMessage(response.send.status === 'sent'
      ? `Email sent to ${response.prospect.email}.`
      : response.send.status === 'preview'
        ? 'Email provider is not configured. Preview is ready for manual copy.'
        : 'Email provider failed. Preview is available for manual delivery.');
  }

  async function openWhatsapp() {
    if (!selected || !preview) return;
    if (!preview.whatsappUrl) {
      setMessage('Add a mobile or WhatsApp number before opening WhatsApp.');
      return;
    }
    window.open(preview.whatsappUrl, '_blank', 'noopener,noreferrer');
    const response = await fetch('/api/admin/outreach/mark-whatsapp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prospectId: selected.prospectId, templateId: selectedTemplate }),
    }).then((res) => res.json()).catch(() => ({ ok: false, message: 'WhatsApp message opened, but status was not updated.' }));
    if (response.ok) {
      upsertProspect(response.prospect);
      setMessage('WhatsApp message prepared.');
    } else {
      setMessage(describeError(response));
    }
  }

  async function markWhatsappSent() {
    if (!selected) return;
    setLoading('mark-whatsapp');
    const response = await fetch('/api/admin/outreach/mark-whatsapp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prospectId: selected.prospectId, templateId: selectedTemplate }),
    }).then((res) => res.json()).catch(() => ({ ok: false, message: 'Unable to mark WhatsApp status.' }));
    setLoading('');
    if (response.ok) {
      upsertProspect(response.prospect);
      setMessage('Manual WhatsApp send recorded.');
    } else {
      setMessage(describeError(response));
    }
  }

  async function optOutSelected() {
    if (!selected) return;
    if (!window.confirm(`Mark ${selected.companyName || selected.email || selected.mobile} as do-not-contact?`)) return;
    setLoading('opt-out');
    const response = await fetch('/api/admin/outreach/opt-out', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prospectId: selected.prospectId, reason: 'admin-marked-do-not-contact' }),
    }).then((res) => res.json()).catch(() => ({ ok: false, message: 'Unable to update opt-out.' }));
    setLoading('');
    if (!response.ok) {
      setMessage(describeError(response));
      return;
    }
    upsertProspect(response.prospect);
    setMessage('Do-not-contact preference saved.');
  }

  function toggleChecked(id: string) {
    setCheckedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  const selectedTemplateMeta = templates.find((template) => template.id === selectedTemplate);

  return (
    <main className="adminShell section outreachAdminShell">
      <div className="container">
        <div className="sectionHead outreachHead">
          <div>
            <span className="eyebrow">Admin outreach</span>
            <h1 className="pageTitle">Prospect Outreach CRM</h1>
            <p className="muted">Source-tracked, opt-out-aware prospect outreach for Talmech Trading.</p>
          </div>
          <div className="waActionRow">
            <a className="btn secondary" href="/api/admin/outreach/prospects?format=csv">Export CSV</a>
            <Link className="btn secondary" href="/admin">Admin home</Link>
          </div>
        </div>

        <div className="outreachKpiGrid">
          <article className="card"><span>Total prospects</span><b>{summary.total}</b></article>
          <article className="card"><span>Ready to contact</span><b>{summary.ready}</b></article>
          <article className="card"><span>Email sent</span><b>{summary.emailSent}</b></article>
          <article className="card"><span>WhatsApp prepared</span><b>{summary.whatsappPrepared}</b></article>
          <article className="card"><span>Follow-up needed</span><b>{summary.followUp}</b></article>
          <article className="card"><span>Replied</span><b>{summary.replied}</b></article>
          <article className="card"><span>Do-not-contact</span><b>{summary.doNotContact}</b></article>
        </div>

        {message && <p className="notice outreachNotice">{message}</p>}

        <div className="outreachLayout">
          <section className="panel outreachWorkPanel">
            <div className="sectionHead compactHead">
              <div>
                <span className="badge">Storage: {storageMode}</span>
                <h2>Add prospects</h2>
              </div>
            </div>

            <form className="outreachFormGrid" onSubmit={createProspect}>
              <label>Company<input className="input" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></label>
              <label>Contact person<input className="input" value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} /></label>
              <label>Designation<input className="input" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} /></label>
              <label>Email<input className="input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Mobile<input className="input" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></label>
              <label>WhatsApp<input className="input" value={form.whatsappNumber} onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })} /></label>
              <label>City<input className="input" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
              <label>State<input className="input" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></label>
              <label>Country<input className="input" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} /></label>
              <label>Website<input className="input" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
              <label>Business type<select value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })}>{businessTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label>Source<select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
              <label>Consent<select value={form.consentStatus} onChange={(event) => setForm({ ...form, consentStatus: event.target.value })}>{consentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <label>Industry tags<input className="input" value={form.industryTags} onChange={(event) => setForm({ ...form, industryTags: event.target.value })} placeholder={industryTags.slice(0, 5).join(', ')} /></label>
              <label className="span2">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
              <div className="span2 waActionRow">
                <button className="btn" type="submit" disabled={loading === 'create'}>{loading === 'create' ? 'Saving...' : 'Save prospect'}</button>
                <button className="btn secondary" type="button" onClick={() => setForm(emptyForm)}>Clear</button>
              </div>
            </form>

            <form className="outreachBulkPanel" onSubmit={importProspects}>
              <div className="sectionHead compactHead">
                <div>
                  <span className="badge">Bulk paste</span>
                  <h2>Import contacts</h2>
                </div>
              </div>
              <div className="outreachDefaults">
                <label>Default type<select value={bulkDefaults.businessType} onChange={(event) => setBulkDefaults({ ...bulkDefaults, businessType: event.target.value })}>{businessTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label>Default source<select value={bulkDefaults.source} onChange={(event) => setBulkDefaults({ ...bulkDefaults, source: event.target.value })}>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
                <label>Default consent<select value={bulkDefaults.consentStatus} onChange={(event) => setBulkDefaults({ ...bulkDefaults, consentStatus: event.target.value })}>{consentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              </div>
              <textarea value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder="Company, Person, Email, Mobile, City, State, Business Type, Website" />
              <button className="btn" type="submit" disabled={loading === 'import'}>{loading === 'import' ? 'Importing...' : 'Import prospects'}</button>
            </form>
          </section>

          <aside className="panel outreachPreviewPanel">
            <div className="sectionHead compactHead">
              <div>
                <span className="badge">Preview</span>
                <h2>{selected ? selected.companyName || selected.email || selected.mobile : 'No prospect selected'}</h2>
                {selected && <p className="muted">{selected.prospectId} / {selected.businessType} / {selected.source}</p>}
              </div>
            </div>

            {selected && preview && (
              <>
                <label>Template<select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)}>{templates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}</select></label>
                <p className="muted outreachTemplatePurpose">{selectedTemplateMeta?.purpose}</p>
                <div className="outreachSuggestionGrid">
                  <div><span>Follow-up</span><b>{preview.followUp.label}</b></div>
                  <div><span>Page links</span><b>{preview.links.map((link) => link.label).join(' / ')}</b></div>
                </div>
                <label>Email subject<input className="input" readOnly value={preview.email.subject} onFocus={(event) => event.currentTarget.select()} /></label>
                <label>Email preview<textarea readOnly value={preview.email.text} onFocus={(event) => event.currentTarget.select()} /></label>
                <div className="waActionRow">
                  <button className="btn" type="button" disabled={loading === 'send-email'} onClick={sendEmail}>{loading === 'send-email' ? 'Sending...' : 'Send email'}</button>
                  <button className="btn secondary" type="button" onClick={() => copyText(preview.email.text, 'Email text')}>Copy email</button>
                </div>
                <label>WhatsApp preview<textarea readOnly value={preview.whatsappMessage} onFocus={(event) => event.currentTarget.select()} /></label>
                <div className="waActionRow">
                  <button className="btn" type="button" onClick={openWhatsapp}>Open WhatsApp</button>
                  <button className="btn secondary" type="button" disabled={loading === 'mark-whatsapp'} onClick={markWhatsappSent}>{loading === 'mark-whatsapp' ? 'Saving...' : 'Mark WhatsApp sent'}</button>
                  <button className="btn secondary" type="button" onClick={() => copyText(preview.whatsappMessage, 'WhatsApp message')}>Copy WhatsApp</button>
                </div>
                <div className="outreachStatusActions">
                  <button className="btn secondary" type="button" onClick={() => patchSelected({ outreachStatus: 'replied' }, 'Marked replied.')}>Mark replied</button>
                  <button className="btn secondary" type="button" onClick={() => patchSelected({ outreachStatus: 'follow-up-needed', lastFollowUpAt: new Date().toISOString() }, 'Marked follow-up needed.')}>Follow-up needed</button>
                  <button className="btn dark" type="button" onClick={optOutSelected}>Do-not-contact</button>
                </div>
                <div className="outreachFollowUpBox">
                  <label>Next follow-up<input className="input" type="date" value={nextFollowUp} onChange={(event) => setNextFollowUp(event.target.value)} /></label>
                  <button className="btn secondary" type="button" onClick={() => patchSelected({ nextFollowUpAt: nextFollowUp ? new Date(`${nextFollowUp}T09:00:00`).toISOString() : '', outreachStatus: 'follow-up-needed' }, 'Follow-up date saved.')}>Save follow-up</button>
                </div>
                <label>Notes<textarea value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} /></label>
                <button className="btn secondary" type="button" onClick={() => patchSelected({ notes: notesDraft }, 'Notes saved.')}>Save notes</button>
              </>
            )}
          </aside>
        </div>

        <section className="panel outreachTablePanel">
          <div className="sectionHead compactHead">
            <div>
              <span className="badge">{checkedIds.length} selected</span>
              <h2>Prospect database</h2>
            </div>
          </div>
          <div className="outreachFilters">
            <input className="input" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Search company, email, city, note..." />
            <select value={filters.businessType} onChange={(event) => setFilters({ ...filters, businessType: event.target.value })}><option value="">All types</option>{businessTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <select value={filters.outreachStatus} onChange={(event) => setFilters({ ...filters, outreachStatus: event.target.value })}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
            <input className="input" value={filters.city} onChange={(event) => setFilters({ ...filters, city: event.target.value })} placeholder="City" />
            <input className="input" value={filters.state} onChange={(event) => setFilters({ ...filters, state: event.target.value })} placeholder="State" />
          </div>
          <div className="waAdminTableWrap">
            <table className="waAdminTable outreachTable">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Email / mobile</th>
                  <th>City / State</th>
                  <th>Type / tags</th>
                  <th>Source / consent</th>
                  <th>Status</th>
                  <th>Template</th>
                  <th>Last outreach</th>
                  <th>Next follow-up</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prospect) => (
                  <tr key={prospect.prospectId} className={selected?.prospectId === prospect.prospectId ? 'outreachSelectedRow' : ''} onClick={() => setSelectedId(prospect.prospectId)}>
                    <td onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={checkedIds.includes(prospect.prospectId)} onChange={() => toggleChecked(prospect.prospectId)} /></td>
                    <td><b>{prospect.companyName || '-'}</b><p className="waAccountMini">{prospect.prospectId}</p>{prospect.website && <a href={prospect.website} target="_blank" rel="noreferrer">{prospect.website}</a>}</td>
                    <td><b>{prospect.contactPerson || '-'}</b><p className="waAccountMini">{prospect.designation || '-'}</p></td>
                    <td>{prospect.email || '-'}<p className="waAccountMini">{[prospect.mobile, prospect.whatsappNumber].filter(Boolean).join(' / ') || '-'}</p></td>
                    <td>{[prospect.city, prospect.state].filter(Boolean).join(', ') || '-'}<p className="waAccountMini">{prospect.country || '-'}</p></td>
                    <td><span className="pill">{prospect.businessType}</span><p className="waAccountMini">{Array.isArray(prospect.industryTags) ? prospect.industryTags.join(', ') : '-'}</p></td>
                    <td>{prospect.source || '-'}<p className="waAccountMini">{prospect.consentStatus}</p></td>
                    <td><span className={statusClass(prospect.outreachStatus)}>{prospect.outreachStatus}</span></td>
                    <td>{prospect.assignedTemplate || defaultTemplateForBusinessType(prospect.businessType)}</td>
                    <td>Email: {formatDate(prospect.lastEmailSentAt)}<p className="waAccountMini">WhatsApp: {formatDate(prospect.lastWhatsappPreparedAt)}</p></td>
                    <td>{formatDate(prospect.nextFollowUpAt)}</td>
                    <td className="outreachNotesCell">{prospect.notes || '-'}</td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={12}>No outreach prospects found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
