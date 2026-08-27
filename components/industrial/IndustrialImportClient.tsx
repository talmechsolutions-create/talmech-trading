'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { industrialImportModes } from '@/lib/industrial/importTypes';

export function IndustrialImportUpload() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/admin/industrial-intelligence/imports/upload', {
      method: 'POST',
      body: new FormData(event.currentTarget),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !payload.ok) {
      setMessage(payload.message || 'Upload failed.');
      return;
    }
    const batchId = payload.batch?.id;
    if (batchId) router.push(`/admin/industrial-intelligence/imports/${batchId}`);
    else setMessage('Industrial schema is not ready in this environment.');
  }

  return (
    <form className="panel industrialImportForm" onSubmit={submit}>
      <div className="industrialPanelHead">
        <div>
          <h2>Import database</h2>
          <p className="muted">Upload creates a controlled dry-run batch. It does not create companies, plants or contacts.</p>
        </div>
      </div>
      <label>File<input className="input" type="file" name="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required /></label>
      <label>Import mode<select name="importMode" defaultValue="COMPANY_PLANT_MASTER">{industrialImportModes.map((mode) => <option key={mode} value={mode}>{mode.replace(/_/g, ' ')}</option>)}</select></label>
      <label>Source name<input className="input" name="sourceSystem" defaultValue="ADMIN_UPLOAD" /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'Uploading...' : 'Upload for mapping'}</button>
      {message ? <p className="notice slimNotice">{message}</p> : null}
    </form>
  );
}

export function IndustrialImportActions({ batchId, status }: { batchId: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  async function post(path: string, label: string, body?: unknown) {
    setBusy(label);
    setMessage('');
    const response = await fetch(path, {
      method: 'POST',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    setBusy('');
    if (!response.ok || !payload.ok) {
      setMessage(payload.message || `${label} failed.`);
      return;
    }
    setMessage(`${label} completed.`);
    router.refresh();
  }

  return (
    <div className="industrialHeaderActions">
      <button className="btn secondary" disabled={Boolean(busy)} onClick={() => post(`/api/admin/industrial-intelligence/imports/${batchId}/dry-run`, 'Dry run')}>Dry run</button>
      <button className="btn secondary" disabled={Boolean(busy) || status !== 'DRY_RUN_READY'} onClick={() => post(`/api/admin/industrial-intelligence/imports/${batchId}/approve`, 'Approval')}>Approve</button>
      <button
        className="btn"
        disabled={Boolean(busy) || status !== 'APPROVED'}
        onClick={() => {
          const confirmed = window.confirm('Commit this approved batch? This creates master Industrial Intelligence records and cannot be treated as a dry run.');
          if (confirmed) post(`/api/admin/industrial-intelligence/imports/${batchId}/commit`, 'Commit');
        }}
      >
        Commit approved batch
      </button>
      {message ? <p className="muted">{busy || message}</p> : null}
    </div>
  );
}

