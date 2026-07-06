'use client';

import { useEffect, useMemo, useState } from 'react';

type Tab = 'received' | 'payouts' | 'invoices';

function fmt(n: any) {
  const v = Number(n || 0);
  return Number.isFinite(v)
    ? v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    : '₹0';
}

function dateText(v: any) {
  if (!v) return '-';
  try { return new Date(v).toLocaleString('en-IN'); } catch { return String(v); }
}

export default function PaymentOperationsConsole() {
  const [tab, setTab] = useState<Tab>('received');
  const [data, setData] = useState<any>({ locks: [], payments: [], invoices: [], payouts: [], summary: {} });
  const [q, setQ] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    const res = await fetch('/api/admin-payments', { cache: 'no-store' }).then(r => r.json());
    setData(res || {});
  }

  useEffect(() => { load(); }, []);

  const locks = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (data.locks || []).filter((x: any) => !needle || JSON.stringify(x).toLowerCase().includes(needle));
  }, [data.locks, q]);

  const payouts = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (data.payouts || []).filter((x: any) => !needle || JSON.stringify(x).toLowerCase().includes(needle));
  }, [data.payouts, q]);

  const invoices = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (data.invoices || []).filter((x: any) => !needle || JSON.stringify(x).toLowerCase().includes(needle));
  }, [data.invoices, q]);

  async function createPayout(lock: any, payoutType: 'SELLER_SETTLEMENT' | 'LOGISTICS_VENDOR_PAYMENT') {
    setBusyId(`${lock.id}-${payoutType}`);
    setMessage('');
    const res = await fetch('/api/admin-payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE_PAYOUT',
        lockId: lock.id,
        payoutType,
        amount: payoutType === 'LOGISTICS_VENDOR_PAYMENT' ? Number(lock.logisticsCost || 0) : Number(lock.supplierNetEstimate || 0),
        payableToName: payoutType === 'LOGISTICS_VENDOR_PAYMENT' ? lock.logisticsProviderName : lock.sellerName || lock.companyName || 'Seller / Supplier',
        notes: payoutType === 'LOGISTICS_VENDOR_PAYMENT'
          ? `Freight payout for ${lock.logisticsVehicleName || 'vehicle'} on lock ${lock.id}`
          : `Supplier settlement after Talmech service deduction for lock ${lock.id}`,
      }),
    }).then(r => r.json());
    setBusyId('');
    setMessage(res.ok ? 'Payout voucher created. Verify bank details before releasing payment.' : (res.error || 'Unable to create payout.'));
    await load();
  }

  async function updatePayout(id: string, status: string) {
    setBusyId(id);
    setMessage('');
    const res = await fetch('/api/admin-payments', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, patch: { status, paidAt: status === 'PAID_COMPLETED' ? new Date().toISOString() : undefined } }),
    }).then(r => r.json());
    setBusyId('');
    setMessage(res.ok ? 'Payout status updated.' : 'Unable to update payout status.');
    await load();
  }

  const summary = data.summary || {};

  return (
    <main className="adminShell section">
      <div className="container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Admin finance control</span>
            <h1 className="pageTitle">Payment tracker, payout sender and invoice control</h1>
            <p className="muted">Track Razorpay receipts, partial/full buyer payments, balance pending, seller settlements, logistics vendor payouts and payout vouchers from one protected admin console.</p>
          </div>
          <div className="row">
            <a className="btn secondary" href="/api/admin-payments?format=csv">Export CSV</a>
            <button className="btn" onClick={load}>Refresh</button>
          </div>
        </div>

        {message && <p className="success">{message}</p>}

        <div className="grid cards4 paymentKpiGrid">
          <div className="card"><b>{fmt(summary.received)}</b><p className="muted">Verified payment received</p></div>
          <div className="card"><b>{fmt(summary.pendingBuyerBalance)}</b><p className="muted">Buyer balance pending</p></div>
          <div className="card"><b>{fmt(summary.sellerPayable)}</b><p className="muted">Estimated supplier payable</p></div>
          <div className="card"><b>{fmt(summary.logisticsPayable)}</b><p className="muted">Logistics payable estimate</p></div>
        </div>

        <section className="panel paymentControlPanel">
          <div className="paymentTabs">
            <button className={tab === 'received' ? 'active' : ''} onClick={() => setTab('received')}>Buyer payments</button>
            <button className={tab === 'payouts' ? 'active' : ''} onClick={() => setTab('payouts')}>Supplier/logistics payouts</button>
            <button className={tab === 'invoices' ? 'active' : ''} onClick={() => setTab('invoices')}>Invoices & vouchers</button>
          </div>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search payment id, buyer, seller, logistics provider, invoice, city, product..." />
        </section>

        {tab === 'received' && (
          <div className="grid paymentRecordGrid">
            {locks.map((lock: any) => {
              const stage = lock.paymentStage || {};
              const logisticsAmount = Number(lock.logisticsCost || 0);
              return (
                <article className="card paymentRecordCard" key={lock.id}>
                  <div className="paymentRecordTop">
                    <div>
                      <span className="badge">{stage.label || lock.paymentMode || 'Payment'}</span>
                      <span className="badge">{lock.status}</span>
                      <h3>{lock.product} {lock.grade}</h3>
                      <p className="muted">Lock: {lock.id} • Invoice: {lock.invoiceId || 'Pending'} • Created: {dateText(lock.createdAt)}</p>
                    </div>
                    <div className="paymentAmountBox">
                      <b>{fmt(stage.paid || lock.paymentAmount)}</b>
                      <small>{stage.paidOk ? 'Received / verified' : 'Awaiting payment'}</small>
                    </div>
                  </div>

                  <div className="grid cards4 compactFinanceGrid">
                    <div><b>{fmt(lock.materialValue)}</b><p className="muted">Material</p></div>
                    <div><b>{fmt(lock.buyerServiceFee)}</b><p className="muted">Buyer fee</p></div>
                    <div><b>{fmt(logisticsAmount)}</b><p className="muted">Logistics</p></div>
                    <div><b>{fmt(stage.balance)}</b><p className="muted">Balance</p></div>
                  </div>

                  <div className="paymentMetaGrid">
                    <p><b>Buyer:</b> {lock.buyerName || '-'} • {lock.buyerPhone || '-'} • {lock.buyerEmail || '-'}</p>
                    <p><b>Razorpay:</b> Order {lock.paymentOrderId || '-'} • Payment {lock.paymentId || '-'}</p>
                    <p><b>Logistics:</b> {lock.logisticsProviderName || 'Not selected'} {lock.logisticsVehicleName ? `• ${lock.logisticsVehicleName}` : ''}</p>
                    <p><b>Seller payout estimate:</b> {fmt(lock.supplierNetEstimate || (Number(lock.materialValue || 0) - Number(lock.sellerServiceFee || 0)))}</p>
                  </div>

                  <div className="paymentActionRow">
                    <button className="btn secondary" disabled={!lock.paymentId || busyId === `${lock.id}-SELLER_SETTLEMENT`} onClick={() => createPayout(lock, 'SELLER_SETTLEMENT')}>Create seller payout</button>
                    <button className="btn secondary" disabled={!lock.paymentId || !logisticsAmount || busyId === `${lock.id}-LOGISTICS_VENDOR_PAYMENT`} onClick={() => createPayout(lock, 'LOGISTICS_VENDOR_PAYMENT')}>Create logistics payout</button>
                    {lock.invoiceId && <a className="btn" href={`/price-lock/${lock.id}/invoice`}>Open buyer invoice</a>}
                  </div>
                </article>
              );
            })}
            {!locks.length && <div className="notice">No matching payments found.</div>}
          </div>
        )}

        {tab === 'payouts' && (
          <div className="grid paymentRecordGrid">
            {payouts.map((p: any) => (
              <article className="card payoutCard" key={p.id}>
                <div className="paymentRecordTop">
                  <div>
                    <span className="badge">{p.payoutType}</span>
                    <span className="badge">{p.status}</span>
                    <h3>{p.payableToName || p.logisticsProviderName || 'Payable party'}</h3>
                    <p className="muted">Voucher: {p.payoutInvoiceId} • Lock: {p.lockId || '-'} • Created: {dateText(p.createdAt)}</p>
                  </div>
                  <div className="paymentAmountBox"><b>{fmt(p.netPayable)}</b><small>Net payable</small></div>
                </div>
                <div className="grid cards4 compactFinanceGrid">
                  <div><b>{fmt(p.amount)}</b><p className="muted">Base amount</p></div>
                  <div><b>{fmt(p.gstAmount)}</b><p className="muted">GST/charges</p></div>
                  <div><b>{fmt(p.tdsAmount)}</b><p className="muted">TDS hold</p></div>
                  <div><b>{fmt(p.deductions)}</b><p className="muted">Deductions</p></div>
                </div>
                <p className="muted">Mode: {p.paymentMode || 'Bank transfer'} • Reference: {p.adminReference || 'Add bank/UPI reference after payment'} • Paid at: {dateText(p.paidAt)}</p>
                <div className="paymentActionRow">
                  <button className="btn secondary" disabled={busyId === p.id} onClick={() => updatePayout(p.id, 'PAYMENT_INITIATED')}>Mark initiated</button>
                  <button className="btn" disabled={busyId === p.id} onClick={() => updatePayout(p.id, 'PAID_COMPLETED')}>Mark paid</button>
                  <button className="btn dark" disabled={busyId === p.id} onClick={() => updatePayout(p.id, 'CANCELLED')}>Cancel</button>
                </div>
              </article>
            ))}
            {!payouts.length && <div className="notice">No payout vouchers yet. Create seller/logistics payout from a verified buyer payment.</div>}
          </div>
        )}

        {tab === 'invoices' && (
          <div className="grid paymentRecordGrid">
            {invoices.map((inv: any) => (
              <article className="card" key={inv.id}>
                <div className="paymentRecordTop">
                  <div><span className="badge">{inv.status}</span><h3>{inv.id}</h3><p className="muted">Lock: {inv.lockId || '-'} • Created: {dateText(inv.createdAt)}</p></div>
                  <div className="paymentAmountBox"><b>{fmt(inv.total)}</b><small>Invoice / voucher total</small></div>
                </div>
                <p className="muted">Customer/party: {inv.customer?.name || inv.customer?.contactName || inv.customer?.phone || '-'}</p>
                <p className="muted">Terms: {inv.terms || '-'}</p>
              </article>
            ))}
            {!invoices.length && <div className="notice">No invoices found.</div>}
          </div>
        )}
      </div>
    </main>
  );
}
