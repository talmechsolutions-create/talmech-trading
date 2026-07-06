export const TALMECH_BUYER_SERVICE_FEE_RATE = 0.025;
export const TALMECH_SELLER_SERVICE_FEE_RATE = 0.025;
export const PRICE_LOCK_ADVANCE_RATE = 0.25;
export const DEFAULT_GST_RATE = 0.18;

export type RateBasis = 'KG' | 'MT' | 'UNIT';
export type PaymentMode = 'PRICE_LOCK_25' | 'FULL_PAYMENT';

export function parseMoney(value: any) {
  const raw = String(value ?? '').replace(/,/g, '').replace(/₹/g, '').trim();
  const match = raw.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export function parseQty(value: any) {
  const raw = String(value ?? '').replace(/,/g, '').trim();
  const match = raw.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export function unitMultiplier(unit: any) {
  const u = String(unit || '').toUpperCase();
  if (u === 'MT' || u === 'TON' || u === 'TONNE') return 1000;
  if (u === 'KG') return 1;
  return 1;
}

export function normalizeUnit(unit:any){
  const u = String(unit || '').toUpperCase();
  if (u === 'TON' || u === 'TONNE') return 'MT';
  if (u === 'KG') return 'KG';
  if (u === 'MT') return 'MT';
  return 'UNIT';
}

export function detectRateBasis(rateInput: any, unit: any): RateBasis {
  const text = String(rateInput || '').toLowerCase();
  if (text.includes('/mt') || text.includes('per mt') || text.includes('metric ton') || text.includes('tonne')) return 'MT';
  if (text.includes('/kg') || text.includes('per kg') || text.includes('kg')) return 'KG';
  if (text.includes('/pc') || text.includes('/nos') || text.includes('per piece') || text.includes('per nos') || text.includes('/unit')) return 'UNIT';
  const u = normalizeUnit(unit);
  if (u === 'MT' || u === 'KG') return 'KG';
  return 'UNIT';
}

export function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0)));
}

export function formatQty(value:any, unit:any){
  const q = parseQty(value);
  if(!q) return '-';
  return `${q.toLocaleString('en-IN')} ${normalizeUnit(unit)==='UNIT'?'Unit':normalizeUnit(unit)}`;
}

export function convertRequestedQty(input:{quantity:any; unit:any; rateBasis:any}){
  const requestedQuantity = parseQty(input.quantity);
  const requestedUnit = normalizeUnit(input.unit);
  const rateBasis = (input.rateBasis as RateBasis) || 'KG';
  const requestedKg = requestedQuantity * unitMultiplier(requestedUnit);
  const billableQty = rateBasis === 'KG' ? requestedKg : rateBasis === 'MT' ? requestedKg / 1000 : requestedQuantity;
  return { requestedQuantity, requestedUnit, requestedKg, billableQty };
}

export function getGstInfo(input: { metal?: any; product?: any; grade?: any }) {
  const text = `${input.metal || ''} ${input.product || ''} ${input.grade || ''}`.toLowerCase();
  let hsn = '72/73';
  let chapter = 'Iron, steel or steel articles';
  if (text.includes('copper') || text.includes('brass') || text.includes('bronze')) { hsn = '74'; chapter = 'Copper, brass and articles thereof'; }
  else if (text.includes('aluminium') || text.includes('aluminum')) { hsn = '76'; chapter = 'Aluminium and articles thereof'; }
  else if (text.includes('zinc')) { hsn = '79'; chapter = 'Zinc and articles thereof'; }
  else if (text.includes('nickel') || text.includes('inconel')) { hsn = '75'; chapter = 'Nickel and nickel alloys'; }
  else if (text.includes('lead')) { hsn = '78'; chapter = 'Lead and articles thereof'; }
  else if (text.includes('scrap')) { hsn = '72/74/76 as applicable'; chapter = 'Metal scrap by base metal'; }
  return {
    gstRate: DEFAULT_GST_RATE,
    hsn,
    chapter,
    note: 'GST shown is indicative for buyer understanding. Final GST/HSN must be verified against supplier tax invoice, product form, place of supply and statutory applicability before dispatch.'
  };
}

export function calculateDealPricing(input: { rate?: any; quantity?: any; unit?: any; fallbackRate?: any; rateBasis?: RateBasis | string; paymentMode?: PaymentMode | string; metal?: any; product?: any; grade?: any; gstRate?: any }) {
  const rawRate = input.rate || input.fallbackRate;
  const rate = parseMoney(rawRate);
  const unit = normalizeUnit(input.unit || 'KG');
  const rateBasis = (input.rateBasis as RateBasis) || detectRateBasis(rawRate, unit);
  const paymentMode = (input.paymentMode as PaymentMode) || 'PRICE_LOCK_25';
  const qty = convertRequestedQty({ quantity: input.quantity, unit, rateBasis });
  const materialValue = rate && qty.requestedQuantity ? Math.round(rate * qty.billableQty) : 0;
  const gstInfo = getGstInfo(input);
  const gstRate = Number(input.gstRate ?? gstInfo.gstRate ?? DEFAULT_GST_RATE);
  const materialGst = Math.round(materialValue * gstRate);

  // Buyer special offer: if buyer pays 100% upfront, buyer service charge is waived.
  // Seller service charge remains backend-only and must not be shown on buyer pages/invoices.
  const buyerServiceFeeRate = paymentMode === 'FULL_PAYMENT' ? 0 : TALMECH_BUYER_SERVICE_FEE_RATE;
  const buyerServiceFee = Math.round(materialValue * buyerServiceFeeRate);
  const buyerServiceGst = Math.round(buyerServiceFee * gstRate);
  const sellerServiceFee = Math.round(materialValue * TALMECH_SELLER_SERVICE_FEE_RATE);

  const buyerPayableBeforeGst = materialValue + buyerServiceFee;
  const buyerPayableEstimate = materialValue + materialGst + buyerServiceFee + buyerServiceGst;
  const supplierNetEstimate = materialValue - sellerServiceFee;
  const priceLockAdvance = Math.round(buyerPayableEstimate * PRICE_LOCK_ADVANCE_RATE);
  const fullPaymentAmount = buyerPayableEstimate;
  const payableNow = paymentMode === 'FULL_PAYMENT' ? fullPaymentAmount : priceLockAdvance;
  const balanceOnDispatch = Math.max(0, buyerPayableEstimate - payableNow);
  return {
    rate,
    rateBasis,
    unit,
    quantity: qty.requestedQuantity,
    requestedQuantity: qty.requestedQuantity,
    requestedUnit: unit,
    qtyInKg: qty.requestedKg,
    billableQty: qty.billableQty,
    materialValue,
    gstRate,
    gstPercent: gstRate * 100,
    gstHsn: gstInfo.hsn,
    gstChapter: gstInfo.chapter,
    gstNote: gstInfo.note,
    materialGst,
    buyerServiceFee,
    buyerServiceGst,
    sellerServiceFee,
    buyerPayableBeforeGst,
    buyerPayableEstimate,
    buyerTotalWithGst: buyerPayableEstimate,
    supplierNetEstimate,
    priceLockAdvance,
    fullPaymentAmount,
    paymentMode,
    payableNow,
    paymentAmount: payableNow,
    balanceOnDispatch,
    buyerServiceFeeRate,
    sellerServiceFeeRate: TALMECH_SELLER_SERVICE_FEE_RATE,
    advanceRate: PRICE_LOCK_ADVANCE_RATE
  };
}

export function rateBasisLabel(rateBasis: string) {
  if (rateBasis === 'MT') return '₹ per MT';
  if (rateBasis === 'UNIT') return '₹ per piece / unit';
  return '₹ per KG';
}

export function commissionLabel(rate:number){
  return `${(rate*100).toFixed(rate*100%1===0?0:1)}%`;
}


export type GstBreakup = { taxableValue: number; gstRate: number; gstAmount: number; cgst: number; sgst: number; igst: number; taxType: 'CGST_SGST' | 'IGST'; supplierState: string; buyerState: string };
export function normalizeStateName(value: any) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' '); }
export function calculateGstBreakup(input: { taxableValue: any; gstRate?: any; supplierState?: any; buyerState?: any }): GstBreakup { const taxableValue=Math.max(0,Math.round(Number(input.taxableValue||0))); const gstRate=Number(input.gstRate??DEFAULT_GST_RATE); const gstAmount=Math.round(taxableValue*gstRate); const supplierState=String(input.supplierState||'').trim(); const buyerState=String(input.buyerState||'').trim(); const sameState=Boolean(supplierState&&buyerState&&normalizeStateName(supplierState)===normalizeStateName(buyerState)); if(sameState){const half=Math.round(gstAmount/2); return{taxableValue,gstRate,gstAmount,cgst:half,sgst:gstAmount-half,igst:0,taxType:'CGST_SGST',supplierState,buyerState};} return{taxableValue,gstRate,gstAmount,cgst:0,sgst:0,igst:gstAmount,taxType:'IGST',supplierState,buyerState}; }
export function invoiceSerial(prefix='TT'){const d=new Date(); const fyStart=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1; const fy=`${String(fyStart).slice(-2)}-${String(fyStart+1).slice(-2)}`; return `${prefix}/${fy}/${String(Date.now()).slice(-8)}`;}
