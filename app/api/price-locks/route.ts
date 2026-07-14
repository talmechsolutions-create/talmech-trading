import { NextRequest, NextResponse } from 'next/server';
import { csv } from '@/lib/marketplaceStore';
import { calculateDealPricing } from '@/lib/pricing';
import { createPriceLock, listPriceLocks, updatePriceLock, listLogisticsProviders } from '@/lib/proDb';
import { selectDefaultLogisticsProvider, estimateProviderVehicleCost } from '@/lib/logistics';
import { getOpenRouteServiceRoute } from '@/lib/routeService';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { getStorageMode, publicStorageError } from '@/lib/storageMode';
import {
  isValidEmail,
  isValidIndianMobile,
  jsonSizeBytes,
  normalizeEmail,
  normalizeIndianMobile,
  normalizePincode,
  sanitizeMultiline,
  sanitizeString,
  toFiniteNumber,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';

const headers = [
  'id',
  'createdAt',
  'listingId',
  'paymentMode',
  'buyerName',
  'buyerPhone',
  'buyerEmail',
  'metal',
  'product',
  'grade',
  'quantity',
  'unit',
  'offeredQuantity',
  'offeredUnit',
  'rate',
  'rateBasis',
  'materialValue',
  'gstHsn',
  'gstRate',
  'materialGst',
  'buyerServiceFee',
  'buyerServiceGst',
  'sellerServiceFee',
  'logisticsProviderName',
  'logisticsVehicleName',
  'logisticsDistanceKm',
  'logisticsEtaLabel',
  'logisticsEtaBy',
  'logisticsCost',
  'logisticsBuyerPayable',
  'logisticsSellerPayable',
  'logisticsPaymentResponsibility',
  'buyerPayableEstimate',
  'priceLockAdvance',
  'fullPaymentAmount',
  'paymentAmount',
  'balanceOnDispatch',
  'supplierNetEstimate',
  'status',
  'paymentOrderId',
  'paymentId',
  'invoiceId',
  'buyerRemarks',
  'sellerRemarks',
  'terms',
];

export async function GET(req: NextRequest) {
  try {
    const rows = await listPriceLocks();

    if (req.nextUrl.searchParams.get('format') === 'csv') {
      return new NextResponse(csv(rows, headers), {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="talmech-price-locks.csv"',
        },
      });
    }

    return NextResponse.json({
      locks: rows,
      updatedAt: new Date().toISOString(),
      storage: getStorageMode(),
    });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    console.error('PRICE_LOCKS_GET_FAILED', error);
    return NextResponse.json({ ok: false, error: 'Unable to load price locks.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req, { keyPrefix: 'price-locks', limit: 12, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));

  if (jsonSizeBytes(body) > 500_000) {
    return NextResponse.json({ ok: false, error: 'Price-lock request is too large.' }, { status: 413 });
  }

  const paymentMode =
    body.paymentMode === 'FULL_PAYMENT' ? 'FULL_PAYMENT' : 'PRICE_LOCK_25';

  const requestedQuantity = body.requestedQuantity || body.quantity;
  const requestedUnit = body.requestedUnit || body.unit;

  if (!sanitizeString(body.buyerName, 120) || !isValidIndianMobile(body.buyerPhone)) {
    return NextResponse.json(
      { ok: false, error: 'Buyer name and a valid Indian mobile number are required.' },
      { status: 400 }
    );
  }

  if (body.buyerEmail && !isValidEmail(body.buyerEmail)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid buyer email address.' }, { status: 400 });
  }

  if (!sanitizeString(body.metal, 80) || !sanitizeString(body.product, 120)) {
    return NextResponse.json({ ok: false, error: 'Metal and product are required.' }, { status: 400 });
  }

  if (toFiniteNumber(requestedQuantity, 0) <= 0) {
    return NextResponse.json({ ok: false, error: 'Requested quantity must be greater than zero.' }, { status: 400 });
  }

  const pricing = calculateDealPricing({
    rate: body.rate || body.targetPrice || body.indicativeRate,
    quantity: requestedQuantity,
    unit: requestedUnit,
    fallbackRate: body.fallbackRate,
    rateBasis: body.rateBasis,
    paymentMode,
    metal: body.metal,
    product: body.product,
    grade: body.grade,
  });


  const logisticsRequired = body.logisticsRequired === true || body.logisticsRequired === 'YES';
  const logisticsPickup = body.logisticsPickup || body.pickup || [body.area, body.city, body.state].filter(Boolean).join(', ');
  const logisticsDrop = body.logisticsDrop || body.deliveryLocation || body.buyerLocation || body.buyerCity || '';
  const logisticsPaymentResponsibility = ['SELLER','SPLIT'].includes(String(body.logisticsPaymentResponsibility || '').toUpperCase()) ? String(body.logisticsPaymentResponsibility).toUpperCase() : 'BUYER';
  const logisticsCoords = { pickupLat: body.logisticsPickupLat || body.pickupLat, pickupLng: body.logisticsPickupLng || body.pickupLng, dropLat: body.logisticsDropLat || body.dropLat, dropLng: body.logisticsDropLng || body.deliveryLng };
  let logisticsSelection:any = null;
  let logisticsRoadRoute:any = null;
  const routePatch:any = {};
  if (logisticsRequired && logisticsPickup && logisticsDrop) {
    logisticsRoadRoute = await getOpenRouteServiceRoute({pickupLat: logisticsCoords.pickupLat, pickupLng: logisticsCoords.pickupLng, dropLat: logisticsCoords.dropLat, dropLng: logisticsCoords.dropLng});
    if (logisticsRoadRoute?.ok) { routePatch.routeDistanceKmOverride = logisticsRoadRoute.distanceKm; routePatch.routeDurationMinutesOverride = logisticsRoadRoute.durationMinutes; }
    const providers = await listLogisticsProviders();
    if (body.logisticsProviderId) {
      const provider = providers.find((p:any)=>p.id===body.logisticsProviderId);
      if (provider) { const vehicleCost = estimateProviderVehicleCost(provider, { pickup: logisticsPickup, drop: logisticsDrop, weightMt: Number(pricing.qtyInKg || 0) / 1000 || 1, product: body.product, paymentResponsibility: logisticsPaymentResponsibility as any, date: body.logisticsScheduleDate, vehicleId: body.logisticsVehicleId, dispatchReadiness: body.dispatchReadiness, ...logisticsCoords, ...routePatch }); logisticsSelection = { provider, cost: vehicleCost, distanceKm: vehicleCost.distanceKm, pickupDistanceKm: vehicleCost.pickupDistanceKm }; }
    } else {
      const def = selectDefaultLogisticsProvider({ pickup: logisticsPickup, drop: logisticsDrop, weightMt: Number(pricing.qtyInKg || 0) / 1000 || 1, product: body.product, paymentResponsibility: logisticsPaymentResponsibility as any, date: body.logisticsScheduleDate, ...logisticsCoords, ...routePatch }, providers); if (def?.provider) { const vehicleCost = estimateProviderVehicleCost(def.provider, { pickup: logisticsPickup, drop: logisticsDrop, weightMt: Number(pricing.qtyInKg || 0) / 1000 || 1, product: body.product, paymentResponsibility: logisticsPaymentResponsibility as any, date: body.logisticsScheduleDate, vehicleId: body.logisticsVehicleId, dispatchReadiness: body.dispatchReadiness, ...logisticsCoords, ...routePatch }); logisticsSelection = { provider: def.provider, cost: vehicleCost, distanceKm: vehicleCost.distanceKm, pickupDistanceKm: vehicleCost.pickupDistanceKm }; } else { logisticsSelection = def; }
    }
  }
  const logisticsBuyerPayable = Number(logisticsSelection?.cost?.buyerPayable || 0);
  const logisticsSellerPayable = Number(logisticsSelection?.cost?.sellerPayable || 0);
  const logisticsCost = Number(logisticsSelection?.cost?.total || 0);
  const logisticsVehicleId = logisticsSelection?.cost?.vehicleId || body.logisticsVehicleId || '';
  const logisticsVehicleName = logisticsSelection?.cost?.vehicleName || body.logisticsVehicleName || '';
  const logisticsDistanceKm = Number(logisticsSelection?.cost?.distanceKm || logisticsSelection?.distanceKm || 0);
  const logisticsEtaLabel = logisticsSelection?.cost?.eta?.label || '';
  const logisticsEtaBy = logisticsSelection?.cost?.eta?.byText || '';
  const logisticsTransitMinutes = Number(logisticsSelection?.cost?.eta?.totalMinutes || 0);
  const buyerPayableWithLogistics = pricing.buyerPayableEstimate + logisticsBuyerPayable;
  const payableNowWithLogistics = paymentMode === 'FULL_PAYMENT' ? buyerPayableWithLogistics : Math.round(buyerPayableWithLogistics * pricing.advanceRate);
  const balanceWithLogistics = Math.max(0, buyerPayableWithLogistics - payableNowWithLogistics);

  /*
    IMPORTANT:
    Do not spread raw body directly after calculated fields.
    body may already contain paymentMode, quantity, unit, status, GST values, fee values, etc.
    Those fields must be controlled by the server to avoid duplicate keys and calculation mismatch.
  */
  const {
    paymentMode: _bodyPaymentMode,
    status: _bodyStatus,
    requestedQuantity: _bodyRequestedQuantity,
    requestedUnit: _bodyRequestedUnit,
    quantity: _bodyQuantity,
    unit: _bodyUnit,
    materialValue: _bodyMaterialValue,
    materialGst: _bodyMaterialGst,
    buyerServiceFee: _bodyBuyerServiceFee,
    buyerServiceGst: _bodyBuyerServiceGst,
    sellerServiceFee: _bodySellerServiceFee,
    buyerPayableEstimate: _bodyBuyerPayableEstimate,
    buyerTotalWithGst: _bodyBuyerTotalWithGst,
    priceLockAdvance: _bodyPriceLockAdvance,
    fullPaymentAmount: _bodyFullPaymentAmount,
    paymentAmount: _bodyPaymentAmount,
    payableNow: _bodyPayableNow,
    balanceOnDispatch: _bodyBalanceOnDispatch,
    supplierNetEstimate: _bodySupplierNetEstimate,
    terms: _bodyTerms,
    gstRate: _bodyGstRate,
    gstHsn: _bodyGstHsn,
    gstChapter: _bodyGstChapter,
    gstNote: _bodyGstNote,
    logisticsProviderId: _bodyLogisticsProviderId,
    logisticsProviderName: _bodyLogisticsProviderName,
    logisticsCost: _bodyLogisticsCost,
    logisticsBuyerPayable: _bodyLogisticsBuyerPayable,
    logisticsSellerPayable: _bodyLogisticsSellerPayable,
    logisticsPaymentResponsibility: _bodyLogisticsPaymentResponsibility,
    logisticsPickup: _bodyLogisticsPickup,
    logisticsDrop: _bodyLogisticsDrop,
    logisticsScheduleDate: _bodyLogisticsScheduleDate,
    logisticsRequired: _bodyLogisticsRequired,
    logisticsVehicleId: _bodyLogisticsVehicleId,
    logisticsVehicleName: _bodyLogisticsVehicleName,
    logisticsPickupLat: _bodyLogisticsPickupLat,
    logisticsPickupLng: _bodyLogisticsPickupLng,
    logisticsDropLat: _bodyLogisticsDropLat,
    logisticsDropLng: _bodyLogisticsDropLng,
    buyerDeliveryAddress: _bodyBuyerDeliveryAddress,
    logisticsDistanceKm: _bodyLogisticsDistanceKm,
    logisticsEtaLabel: _bodyLogisticsEtaLabel,
    logisticsEtaBy: _bodyLogisticsEtaBy,
    logisticsTransitMinutes: _bodyLogisticsTransitMinutes,
    ...unsafeBody
  } = body;

  const safeBody = {
    listingId: sanitizeString(unsafeBody.listingId, 80),
    buyerName: sanitizeString(unsafeBody.buyerName, 120),
    buyerPhone: normalizeIndianMobile(unsafeBody.buyerPhone),
    buyerEmail: unsafeBody.buyerEmail ? normalizeEmail(unsafeBody.buyerEmail) : '',
    metal: sanitizeString(unsafeBody.metal, 80),
    product: sanitizeString(unsafeBody.product, 120),
    grade: sanitizeString(unsafeBody.grade, 80),
    offeredQuantity: sanitizeString(unsafeBody.offeredQuantity, 80),
    offeredUnit: sanitizeString(unsafeBody.offeredUnit, 40),
    state: sanitizeString(unsafeBody.state, 80),
    city: sanitizeString(unsafeBody.city, 80),
    area: sanitizeString(unsafeBody.area, 120),
    pincode: normalizePincode(unsafeBody.pincode),
    dispatchReadiness: sanitizeString(unsafeBody.dispatchReadiness, 80),
    readyDispatchTime: sanitizeString(unsafeBody.readyDispatchTime, 80),
    productionLeadTime: sanitizeString(unsafeBody.productionLeadTime, 80),
    deliveryEta: sanitizeString(unsafeBody.deliveryEta, 120),
  };

  const row = {
    ...safeBody,

    id: `LOCK-${Date.now()}`,
    createdAt: new Date().toISOString(),

    status:
      paymentMode === 'FULL_PAYMENT'
        ? 'FULL_PAYMENT_PROFORMA_PENDING'
        : 'PRICE_LOCK_25_PROFORMA_PENDING',

    paymentMode,

    requestedQuantity: pricing.requestedQuantity,
    requestedUnit: pricing.requestedUnit,
    quantity: pricing.requestedQuantity,
    unit: pricing.requestedUnit,

    rate: pricing.rate,
    rateBasis: pricing.rateBasis,

    materialValue: pricing.materialValue,
    gstRate: pricing.gstRate,
    gstHsn: pricing.gstHsn,
    gstChapter: pricing.gstChapter,
    gstNote: pricing.gstNote,
    materialGst: pricing.materialGst,

    buyerServiceFee: pricing.buyerServiceFee,
    buyerServiceGst: pricing.buyerServiceGst,

    // Backend/admin only. Do not show this on buyer-facing pages.
    sellerServiceFee: pricing.sellerServiceFee,
    supplierNetEstimate: pricing.supplierNetEstimate,

    buyerPayableEstimate: buyerPayableWithLogistics,
    buyerTotalWithGst: buyerPayableWithLogistics,
    priceLockAdvance: paymentMode === 'FULL_PAYMENT' ? pricing.priceLockAdvance : payableNowWithLogistics,
    fullPaymentAmount: buyerPayableWithLogistics,
    payableNow: payableNowWithLogistics,
    paymentAmount: payableNowWithLogistics,
    balanceOnDispatch: balanceWithLogistics,
    logisticsRequired,
    logisticsProviderId: logisticsSelection?.provider?.id || '',
    logisticsProviderName: logisticsSelection?.provider?.companyName || '',
    logisticsVehicleId,
    logisticsVehicleName,
    logisticsDistanceKm,
    logisticsEtaLabel,
    logisticsEtaBy,
    logisticsTransitMinutes,
    logisticsCost,
    logisticsBuyerPayable,
    logisticsSellerPayable,
    logisticsPaymentResponsibility,
    logisticsPickup: logisticsRequired ? logisticsPickup : '',
    logisticsDrop: logisticsRequired ? logisticsDrop : '',
    logisticsScheduleDate: logisticsRequired ? (body.logisticsScheduleDate || '') : '',
    logisticsPickupLat: logisticsCoords.pickupLat ? Number(logisticsCoords.pickupLat) : undefined,
    logisticsPickupLng: logisticsCoords.pickupLng ? Number(logisticsCoords.pickupLng) : undefined,
    logisticsDropLat: logisticsCoords.dropLat ? Number(logisticsCoords.dropLat) : undefined,
    logisticsDropLng: logisticsCoords.dropLng ? Number(logisticsCoords.dropLng) : undefined,
    buyerDeliveryAddress: body.buyerDeliveryAddress || body.deliveryAddress || '',

    buyerServiceFeeRate: pricing.buyerServiceFeeRate,
    sellerServiceFeeRate: pricing.sellerServiceFeeRate,
    advanceRate: pricing.advanceRate,

    buyerRemarks: sanitizeMultiline(body.buyerRemarks, 800),
    sellerRemarks: sanitizeMultiline(body.sellerRemarks, 800),

    terms:
      paymentMode === 'FULL_PAYMENT'
        ? 'Full payment is collected for priority order processing. Buyer-side service charge is waived under the full-payment offer. Dispatch is subject to Talmech verification of supplier stock, buyer profile, GST/tax invoice, documents, loading/freight conditions and commercial acceptance. If verification fails, refund or adjustment will follow final written terms.'
        : 'Price-lock advance reserves the quoted rate subject to Talmech verification of supplier stock, buyer profile, GST/tax invoice, documents, loading/freight conditions and commercial acceptance. Advance is adjusted against the final invoice. Balance is payable before dispatch or as mutually approved in final order terms.',
    logisticsRouteProvider: logisticsRoadRoute?.provider || '',
    logisticsRouteSource: logisticsRoadRoute?.source || '',
    logisticsTerms: logisticsRequired ? 'Logistics provider assignment, pickup slot, freight rate, vehicle rate/km, unloading, insurance, detention, road permit and final delivery responsibility are subject to Talmech admin confirmation and vendor contract terms.' : 'Buyer did not request Talmech logistics at checkout. Product payment is processed without freight.',
  };

  let lock;
  try {
    lock = await createPriceLock(row);
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to create price lock.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    lock,
    paymentUrl: `/price-lock/${lock.id}/payment`,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (!body.id) {
    return NextResponse.json(
      { ok: false, error: 'Missing lock id' },
      { status: 400 }
    );
  }

  const sourcePatch = body.patch && typeof body.patch === 'object' ? body.patch : body;
  const patch = {
    status: sanitizeString(sourcePatch.status, 100) || undefined,
    buyerRemarks: sanitizeMultiline(sourcePatch.buyerRemarks, 800) || undefined,
    sellerRemarks: sanitizeMultiline(sourcePatch.sellerRemarks, 800) || undefined,
    logisticsProviderName: sanitizeString(sourcePatch.logisticsProviderName, 140) || undefined,
    logisticsVehicleName: sanitizeString(sourcePatch.logisticsVehicleName, 140) || undefined,
    logisticsEtaLabel: sanitizeString(sourcePatch.logisticsEtaLabel, 120) || undefined,
    logisticsEtaBy: sanitizeString(sourcePatch.logisticsEtaBy, 120) || undefined,
  };

  let lock;
  try {
    lock = await updatePriceLock(
      sanitizeString(body.id, 80),
      Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
    );
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update price lock.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: Boolean(lock),
    lock,
  });
}
