'use client';

import { useEffect, useMemo, useState } from 'react';

function csvEscape(v: any) { return `"${String(v ?? '').replaceAll('"', '""')}"`; }
function isTrader(u: any) { return String(u.accountType || '').toLowerCase().includes('trader') || u.roleCategory === 'trader'; }

const headers = [
  'id','createdAt','status','roleCategory','accountType','firmName','ownerName','businessRole','directorName','gstNumber','primaryMobile','alternateMobile','email','state','city','area','pincode','fullAddress','liveLocation','tradingProducts','monthlyTradingVolume','monthlyTradingVolumeUnit','tradeScope','annualTurnoverAmount','annualTurnoverUnit','tradingExperienceYears','buyerSellerMix','majorMarkets','importExportCode','paymentCycle','warehouseDetails','subscriptionRequired','subscriptionPlan'
];

export default function UserApprovalConsole() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [type, setType] = useState('All');
  const [msg, setMsg] = useState('');

  async function load() {
    const d = await fetch('/api/user-registrations', { cache: 'no-store' }).then((r) => r.json());
    setUsers(d.users || []);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter((u) => {
    const statusOk = status === 'All' || u.status === status;
    const typeOk = type === 'All' || (type === 'Trader' ? isTrader(u) : String(u.accountType || '').toLowerCase().includes(type.toLowerCase()));
    const searchOk = !q || JSON.stringify(u).toLowerCase().includes(q.toLowerCase());
    return statusOk && typeOk && searchOk;
  }), [users, q, status, type]);

  async function setUserStatus(id: string, next: string) {
    const reason = next === 'REJECTED' || next === 'SUSPENDED' ? prompt('Reason / admin note?') || `${next} by admin` : 'Approved by admin';
    const r = await fetch('/api/user-registrations', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status: next, reason }),
    }).then((x) => x.json());
    setMsg(r.ok ? `${id} updated to ${next}` : r.error || 'Unable to update user');
    await load();
  }

  function exportCsv() {
    const blob = new Blob([[headers.join(','), ...filtered.map((u: any) => headers.map((h) => csvEscape(Array.isArray(u[h]) || typeof u[h] === 'object' ? JSON.stringify(u[h]) : u[h])).join(','))].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = type === 'Trader' ? 'talmech-trader-approvals.csv' : 'talmech-user-registrations.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="section adminShell">
      <div className="container">
        <span className="eyebrow">User verification control</span>
        <h1 className="pageTitle">Buyer, seller and trader account approvals</h1>
        <p className="muted">Trader accounts are reviewed separately because they receive approved dual access and can switch between buyer and seller marketplace views.</p>

        <div className="panel adminToolbar traderAdminToolbar">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search firm, GST, mobile, city, traded metal..." />
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>PENDING_REVIEW</option><option>APPROVED</option><option>REJECTED</option><option>SUSPENDED</option></select>
          <select value={type} onChange={(e) => setType(e.target.value)}><option>All</option><option>Trader</option><option>Buyer</option><option>Seller</option><option>Manufacturer</option><option>Scrap</option><option>Logistics</option></select>
          <button className="btn" onClick={exportCsv}>Export CSV</button>
          <button className="btn secondary" onClick={load}>Refresh</button>
        </div>

        {msg && <p className="success">{msg}</p>}

        <div className="adminUserGrid">
          {filtered.map((u: any) => {
            const trader = isTrader(u);
            return (
              <article className={`card adminUserCard ${trader ? 'traderAdminCard' : ''}`} key={u.id}>
                <div className="row">
                  <div>
                    <b>{u.firmName || u.company || u.ownerName}</b>
                    <p className="muted">{trader ? 'TRADER DUAL ACCESS' : u.accountType} • {u.status} • {u.table || u.roleCategory || '-'}</p>
                  </div>
                  <span className={trader ? 'pill gold' : 'pill'}>{u.id}</span>
                </div>

                <div className="userDetailGrid">
                  <p><b>GST:</b> {u.gstNumber || '-'}</p>
                  <p><b>Authorised person:</b> {u.ownerName || u.directorName || '-'} {u.businessRole ? `(${u.businessRole})` : ''}</p>
                  <p><b>Mobiles:</b> {u.primaryMobile} / {u.alternateMobile}</p>
                  <p><b>Email:</b> {u.email}</p>
                  <p><b>Location:</b> {[u.area, u.city, u.state, u.pincode].filter(Boolean).join(', ')}</p>
                  <p><b>Live location:</b> {u.liveLocation || '-'}</p>
                  <p><b>Subscription:</b> {u.subscriptionRequired ? u.subscriptionPlan : 'Not required'}</p>
                  <p><b>Created:</b> {u.createdAt ? new Date(u.createdAt).toLocaleString('en-IN') : '-'}</p>
                </div>

                <p className="muted"><b>Address:</b> {u.fullAddress}</p>

                {trader && (
                  <div className="panel traderReviewPanel">
                    <h3>Trader approval checklist</h3>
                    <div className="userDetailGrid">
                      <p><b>Trading products:</b> {u.tradingProducts || '-'}</p>
                      <p><b>Monthly volume:</b> {u.monthlyTradingVolume || '-'} {u.monthlyTradingVolumeUnit || ''}</p>
                      <p><b>Trade scope:</b> {u.tradeScope || '-'}</p>
                      <p><b>Turnover:</b> {u.annualTurnoverAmount || '-'} {u.annualTurnoverUnit || ''}</p>
                      <p><b>Experience:</b> {u.tradingExperienceYears || '-'} years</p>
                      <p><b>Activity:</b> {u.buyerSellerMix || '-'}</p>
                      <p><b>Major markets:</b> {u.majorMarkets || '-'}</p>
                      <p><b>IEC:</b> {u.importExportCode || '-'}</p>
                      <p><b>Payment cycle:</b> {u.paymentCycle || '-'}</p>
                      <p><b>Warehouse:</b> {u.warehouseDetails || '-'}</p>
                    </div>
                  </div>
                )}

                <div className="docThumbGrid">{(u.shopImages || []).slice(0, 6).map((img: any, idx: number) => img.dataUrl ? <img src={img.dataUrl} alt={`verification ${idx + 1}`} key={idx} /> : <span key={idx}>📄 {img.name}</span>)}</div>
                {u.documents && <p className="muted"><b>Document notes:</b> {typeof u.documents === 'string' ? u.documents : JSON.stringify(u.documents)}</p>}

                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  <button className="btn" onClick={() => setUserStatus(u.id, 'APPROVED')}>{trader ? 'Approve trader dual access' : 'Approve'}</button>
                  <button className="btn secondary" onClick={() => setUserStatus(u.id, 'REJECTED')}>Reject / cancel</button>
                  <button className="btn dark" onClick={() => setUserStatus(u.id, 'SUSPENDED')}>Suspend</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
