'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatInr, commissionLabel } from '@/lib/pricing';

declare global { interface Window { Razorpay?: any } }

function loadRazorpayScript() {
  return new Promise<boolean>((resolve)=>{
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PriceLockPaymentClient({ lockId }: { lockId: string }) {
  const [lock,setLock]=useState<any>(null);
  const [gatewayReady,setGatewayReady]=useState(false);
  const [keyId,setKeyId]=useState('');
  const [loading,setLoading]=useState(true);
  const [paying,setPaying]=useState(false);
  const [message,setMessage]=useState('');
  const [invoiceUrl,setInvoiceUrl]=useState('');

  async function load(){
    setLoading(true);
    const d=await fetch(`/api/price-locks/${lockId}`,{cache:'no-store'}).then(r=>r.json()).catch(()=>({ok:false}));
    setLoading(false);
    if(d.ok){setLock(d.lock);setGatewayReady(d.gatewayReady);setKeyId(d.razorpayKeyId||'');} else setMessage('Payment record not found.');
  }
  useEffect(()=>{load()},[lockId]);

  const paymentAmount=Number(lock?.paymentAmount || lock?.payableNow || lock?.priceLockAdvance || 0);
  const canPay=useMemo(()=>lock && paymentAmount>0 && !String(lock.status||'').includes('PAID'),[lock,paymentAmount]);
  const isFull = lock?.paymentMode === 'FULL_PAYMENT';
  const buyerServiceRate = Number(lock?.buyerServiceFeeRate || 0);

  async function startPayment(){
    if(!lock) return;
    setPaying(true); setMessage('');
    const orderRes=await fetch('/api/razorpay/create-order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lockId:lock.id})}).then(r=>r.json()).catch(()=>({ok:false,error:'Network error'}));
    if(!orderRes.ok){
      setPaying(false);
      if(orderRes.configMissing) setMessage('Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local, then restart the server.');
      else setMessage(orderRes.error || 'Unable to create Razorpay order.');
      return;
    }
    const loaded=await loadRazorpayScript();
    if(!loaded || !window.Razorpay){setPaying(false);setMessage('Unable to load Razorpay checkout. Please check internet connection.');return;}
    const options = {
      key: orderRes.keyId || keyId,
      amount: orderRes.order.amount,
      currency: orderRes.order.currency || 'INR',
      name: 'Talmech Trading',
      description: `${isFull ? 'Full payment with buyer service charge waiver' : '25% secure price-lock advance'} for ${lock.product || 'metal product'}`,
      order_id: orderRes.order.id,
      prefill: { name: lock.buyerName || '', email: lock.buyerEmail || '', contact: lock.buyerPhone || '' },
      notes: { lockId: lock.id, product: lock.product || '', paymentMode: lock.paymentMode || 'PRICE_LOCK_25' },
      theme: { color: '#0f766e' },
      handler: async function(response:any){
        const verify=await fetch('/api/razorpay/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lockId:lock.id,...response})}).then(r=>r.json()).catch(()=>({ok:false,error:'Verification failed'}));
        setPaying(false);
        if(verify.ok){setMessage('Payment successful. Invoice has been generated and queued/sent to your email. Talmech admin will verify stock, documents and commercial acceptance before final confirmation.');setInvoiceUrl(verify.invoiceUrl);setLock(verify.lock);} else setMessage(verify.error || 'Payment could not be verified. Please contact Talmech support before retrying.');
      },
      modal: { ondismiss: function(){ setPaying(false); setMessage('Payment window closed. Your proforma remains payment pending.'); } }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  if(loading) return <main className="section"><div className="container"><div className="panel">Loading secure payment page...</div></div></main>;
  if(!lock) return <main className="section"><div className="container"><div className="panel"><h1>Payment record not found</h1><p className="muted">Please contact Talmech support.</p></div></div></main>;

  return <main className="paymentPage section">
    <div className="container paymentLayout">
      <section className="paymentHeroCard">
        <span className="eyebrow">Secure Talmech payment</span>
        <h1>{isFull ? 'Complete full payment with buyer-side service charge waiver.' : 'Pay 25% advance to lock the verified price.'}</h1>
        <p>{isFull ? 'Full payment gives priority processing and removes the buyer-side service charge. Supplier stock, GST documents and dispatch terms are still verified before release.' : 'Price-lock advance reserves the rate while Talmech verifies supplier stock, buyer profile, GST route, documents and dispatch readiness.'}</p>
        <div className="paymentTrustGrid"><span>Razorpay checkout</span><span>Server-side signature verification</span><span>Buyer invoice after payment</span><span>Admin verification before dispatch</span></div>
      </section>
      <aside className="paymentSummaryCard">
        <span className={isFull?'pill green':'pill'}>{isFull ? 'Full payment order' : '25% price-lock order'}</span>
        <h2>{lock.product} {lock.grade}</h2>
        <p className="muted">{lock.metal} • Required {lock.quantity} {lock.unit} • {lock.city}, {lock.state}</p>
        <div className="invoiceTable mini">
          <p><span>Supplier fixed rate</span><b>{lock.rate ? `₹${lock.rate} / ${lock.rateBasis || 'KG'}` : 'To be verified'}</b></p>
          <p><span>Material value</span><b>{formatInr(lock.materialValue)}</b></p>
          <p><span>Indicative GST on material @ {Number(lock.gstPercent || 18).toFixed(0)}%</span><b>{formatInr(lock.materialGst)}</b></p>{Number(lock.logisticsCost||0)>0 && <p><span>Logistics vehicle</span><b>{lock.logisticsVehicleName || 'Admin assigned vehicle'}</b></p>}{Number(lock.logisticsCost||0)>0 && <p><span>Logistics route</span><b>{lock.logisticsDistanceKm ? `${lock.logisticsDistanceKm} km` : 'Route estimate'} • {lock.logisticsProviderName || 'admin assigned'}</b></p>}{Number(lock.logisticsCost||0)>0 && <p><span>Logistics cost</span><b>{formatInr(lock.logisticsCost)}</b></p>}{Number(lock.logisticsCost||0)>0 && <p><span>Logistics payable by buyer</span><b>{formatInr(lock.logisticsBuyerPayable)}</b></p>}{Number(lock.logisticsCost||0)>0 && lock.logisticsEtaLabel && <p><span>Delivery ETA</span><b>{lock.logisticsEtaLabel}<br/>{lock.logisticsEtaBy}</b></p>}
          <p><span>{isFull ? 'Buyer service charge waived for full payment' : `Buyer service charge ${commissionLabel(buyerServiceRate)}`}</span><b>{formatInr(lock.buyerServiceFee)}</b></p>
          {!isFull && <p><span>GST on buyer service charge</span><b>{formatInr(lock.buyerServiceGst)}</b></p>}
          <p className="strong"><span>Total buyer payable estimate</span><b>{formatInr(lock.buyerPayableEstimate)}</b></p>
          <p className="advance"><span>{isFull ? 'Pay now: full amount' : 'Pay now: 25% advance'}</span><b>{formatInr(paymentAmount)}</b></p>
          <p><span>Balance before dispatch</span><b>{formatInr(lock.balanceOnDispatch)}</b></p>
          <p><span>HSN/GST reference</span><b>{lock.gstHsn || 'To verify'} • {Number(lock.gstPercent || 18).toFixed(0)}%</b></p>
        </div>
        <div className="termsBox"><b>Important terms</b><p>{lock.terms}</p><p className="muted">Seller/supplier settlement is handled separately and is not part of the buyer payment summary.</p></div>
        {message && <p className={message.includes('successful')?'success':'notice'}>{message}</p>}
        {invoiceUrl ? <Link className="btn" href={invoiceUrl}>Download / print invoice</Link> : <button disabled={!canPay || paying} className="btn payBtn" onClick={startPayment}>{paying ? 'Opening secure checkout...' : `Pay ${formatInr(paymentAmount)}`}</button>}
        {!gatewayReady && <p className="notice">Payment gateway placeholder is ready, but Razorpay keys are not configured in this environment.</p>}
        <a className="btn secondary" href="https://wa.me/917389642874" target="_blank" rel="noreferrer">Need help? WhatsApp Talmech</a>
      </aside>
    </div>
  </main>;
}
