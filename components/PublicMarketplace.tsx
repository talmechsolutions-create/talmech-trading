'use client';

import { useEffect, useMemo, useState } from 'react';
import { indiaLocations, getCitiesForState } from '@/lib/indiaLocations';
import { productCategories } from '@/lib/marketplaceData';
import MarketRateBoard from '@/components/MarketRateBoard';
import { calculateDealPricing, formatInr, rateBasisLabel, commissionLabel } from '@/lib/pricing';
import { getProductImage } from '@/lib/productImages';
import { calculateSmartDispatchEta, toWeightMt } from '@/lib/logistics';
import { rankListings } from '@/lib/marketSearch';
import LocationPinPicker from '@/components/LocationPinPicker';
import ContextualHelpBox from '@/components/help/ContextualHelpBox';

type Role = 'buyer' | 'seller';
type PaymentChoice = 'PRICE_LOCK_25' | 'FULL_PAYMENT';

function labelType(t: string) {
  return t === 'SELL' ? 'Available supply' : t === 'BUY' ? 'Buyer requirement' : t === 'SCRAP' ? 'Scrap lot' : 'Logistics';
}
function isSell(t: string) { return t === 'SELL' || t === 'SCRAP'; }
function heroTitle(role: Role) { return role === 'buyer' ? 'Source verified local metal supply with confidence.' : 'See genuine buyer demand and respond faster.'; }
function heroText(role: Role) { return role === 'buyer' ? 'Explore supply offers, stock lots, scrap and made-to-order capability. Talmech verifies commercial, logistics and technical information before supplier details are shared.' : 'View live buyer demand by product, grade, quantity and city. Sellers can respond with stock, manufacturing readiness and dispatch timelines.'; }
function primaryCta(role: Role) { return role === 'buyer' ? 'Post your buying requirement' : 'List your supply offer'; }
function firstPreview(x: any) { return Array.isArray(x.previewImages) && x.previewImages[0] ? x.previewImages[0] : ''; }
function categorySlug(x: any) { const match = productCategories.find((m) => m.metal === x.metal || m.slug === String(x.metal || '').toLowerCase()); return match?.slug || 'steel'; }
function defaultCategoryImage(x: any) { return getProductImage(x.product, categorySlug(x)); }
function rateSource(x: any) { return x.targetPrice || x.price || x.indicativeRate || ''; }
function parseQtyLocal(v: any) { const n = Number(String(v || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/)?.[0] || 0); return Number.isFinite(n) ? n : 0; }
function defaultRequestUnit(x: any) { const u = String(x.unit || '').toUpperCase(); return u === 'KG' || u === 'MT' || u === 'TON' || u === 'TONNE' ? 'MT' : 'UNIT'; }
function ListingVisual({ x }: { x: any }) { const img = firstPreview(x) || defaultCategoryImage(x); return img ? <img src={img} alt={`${x.product || x.metal} product image`} className="listingPhotoReal" /> : <span>{x.product || x.metal}</span>; }
function listingField(x: any, key: string) { return x?.[key] ?? x?.raw?.[key] ?? ''; }
function listingPickup(x: any) { return [listingField(x, 'pickupAddress') || listingField(x, 'address'), listingField(x, 'area'), listingField(x, 'city'), listingField(x, 'state'), listingField(x, 'pincode')].filter(Boolean).join(', '); }
function listingPickupLat(x: any) { return listingField(x, 'pickupLat') || listingField(x, 'lat'); }
function listingPickupLng(x: any) { return listingField(x, 'pickupLng') || listingField(x, 'lng'); }
function fixedRateLabel(x: any) {
  const rate = rateSource(x);
  if (!rate) return 'Quote after verification';
  const p = calculateDealPricing({ rate, quantity: 1, unit: defaultRequestUnit(x), rateBasis: String(x.unit || '').toUpperCase() === 'UNIT' ? 'UNIT' : 'KG', metal: x.metal, product: x.product, grade: x.grade });
  return `${formatInr(p.rate)} / ${p.rateBasis}`;
}

export default function PublicMarketplace() {
  const [listings, setListings] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');
  const [metal, setMetal] = useState('All');
  const [type, setType] = useState('Auto');
  const [radius, setRadius] = useState('Local first');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [role, setRole] = useState<Role>('buyer');
  const [roleLocked, setRoleLocked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeMedia, setActiveMedia] = useState<string>('');
  const [timeText, setTimeText] = useState('');
  const [lockCreating, setLockCreating] = useState(false);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [logisticsResult, setLogisticsResult] = useState<any>(null);

  const [lockForm, setLockForm] = useState({
    buyerName: '', buyerPhone: '', buyerEmail: '', requestedQuantity: '', requestedUnit: 'MT', rate: '', rateBasis: 'KG', buyerRemarks: '', sellerRemarks: '',
    logisticsRequired: 'NO', deliveryState: 'Maharashtra', deliveryCity: 'Pune', deliveryAddress: '', deliveryLat: '', deliveryLng: '', deliveryMapUrl: '', logisticsPaymentResponsibility: 'BUYER', logisticsProviderId: '', logisticsVehicleId: '', logisticsScheduleDate: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    const d = await fetch('/api/marketplace-listings', { cache: 'no-store' }).then(r => r.json());
    setListings(d.listings || []);
  }

  useEffect(() => {
    load().catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const product = params.get('product'); const metalParam = params.get('metal');
    if (product) setQ(product);
    if (metalParam) { const m = productCategories.find(x => x.slug === metalParam); if (m) setMetal(m.metal); }
    try {
      const saved = (localStorage.getItem('talmech-role') as Role) || 'buyer';
      setRole(saved); setRoleLocked(localStorage.getItem('talmech-role-locked') === 'true');
      const u = JSON.parse(localStorage.getItem('talmech-user') || 'null'); setUser(u);
      setLockForm(f => ({ ...f, buyerName: u?.ownerName || u?.name || '', buyerPhone: u?.primaryMobile || u?.phone || '', buyerEmail: u?.email || '', deliveryCity: city, deliveryState: state }));
    } catch {}
    setTimeText(new Date().toLocaleString('en-IN'));
  }, []);

  function chooseRole(next: Role) {
    const accountClass = String(user?.accountClass || localStorage.getItem('talmech-account-class') || '').toLowerCase();
    const isTrader = accountClass === 'trader' || user?.traderAccess === true;
    if (roleLocked && !isTrader) { setMessage('Your marketplace view is locked to your selected account role. Traders can switch buyer/seller view after approval.'); return; }
    setRole(next); setType('Auto');
    try {
      localStorage.setItem('talmech-market-view', next);
      if (!isTrader) localStorage.setItem('talmech-role-locked', 'true');
      window.dispatchEvent(new Event('talmech-role-change'));
    } catch {}
  }

  const rankedListings = useMemo(() => rankListings(listings, { query: q, role, type, metal, buyerCity: city, buyerState: state, radius }), [listings, q, metal, type, city, state, radius, role]);
  const filtered = rankedListings.map((row) => row.listing);
  const rankFor = (x: any) => rankedListings.find((row) => row.listing === x || row.listing.id === x.id)?.rank;

  function smartEtaFor(x: any) {
    return calculateSmartDispatchEta({
      pickup: listingPickup(x),
      drop: `${city}, ${state}`,
      dispatchReadiness: x.dispatchReadiness,
      productionLeadTime: x.productionLeadTime,
      deliveryEta: x.deliveryEta,
      readyDispatchTime: x.readyDispatchTime,
      pickupLat: listingPickupLat(x),
      pickupLng: listingPickupLng(x),
      dropLat: lockForm.deliveryLat,
      dropLng: lockForm.deliveryLng,
    });
  }

  async function captureEnquiry(x: any, action = 'buy/enquiry request') {
    const payload = { intent: 'BUY', listingId: x.id, metal: x.metal, product: x.product, grade: x.grade, quantity: lockForm.requestedQuantity || x.quantity, unit: lockForm.requestedUnit || x.unit, state: x.state, city: x.city, area: x.area, pincode: x.pincode, companyName: user?.firmName || 'Marketplace visitor', contactName: user?.ownerName || user?.name || '', phone: user?.primaryMobile || user?.phone || 'To be collected by admin', email: user?.email || '', targetPrice: rateSource(x), technicalDetails: `Visitor clicked ${action} for listing ${x.id}. Talmech team must verify buyer, seller, GST, stock, documents, logistics and final commercial terms before sharing direct details.`, dispatchReadiness: x.dispatchReadiness, deliveryEta: x.deliveryEta, status: `New ${action}`, source: 'Public marketplace CTA' };
    const res = await fetch('/api/public-requirements', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
    setMessage(res.ok ? `Your request for ${x.product} has been captured. Talmech will verify documents, pricing, stock readiness, logistics and commercial terms before proceeding.` : 'Unable to capture request.');
    load().catch(() => {});
  }

  function openListing(x: any) {
    const offered = parseQtyLocal(x.quantity);
    const requestQty = offered > 0 ? String(Math.min(offered, String(x.unit || '').toUpperCase() === 'MT' ? Math.min(offered, 1) : offered)) : '';
    const basis = String(x.unit || '').toUpperCase() === 'UNIT' ? 'UNIT' : 'KG';
    setSelected(x); setActiveMedia(firstPreview(x) || defaultCategoryImage(x));
    setLogisticsResult(null);
    setLockForm(f => ({ ...f, requestedQuantity: requestQty, requestedUnit: defaultRequestUnit(x), rate: rateSource(x), rateBasis: basis, buyerRemarks: '', sellerRemarks: '', logisticsRequired: 'NO', deliveryState: state, deliveryCity: city, deliveryAddress: '', deliveryLat: '', deliveryLng: '', deliveryMapUrl: '', logisticsProviderId: '', logisticsVehicleId: '', logisticsPaymentResponsibility: 'BUYER', logisticsScheduleDate: new Date().toISOString().slice(0, 10) }));
  }

  const selectedPricing = selected ? calculateDealPricing({ rate: rateSource(selected), quantity: lockForm.requestedQuantity, unit: lockForm.requestedUnit, rateBasis: lockForm.rateBasis, paymentMode: 'PRICE_LOCK_25', metal: selected.metal, product: selected.product, grade: selected.grade }) : null;
  const selectedFullPricing = selected ? calculateDealPricing({ rate: rateSource(selected), quantity: lockForm.requestedQuantity, unit: lockForm.requestedUnit, rateBasis: lockForm.rateBasis, paymentMode: 'FULL_PAYMENT', metal: selected.metal, product: selected.product, grade: selected.grade }) : null;
  const selectedVehicleOption = useMemo(() => (logisticsResult?.vehicleOptions || []).find((x: any) => x.id === `${lockForm.logisticsProviderId}-${lockForm.logisticsVehicleId}` || x.vehicleId === lockForm.logisticsVehicleId) || logisticsResult?.vehicleOptions?.[0] || null, [logisticsResult, lockForm.logisticsProviderId, lockForm.logisticsVehicleId]);
  const logisticsBuyerPayable = lockForm.logisticsRequired === 'YES' ? Number(selectedVehicleOption?.buyerPayable || 0) : 0;
  const priceLockTotalWithLogistics = Number(selectedPricing?.buyerPayableEstimate || 0) + logisticsBuyerPayable;
  const fullTotalWithLogistics = Number(selectedFullPricing?.fullPaymentAmount || 0) + logisticsBuyerPayable;

  function priceLabel(x: any) { const rate = rateSource(x); if (!rate) return 'Quote after verification'; const p = calculateDealPricing({ rate, quantity: 1, unit: String(x.unit || '').toUpperCase() === 'UNIT' ? 'UNIT' : 'KG', rateBasis: String(x.unit || '').toUpperCase() === 'UNIT' ? 'UNIT' : 'KG', metal: x.metal, product: x.product, grade: x.grade }); return `${formatInr(p.rate)} / ${p.rateBasis} supplier rate`; }

  async function calculateLogistics() {
    if (!selected) return;
    if (!lockForm.deliveryCity) { setMessage('Please select buyer delivery city for logistics calculation.'); return; }
    const weightMt = toWeightMt(lockForm.requestedQuantity || selected.quantity, lockForm.requestedUnit || selected.unit) || 0.1;
    setLogisticsLoading(true); setMessage('');
    const d = await fetch('/api/logistics', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        pickup: listingPickup(selected), drop: `${lockForm.deliveryAddress ? `${lockForm.deliveryAddress}, ` : ''}${lockForm.deliveryCity}, ${lockForm.deliveryState}`, metal: selected.metal, product: selected.product, weightMt, lengthFt: 12, widthFt: 7, heightFt: 7, paymentResponsibility: lockForm.logisticsPaymentResponsibility, date: lockForm.logisticsScheduleDate, dispatchReadiness: selected.dispatchReadiness, productionLeadTime: selected.productionLeadTime, deliveryEta: selected.deliveryEta, readyDispatchTime: selected.readyDispatchTime, pickupLat: listingPickupLat(selected), pickupLng: listingPickupLng(selected), dropLat: lockForm.deliveryLat, dropLng: lockForm.deliveryLng,
      })
    }).then(r => r.json()).catch(() => ({ success: false, error: 'Unable to calculate logistics.' }));
    setLogisticsLoading(false);
    if (d.success) {
      setLogisticsResult(d);
      const recommended = d.vehicleOptions?.[0];
      if (recommended) setLockForm(f => ({ ...f, logisticsProviderId: recommended.providerId || '', logisticsVehicleId: recommended.vehicleId || '' }));
      setMessage('Logistics options calculated from seller pickup pin/city to buyer delivery pin/city. Admin-locked vendor pricing will be recalculated again during checkout.');
    } else setMessage(d.error || 'Unable to calculate logistics.');
  }

  async function createPriceLock(paymentMode: PaymentChoice) {
    if (!selected) return;
    const pricing = paymentMode === 'FULL_PAYMENT' ? selectedFullPricing : selectedPricing;
    if (!lockForm.buyerName || !lockForm.buyerPhone) { setMessage('Please add buyer name and mobile number before payment.'); return; }
    if (!rateSource(selected) || !pricing?.materialValue) { setMessage('This listing does not have a fixed supplier rate yet. Please use Buy / Enquire and Talmech will verify the final quote.'); return; }
    const requestedQty = parseQtyLocal(lockForm.requestedQuantity);
    const offeredQty = parseQtyLocal(selected.quantity);
    if (!requestedQty) { setMessage('Please enter the quantity you want to buy.'); return; }
    if (offeredQty && String(selected.unit || '').toUpperCase() === String(lockForm.requestedUnit || '').toUpperCase() && requestedQty > offeredQty) { setMessage(`Requested quantity cannot exceed available quantity of ${selected.quantity} ${selected.unit}.`); return; }
    if (lockForm.logisticsRequired === 'YES' && !selectedVehicleOption) { setMessage('Please calculate and select a logistics vehicle, or choose No for logistics.'); return; }
    setLockCreating(true);
    const payload = {
      listingId: selected.id, paymentMode, buyerName: lockForm.buyerName, buyerPhone: lockForm.buyerPhone, buyerEmail: lockForm.buyerEmail, metal: selected.metal, product: selected.product, grade: selected.grade, quantity: lockForm.requestedQuantity, unit: lockForm.requestedUnit, requestedQuantity: lockForm.requestedQuantity, requestedUnit: lockForm.requestedUnit, offeredQuantity: selected.quantity, offeredUnit: selected.unit, rate: rateSource(selected), rateBasis: lockForm.rateBasis, buyerRemarks: lockForm.buyerRemarks, sellerRemarks: lockForm.sellerRemarks, state: selected.state, city: selected.city, area: selected.area, pincode: selected.pincode, dispatchReadiness: selected.dispatchReadiness,
      logisticsRequired: lockForm.logisticsRequired === 'YES', logisticsPickup: listingPickup(selected), logisticsPickupLat: listingPickupLat(selected), logisticsPickupLng: listingPickupLng(selected), logisticsDrop: `${lockForm.deliveryAddress ? `${lockForm.deliveryAddress}, ` : ''}${lockForm.deliveryCity}, ${lockForm.deliveryState}`, logisticsDropLat: lockForm.deliveryLat, logisticsDropLng: lockForm.deliveryLng, buyerDeliveryAddress: lockForm.deliveryAddress, logisticsProviderId: selectedVehicleOption?.providerId || '', logisticsVehicleId: selectedVehicleOption?.vehicleId || '', logisticsVehicleName: selectedVehicleOption?.vehicleName || '', logisticsPaymentResponsibility: lockForm.logisticsPaymentResponsibility, logisticsScheduleDate: lockForm.logisticsScheduleDate,
    };
    const res = await fetch('/api/price-locks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()).catch(() => ({ ok: false }));
    setLockCreating(false);
    if (res.ok) {
      setMessage(`${paymentMode === 'FULL_PAYMENT' ? 'Full payment proforma' : 'Price-lock proforma'} ${res.lock.id} created. Redirecting to secure payment page.`);
      if (!String(selected.id).startsWith('DEMO')) await fetch('/api/marketplace-listings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: selected.id, lockStatus: paymentMode === 'FULL_PAYMENT' ? 'Full payment pending' : 'Lock payment pending' }) });
      window.location.href = res.paymentUrl || `/price-lock/${res.lock.id}/payment`;
    } else setMessage(res.error || 'Unable to create payment request. Please try again or contact Talmech support.');
  }

  return <section className="marketplacePage"><div className="container">
    <div className="marketHeroPro singleHero"><div><span className="eyebrow">Local-first metal marketplace</span><h1 className="pageTitle">{heroTitle(role)}</h1><p className="muted">{heroText(role)}</p><div className="roleSwitch"><button className={role === 'buyer' ? 'active' : ''} onClick={() => chooseRole('buyer')}><strong>Buyer view</strong><small>See supplier offers first</small></button><button className={role === 'seller' ? 'active' : ''} onClick={() => chooseRole('seller')}><strong>Seller view</strong><small>See buyer demand first</small></button><a href="/whatsapp-upload"><strong>Upload via WhatsApp</strong><small>Assisted public upload</small></a><a href="https://wa.me/917389642874" target="_blank" rel="noreferrer"><strong>Need support?</strong><small>WhatsApp Talmech</small></a><a href="/how-it-works"><strong>How it works</strong><small>Marketplace guide</small></a><a className="active" href={role === 'buyer' ? '/post-requirement' : '/sell'}><strong>{primaryCta(role)}</strong><small>Verified workflow</small></a></div></div></div>
    <ContextualHelpBox type="marketplace" label="How it works" />
    <MarketRateBoard />
    <div className="marketplaceShell"><aside className="marketFilters"><h3>Refine marketplace</h3><label>Search product<input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="TMT, copper scrap, EN24, brass rod, forging..." /></label><label>Metal<select value={metal} onChange={e => setMetal(e.target.value)}><option>All</option>{productCategories.map(m => <option key={m.slug}>{m.metal}</option>)}</select></label><label>Listing type<select value={type} onChange={e => setType(e.target.value)}><option>Auto</option><option>All</option><option>SELL</option><option>BUY</option><option>SCRAP</option></select></label><label>Buyer delivery state<select value={state} onChange={e => { setState(e.target.value); setCity(getCitiesForState(e.target.value)[0] || ''); }}><option>All India</option>{indiaLocations.filter(x => x.state !== 'All India').map(x => <option key={x.state}>{x.state}</option>)}</select></label><label>Buyer delivery city<select value={city} onChange={e => setCity(e.target.value)}>{getCitiesForState(state).map(c => <option key={c}>{c}</option>)}</select></label><label>Search radius<select value={radius} onChange={e => setRadius(e.target.value)}><option>Local first</option><option>Nearby city</option><option>Same state</option><option>All India</option></select></label><p className="notice">Search shows only close product matches first, then ranks nearest seller/trader by city/state. Out-of-city results appear only when they match your product keywords. Exact Google Maps pins improve freight accuracy.</p><a className="btn secondary" href="/metals">Browse by metal category</a></aside>
      <main><div className="marketSearchBar"><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search TMT bars, aluminum ingot, copper wire, brass fittings..." /><button className="btn">Search</button><a className="btn secondary" href="/whatsapp-upload">Send product details on WhatsApp</a></div>{message && <p className="success">{message}</p>}<div className="marketStats"><span>{filtered.length} active matches</span><span>{role === 'buyer' ? 'Supplier-led view' : 'Buyer-led view'}</span><span>Checked {timeText || 'after load'}</span></div>{filtered.length === 0 && <div className="panel smartNoResults"><b>No exact active match found.</b><p>Try broader words like steel plate, MS plate, scrap, copper, aluminium, grade, city or PIN. The search checks product, grade, metal, technical text, city, seller/trader profile and documents.</p><a className="btn secondary" href="/post-requirement">Post requirement to Talmech</a><a className="btn" href="/whatsapp-upload">Post requirement via WhatsApp</a></div>}<div className="indiaMartGrid">{filtered.map((x: any, i: number) => { const hasRate = Boolean(rateSource(x)); const eta = smartEtaFor(x); return <article className="productCard" key={`${x.id}-${i}`} onClick={() => openListing(x)}><div className="supplierRibbon">{x.verified ? 'Talmech checked' : 'Fresh listing'}</div><div className="productPhoto"><ListingVisual x={x} /></div><div className="productBody"><div className="listingBadgeRow"><span className={isSell(x.type) ? 'pill green' : 'pill gold'}>{labelType(x.type)}</span><span className="pill">{x.metal}</span>{rankFor(x)?.reason && <span className="pill smartMatchPill">{rankFor(x)?.reason}</span>}{x.grade && <span className="pill">{x.grade}</span>}<span className="pill">{x.lockStatus || 'Available'}</span></div><h3>{isSell(x.type) ? `${x.product} ${x.grade || ''}` : `${x.product} ${x.grade || ''} requirement`}</h3><p className="cardPrice">{priceLabel(x)}</p>{hasRate && <p className="feeLine">Buyer enters required quantity before final calculation. Buyer service charge, GST and logistics are calculated after required quantity is entered.</p>}<p className="muted">Available: <b>{x.quantity || ''} {x.unit || ''}</b> • {x.status || 'Open'}</p><p className="locationLine">📍 {[x.area, x.city, x.state].filter(Boolean).join(', ')} {x.pincode ? `- ${x.pincode}` : ''}</p><p className="dispatchLine"><b>Dispatch:</b> {x.dispatchReadiness === 'READY_STOCK' ? 'Ready stock' : 'Made / procured after order'} • <b>{eta.label}</b>{eta.ready && <><br /><span>{eta.byText}</span><br /><small>{eta.distanceKm} km route estimate including 6 hrs dispatch buffer</small></>}</p><div className="trustLine"><span>GST route</span><span>Documents</span><span>Logistics ready</span></div><button className="contactSupplierBtn" onClick={(e) => { e.stopPropagation(); isSell(x) ? openListing(x) : captureEnquiry(x, 'offer supply request'); }}>{isSell(x) ? 'View buying options' : 'Offer Supply'}</button><a className="callNowBtn" onClick={e => e.stopPropagation()} href={`https://wa.me/917389642874?text=${encodeURIComponent(`I am interested in ${x.product} ${x.grade || ''} listing ${x.id}`)}`} target="_blank" rel="noreferrer">📞 Talk to Talmech</a></div></article>; })}</div></main></div>
    {selected && <div className="modalBackdrop" onClick={() => setSelected(null)}><div className="listingModal proListingModal dealModalV8" onClick={e => e.stopPropagation()}><button className="modalClose" onClick={() => setSelected(null)}>×</button><div className="modalProductGrid"><div><div className="productPhoto modalPhoto"><img src={activeMedia || defaultCategoryImage(selected)} alt={selected.product} className="listingPhotoReal" /></div><div className="thumbRow mediaThumbRow">{(Array.isArray(selected.previewImages) && selected.previewImages.length ? selected.previewImages : [defaultCategoryImage(selected)]).slice(0, 4).map((img: string, idx: number) => <button key={idx} className={`mediaThumb ${activeMedia === img ? 'active' : ''}`} onClick={() => img && setActiveMedia(img)}>{img ? <img src={img} alt={`${selected.product} ${idx + 1}`} /> : <span>{selected.product}</span>}</button>)}</div></div><div><span className={isSell(selected.type) ? 'pill green' : 'pill gold'}>{labelType(selected.type)}</span><h2>{isSell(selected.type) ? `${selected.product} ${selected.grade || ''} available` : `${selected.product} ${selected.grade || ''} requirement`}</h2><p className="cardPrice">{rateSource(selected) ? `${fixedRateLabel(selected)} fixed supplier rate` : 'Quote after verification'}</p><p>Available quantity: <b>{selected.quantity} {selected.unit}</b></p><p>Seller pickup: {[selected.area, selected.city, selected.state].filter(Boolean).join(', ')} {selected.pincode}</p><p>Dispatch status: <b>{selected.dispatchReadiness === 'READY_STOCK' ? 'Ready stock' : 'Made / procured after order'}</b></p><p>Estimated fulfilment: <b>{smartEtaFor(selected).label}</b> {smartEtaFor(selected).ready && <span>• {smartEtaFor(selected).byText}</span>}</p>
        <div className="pricingBox proCalcBox"><b>Professional deal calculator</b><p className="muted">Enter quantity first. The system then calculates product value, GST, buyer fee and optional seller-to-buyer logistics using admin-locked vehicle pricing.</p><div className="pricingInputs"><label>Required quantity<input className="input" value={lockForm.requestedQuantity} onChange={e => setLockForm({ ...lockForm, requestedQuantity: e.target.value })} placeholder="Example: 100" /></label><label>Required unit<select value={lockForm.requestedUnit} onChange={e => setLockForm({ ...lockForm, requestedUnit: e.target.value })}><option value="KG">KG</option><option value="MT">MT</option><option value="UNIT">Piece / Unit</option></select></label><label>Supplier fixed rate<input className="input lockedInput" value={rateSource(selected) || 'Quote after verification'} readOnly /></label><label>Rate basis<select value={lockForm.rateBasis} onChange={e => setLockForm({ ...lockForm, rateBasis: e.target.value })}><option value="KG">₹ per KG</option><option value="MT">₹ per MT</option><option value="UNIT">₹ per piece / unit</option></select></label></div>{selectedPricing && selectedPricing.materialValue > 0 ? <div className="priceBreakdown cleanBreakdown"><p>Quantity basis: <b>{lockForm.requestedQuantity} {lockForm.requestedUnit} = {selectedPricing.qtyInKg.toLocaleString('en-IN')} KG</b></p><p>Rate basis: <b>{rateBasisLabel(selectedPricing.rateBasis)}</b></p><p>Material value: <b>{formatInr(selectedPricing.materialValue)}</b></p><p>Indicative GST on material @ {selectedPricing.gstPercent}%: <b>{formatInr(selectedPricing.materialGst)}</b></p><p>Buyer service charge {commissionLabel(selectedPricing.buyerServiceFeeRate)}: <b>{formatInr(selectedPricing.buyerServiceFee)}</b></p><p>GST on buyer service charge @ {selectedPricing.gstPercent}%: <b>{formatInr(selectedPricing.buyerServiceGst)}</b></p>{lockForm.logisticsRequired === 'YES' && <p><span>Selected logistics payable by buyer</span><b>{formatInr(logisticsBuyerPayable)}</b></p>}<p>Estimated buyer payable incl. GST: <b>{formatInr(priceLockTotalWithLogistics)}</b></p><p className="advance"><span>Option A: 25% price-lock advance now</span><b>{formatInr(Math.round(priceLockTotalWithLogistics * (selectedPricing.advanceRate || 0.25)))}</b></p><p><span>Balance before dispatch after lock</span><b>{formatInr(Math.max(0, priceLockTotalWithLogistics - Math.round(priceLockTotalWithLogistics * (selectedPricing.advanceRate || 0.25))))}</b></p><p className="strong"><span>Option B: Full payment now</span><b>{formatInr(fullTotalWithLogistics)}</b></p><small>GST is indicative. Logistics is recomputed server-side using admin-locked vendor/vehicle rates before payment and invoice generation.</small></div> : <p className="muted">Enter required quantity. If a listing has no fixed supplier rate, Talmech will verify and share final quote before payment.</p>}</div>
        {isSell(selected.type) && <div className="logisticsCheckoutBox"><div className="row"><div><b>Need Talmech logistics?</b><p className="muted">If yes, choose buyer delivery city and select an admin-priced vehicle option. If no, product checkout continues without freight.</p></div><select value={lockForm.logisticsRequired} onChange={e => setLockForm({ ...lockForm, logisticsRequired: e.target.value })}><option value="NO">No, buyer/seller will arrange</option><option value="YES">Yes, add logistics to checkout</option></select></div>{lockForm.logisticsRequired === 'YES' && <><div className="finderGrid"><label>Delivery state<select value={lockForm.deliveryState} onChange={e => setLockForm({ ...lockForm, deliveryState: e.target.value, deliveryCity: getCitiesForState(e.target.value)[0] || '' })}>{indiaLocations.filter(x => x.state !== 'All India').map(x => <option key={x.state}>{x.state}</option>)}</select></label><label>Delivery city<select value={lockForm.deliveryCity} onChange={e => setLockForm({ ...lockForm, deliveryCity: e.target.value })}>{getCitiesForState(lockForm.deliveryState).map(c => <option key={c}>{c}</option>)}</select></label><label>Delivery area / address<input className="input" value={lockForm.deliveryAddress} onChange={e => setLockForm({ ...lockForm, deliveryAddress: e.target.value })} placeholder="MIDC, factory gate, unloading point..." /></label><label>Logistics paid by<select value={lockForm.logisticsPaymentResponsibility} onChange={e => setLockForm({ ...lockForm, logisticsPaymentResponsibility: e.target.value })}><option value="BUYER">Buyer paid</option><option value="SELLER">Seller paid</option><option value="SPLIT">Split buyer/seller</option></select></label></div><LocationPinPicker label="Buyer delivery pin / unloading point" address={lockForm.deliveryAddress} lat={lockForm.deliveryLat} lng={lockForm.deliveryLng} mapUrl={lockForm.deliveryMapUrl} city={lockForm.deliveryCity} state={lockForm.deliveryState} onChange={(patch) => setLockForm({ ...lockForm, deliveryAddress: patch.address ?? lockForm.deliveryAddress, deliveryLat: patch.lat ?? lockForm.deliveryLat, deliveryLng: patch.lng ?? lockForm.deliveryLng, deliveryMapUrl: patch.mapUrl ?? lockForm.deliveryMapUrl })} /><button className="btn secondary" disabled={logisticsLoading} onClick={calculateLogistics}>{logisticsLoading ? 'Calculating vehicles...' : 'Calculate vehicles and freight'}</button>{logisticsResult?.vehicleOptions?.length > 0 && <div className="vehicleOptionGrid">{logisticsResult.vehicleOptions.map((o: any) => <button key={o.id} type="button" className={`vehicleOptionCard ${selectedVehicleOption?.id === o.id ? 'selected' : ''}`} onClick={() => setLockForm({ ...lockForm, logisticsProviderId: o.providerId, logisticsVehicleId: o.vehicleId })}><span className="badge">{o.recommended ? 'Recommended' : 'Option'}</span><h3>{o.vehicleName}</h3><p className="muted">{o.providerName} • Capacity {o.capacityMt} MT</p><p><b>{o.distanceKm} km</b> seller to buyer • Rate/km <b>₹{o.ratePerKm}</b></p><p className="priceSmall">{formatInr(o.total)}</p><p className="muted">Buyer payable: <b>{formatInr(o.buyerPayable)}</b></p><p className="dispatchLine"><b>{o.eta?.label}</b><br />{o.eta?.byText}</p></button>)}</div>}</>}</div>}
        <div className="priceLockForm"><h3>Buyer remarks for secure order processing</h3><div className="grid cards2"><label>Buyer name<input className="input" value={lockForm.buyerName} onChange={e => setLockForm({ ...lockForm, buyerName: e.target.value })} /></label><label>Mobile<input className="input" value={lockForm.buyerPhone} onChange={e => setLockForm({ ...lockForm, buyerPhone: e.target.value })} /></label></div><label>Email<input className="input" value={lockForm.buyerEmail} onChange={e => setLockForm({ ...lockForm, buyerEmail: e.target.value })} /></label><label>Buyer remarks<textarea value={lockForm.buyerRemarks} onChange={e => setLockForm({ ...lockForm, buyerRemarks: e.target.value })} placeholder="Delivery terms, GST requirement, payment preference, inspection needs..." /></label></div>
        <p className="muted">Contact information is protected until commercial and technical checks are completed.</p><div className="dealActionGrid">{isSell(selected.type) ? <><button className="btn secondary" onClick={() => captureEnquiry(selected)}>Enquire before payment</button><button className="btn" disabled={lockCreating} onClick={() => createPriceLock('PRICE_LOCK_25')}>{lockCreating ? 'Creating...' : 'Pay 25% price-lock advance'}</button><button className="btn dark" disabled={lockCreating} onClick={() => createPriceLock('FULL_PAYMENT')}>Pay full amount for faster dispatch</button></> : <a className="btn" href="/sell">Offer supply</a>}<a className="btn secondary" target="_blank" rel="noreferrer" href={`https://wa.me/917389642874?text=${encodeURIComponent(`Please help me with ${selected.product} ${selected.grade || ''} listing ${selected.id}`)}`}>WhatsApp support</a></div></div></div><div className="grid cards3" style={{ marginTop: 18 }}><div className="card noShadow"><b>Commercial review</b><p>Fixed supplier rate, GST route, buyer service charge, payment cycle and order closure conditions are reviewed before direct contact exchange.</p></div><div className="card noShadow"><b>Secure payment</b><p>Razorpay order-based checkout is used. Server verifies payment signature before marking the advance or full payment as paid.</p></div><div className="card noShadow"><b>Safe dispatch</b><p>Ready stock shows hour-based ETA; made/procured stock keeps day-based preparation time. Logistics is confirmed by admin/vendor before dispatch.</p></div></div></div></div>}
  </div></section>;
}
