import { findPriceLock } from '@/lib/proDb';
import { formatInr, commissionLabel, calculateGstBreakup } from '@/lib/pricing';
import PrintButton from '@/components/PrintButton';

export const metadata={title:'Buyer Payment Invoice | Talmech Trading',robots:{index:false,follow:false}};

export default async function Page({params}:{params:{id:string}}){
  const lock:any = await findPriceLock(params.id);
  if(!lock) return <main className="section"><div className="container"><div className="panel"><h1>Invoice not found</h1></div></div></main>;
  const isFull = lock.paymentMode === 'FULL_PAYMENT';
  const paidAmount = Number(lock.paymentAmount || lock.payableNow || lock.priceLockAdvance || 0);
  const buyerServiceRate = Number(lock.buyerServiceFeeRate || 0);
  const materialTax = calculateGstBreakup({ taxableValue: lock.materialValue, gstRate: lock.gstRate || 0.18, supplierState: lock.state, buyerState: lock.buyerState || lock.deliveryState });
  const serviceTax = calculateGstBreakup({ taxableValue: lock.buyerServiceFee, gstRate: lock.gstRate || 0.18, supplierState: lock.state, buyerState: lock.buyerState || lock.deliveryState });
  return <main className="invoicePage section"><div className="container invoiceDoc">
    <div className="invoiceHeader"><div><span className="brandMark">T</span><h1>Talmech Trading</h1><p>{isFull ? 'Buyer full payment receipt' : 'Buyer price-lock advance receipt'}</p></div><div><b>{lock.invoiceId || `INV-${lock.id}`}</b><p>{new Date(lock.paidAt || lock.createdAt).toLocaleString('en-IN')}</p><p>Status: {lock.status}</p></div></div>
    <div className="invoiceParties"><div><b>Buyer</b><p>{lock.buyerName || '-'}</p><p>{lock.buyerPhone || '-'}</p><p>{lock.buyerEmail || '-'}</p></div><div><b>Trade item</b><p>{lock.product} {lock.grade}</p><p>Required: {lock.quantity} {lock.unit}</p><p>Supplier offered: {lock.offeredQuantity || '-'} {lock.offeredUnit || ''}</p><p>{[lock.area,lock.city,lock.state,lock.pincode].filter(Boolean).join(', ')}</p></div></div>
    <div className="invoiceTable">
      <p><span>Supplier fixed rate</span><b>{lock.rate ? `₹${lock.rate} / ${lock.rateBasis || 'KG'}` : 'To be verified'}</b></p>
      <p><span>Material value</span><b>{formatInr(lock.materialValue)}</b></p>
      <p><span>Indicative GST on material @ {Number(lock.gstPercent || 18).toFixed(0)}%</span><b>{formatInr(lock.materialGst)}</b></p><p><span>GST route</span><b>{materialTax.taxType === 'IGST' ? `IGST ${formatInr(materialTax.igst)}` : `CGST ${formatInr(materialTax.cgst)} + SGST ${formatInr(materialTax.sgst)}`}</b></p>{Number(lock.logisticsCost||0)>0 && <p><span>Logistics cost ({lock.logisticsProviderName || 'admin assigned'})</span><b>{formatInr(lock.logisticsCost)}</b></p>}{Number(lock.logisticsCost||0)>0 && <p><span>Logistics payable by buyer</span><b>{formatInr(lock.logisticsBuyerPayable)}</b></p>}
      <p><span>{isFull ? 'Buyer service charge waived for full payment' : `Buyer service charge @ ${commissionLabel(buyerServiceRate)}`}</span><b>{formatInr(lock.buyerServiceFee)}</b></p>
      {!isFull && <p><span>GST on buyer service charge</span><b>{serviceTax.taxType === 'IGST' ? `${formatInr(serviceTax.igst)} IGST` : `${formatInr(serviceTax.cgst)} CGST + ${formatInr(serviceTax.sgst)} SGST`}</b></p>}
      <p className="strong"><span>Total buyer payable estimate incl. GST</span><b>{formatInr(lock.buyerPayableEstimate)}</b></p>
      <p className="advance"><span>{isFull ? 'Full payment paid / payable' : 'Price-lock advance paid / payable'}</span><b>{formatInr(paidAmount)}</b></p>
      <p><span>Balance before dispatch</span><b>{formatInr(lock.balanceOnDispatch)}</b></p>
      <p><span>GST/HSN reference</span><b>{lock.gstHsn || 'To verify'} • {lock.gstChapter || 'As applicable'}</b></p>
      <p><span>Razorpay payment ID</span><b>{lock.paymentId || 'Pending / manual update'}</b></p>
    </div>
    <section className="invoiceTerms"><h2>Terms and conditions</h2><ol><li>{isFull ? 'Full payment gives buyer-side service charge waiver and faster processing priority. Dispatch remains subject to Talmech verification of supplier stock, buyer profile, GST/tax invoice, documents and commercial acceptance.' : 'Price lock becomes valid only after Talmech verifies supplier stock, buyer profile, GST/tax invoice, documents, dispatch readiness and commercial acceptance.'}</li><li>{isFull ? 'If verification fails, refund or adjustment will be handled as per final written confirmation.' : 'Advance amount is adjusted against the final invoice value.'}</li><li>For price-lock orders, balance is payable before dispatch or as mutually approved in the final order terms.</li><li>GST shown is indicative. Final GST, HSN, freight, loading, unloading, insurance and statutory charges are finalized during tax invoice and dispatch verification.</li><li>Supplier settlement is handled separately and is not part of the buyer invoice.</li></ol></section>
    <div className="invoiceActions noPrint"><PrintButton label="Download / print invoice"/><a className="btn secondary" href="/public-marketplace">Back to marketplace</a></div>
  </div></main>;
}
