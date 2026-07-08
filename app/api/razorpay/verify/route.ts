import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/payments';
import {
  createInvoice,
  createPayment,
  findPriceLock,
  updatePriceLock,
} from '@/lib/proDb';
import { sendOrQueueEmail } from '@/lib/email';
import { publicStorageError } from '@/lib/storageMode';
import {
  formatInr,
  commissionLabel,
  invoiceSerial,
  calculateGstBreakup,
} from '@/lib/pricing';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function getNormalizedPaymentMode(body: any, lock: any) {
  const rawPaymentMode =
    body?.paymentMode ||
    body?.payment_mode ||
    body?.paymentType ||
    body?.payment_type ||
    lock?.paymentMode ||
    lock?.paymentType ||
    lock?.paymentOption ||
    'PARTIAL_PRICE_LOCK';

  const normalized = String(rawPaymentMode || '')
    .trim()
    .toUpperCase();

  if (
    normalized === 'FULL_PAYMENT' ||
    normalized === 'FULL' ||
    normalized === 'FULL_PAY'
  ) {
    return 'FULL_PAYMENT';
  }

  return 'PARTIAL_PRICE_LOCK';
}

function invoiceHtml(lock: any, invoice: any) {
  const paymentMode = getNormalizedPaymentMode({}, lock);
  const isFull = paymentMode === 'FULL_PAYMENT';

  const paymentTitle = isFull
    ? 'Buyer full payment receipt'
    : 'Buyer price-lock advance receipt';

  const buyerServiceRate = Number(lock.buyerServiceFeeRate || 0);
  const gstRate = Number(lock.gstRate || 0.18);
  const gstPercent = Math.round(gstRate * 100);

  const materialTax = calculateGstBreakup({
    taxableValue: Number(lock.materialValue || 0),
    gstRate,
    supplierState: lock.state,
    buyerState: lock.buyerState || lock.deliveryState,
  });

  const serviceTax = calculateGstBreakup({
    taxableValue: Number(lock.buyerServiceFee || 0),
    gstRate,
    supplierState: lock.state,
    buyerState: lock.buyerState || lock.deliveryState,
  });

  const rows = [
    ['Product', `${lock.product || ''} ${lock.grade || ''}`.trim()],
    ['Required quantity', `${lock.quantity || ''} ${lock.unit || ''}`.trim()],
    ['Supplier fixed rate', `₹${lock.rate || ''} / ${lock.rateBasis || 'KG'}`],
    ['Material value', formatInr(lock.materialValue)],
    [`Indicative GST on material @ ${gstPercent}%`, formatInr(lock.materialGst)],
    [
      'GST route',
      materialTax.taxType === 'IGST'
        ? `IGST ${formatInr(materialTax.igst)}`
        : `CGST ${formatInr(materialTax.cgst)} + SGST ${formatInr(
            materialTax.sgst
          )}`,
    ],
    ...(Number(lock.logisticsCost || 0) > 0
      ? [
          ['Logistics vehicle', `${lock.logisticsVehicleName || 'Admin assigned vehicle'}`],
          [
            'Logistics route',
            `${lock.logisticsDistanceKm || '-'} km • ${
              lock.logisticsProviderName || 'Admin assigned'
            }`,
          ],
          ['Logistics cost', formatInr(lock.logisticsCost)],
          ['Logistics payable by buyer', formatInr(lock.logisticsBuyerPayable || 0)],
          [
            'Delivery ETA',
            `${lock.logisticsEtaLabel || ''} ${lock.logisticsEtaBy || ''}`.trim(),
          ],
        ]
      : []),
    [
      isFull
        ? 'Buyer service charge waived for full payment'
        : `Buyer service charge ${commissionLabel(buyerServiceRate)}`,
      formatInr(lock.buyerServiceFee),
    ],
    ...(!isFull
      ? [
          [
            'GST on buyer service charge',
            serviceTax.taxType === 'IGST'
              ? `${formatInr(serviceTax.igst)} IGST`
              : `${formatInr(serviceTax.cgst)} CGST + ${formatInr(
                  serviceTax.sgst
                )} SGST`,
          ],
        ]
      : []),
    ['Total buyer payable estimate incl. GST', formatInr(lock.buyerPayableEstimate)],
    [
      isFull ? 'Full payment received' : 'Advance paid',
      formatInr(lock.paymentAmount || lock.payableNow || lock.priceLockAdvance),
    ],
    ['Balance before dispatch', formatInr(lock.balanceOnDispatch)],
    ['Razorpay payment ID', lock.paymentId],
  ];

  return `
  <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;background:#f8fafc;padding:24px">
    <div style="max-width:780px;margin:auto;background:white;border:1px solid #dbe4ee;border-radius:18px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#081a30,#0f766e);color:white;padding:24px">
        <h2 style="margin:0">Talmech Trading</h2>
        <p style="margin:6px 0 0;color:#dbeafe">${paymentTitle}</p>
      </div>

      <div style="padding:24px">
        <p>Invoice: <b>${invoice.id}</b></p>
        <p>Order reference: <b>${lock.id}</b></p>

        <table style="border-collapse:collapse;width:100%;margin-top:16px">
          ${rows
            .map(
              ([k, v]) => `
              <tr>
                <td style="border:1px solid #dbe4ee;padding:10px;background:#f8fafc;font-weight:700">${k}</td>
                <td style="border:1px solid #dbe4ee;padding:10px;text-align:right">${v}</td>
              </tr>`
            )
            .join('')}
        </table>

        <div style="margin-top:18px;padding:14px;border:1px solid #fdba74;background:#fff7ed;border-radius:12px;color:#7c2d12">
          <b>Important terms</b>
          <p style="margin:8px 0 0">${lock.terms || ''}</p>
          <p style="margin:8px 0 0">
            GST/HSN, freight, loading, unloading, insurance and statutory charges are subject to final supplier tax invoice and Talmech verification.
          </p>
        </div>

        <p style="margin-top:18px">
          <b>Talmech Trading</b><br/>
          Support: +91 7389642874
        </p>
      </div>
    </div>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      lockId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!lockId) {
      return NextResponse.json(
        { ok: false, error: 'Missing lockId.' },
        { status: 400 }
      );
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing Razorpay verification fields. Payment may be captured at Razorpay, but verification response was incomplete.',
          received: {
            hasOrderId: Boolean(razorpay_order_id),
            hasPaymentId: Boolean(razorpay_payment_id),
            hasSignature: Boolean(razorpay_signature),
          },
        },
        { status: 400 }
      );
    }

    const lock = await findPriceLock(lockId);

    if (!lock) {
      return NextResponse.json(
        { ok: false, error: 'Payment record not found.' },
        { status: 404 }
      );
    }

    const paymentMode = getNormalizedPaymentMode(body, lock);
    const isFull = paymentMode === 'FULL_PAYMENT';

    if (lock.paymentOrderId && String(lock.paymentOrderId) !== String(razorpay_order_id)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Razorpay order mismatch. Please refresh the payment page and contact Talmech support if money was debited.',
        },
        { status: 409 }
      );
    }

    if (lock.paymentId && String(lock.paymentId) === String(razorpay_payment_id) && lock.invoiceId) {
      return NextResponse.json({
        ok: true,
        lock,
        invoice: null,
        invoiceUrl: `/price-lock/${lock.id}/invoice`,
        idempotent: true,
        message: 'Payment was already verified for this price-lock.',
      });
    }

    if (lock.paymentId && String(lock.paymentId) !== String(razorpay_payment_id)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'This price-lock already has a different recorded payment. Please contact Talmech support.',
        },
        { status: 409 }
      );
    }

    /*
      IMPORTANT:
      Signature must be verified with the exact razorpay_order_id returned
      by Razorpay Checkout, not an old/stale stored order id.
    */
    const valid = verifyRazorpaySignature({
      orderId: String(razorpay_order_id),
      paymentId: String(razorpay_payment_id),
      signature: String(razorpay_signature),
    });

    if (!valid) {
      console.error('RAZORPAY SIGNATURE VERIFICATION FAILED:', {
        lockId,
        storedOrderId: lock.paymentOrderId,
        receivedOrderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        hasSecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            'Payment was captured by Razorpay, but server signature verification failed. Please contact Talmech support before retrying.',
          debug:
            process.env.NODE_ENV === 'development'
              ? {
                  storedOrderId: lock.paymentOrderId,
                  receivedOrderId: razorpay_order_id,
                  paymentId: razorpay_payment_id,
                  hasSecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
                }
              : undefined,
        },
        { status: 400 }
      );
    }

    const invoiceId = invoiceSerial('TT');

    const paidAmount = Number(lock.paymentAmount || lock.payableNow || lock.priceLockAdvance || 0);

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid paid amount after Razorpay verification.',
          receivedAmount: paidAmount,
        },
        { status: 400 }
      );
    }

    const newStatus = isFull
      ? 'FULL_PAYMENT_PAID_ADMIN_VERIFICATION_PENDING'
      : 'PRICE_LOCK_ADVANCE_PAID_ADMIN_VERIFICATION_PENDING';

    const updated = await updatePriceLock(lock.id, {
      status: newStatus,
      paymentOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paidAt: new Date().toISOString(),
      invoiceId,
      paymentAmount: paidAmount,
      paymentMode,
    });

    const invoice = await createInvoice({
      id: invoiceId,
      status: isFull
        ? 'Buyer full payment received - admin verification pending'
        : 'Buyer price-lock advance paid - admin verification pending',
      lockId: lock.id,
      amount: paidAmount,
      gstAmount: isFull ? Number(lock.materialGst || 0) : 0,
      total: paidAmount,
      customer: {
        name: lock.buyerName,
        phone: lock.buyerPhone,
        email: lock.buyerEmail,
      },
      items: [
        {
          name: `${isFull ? 'Full payment' : 'Price-lock advance'} for ${
            lock.product || ''
          } ${lock.grade || ''}`.trim(),
          amount: paidAmount,
        },
      ],
      terms: lock.terms,
      logisticsRequired: lock.logisticsRequired,
      logisticsProviderId: lock.logisticsProviderId,
      logisticsProviderName: lock.logisticsProviderName,
      logisticsVehicleId: lock.logisticsVehicleId,
      logisticsVehicleName: lock.logisticsVehicleName,
      logisticsDistanceKm: lock.logisticsDistanceKm,
      logisticsEtaLabel: lock.logisticsEtaLabel,
      logisticsEtaBy: lock.logisticsEtaBy,
      logisticsTransitMinutes: lock.logisticsTransitMinutes,
      logisticsCost: lock.logisticsCost,
      logisticsBuyerPayable: lock.logisticsBuyerPayable,
      logisticsSellerPayable: lock.logisticsSellerPayable,
      logisticsPaymentResponsibility: lock.logisticsPaymentResponsibility,
      logisticsPickup: lock.logisticsPickup,
      logisticsDrop: lock.logisticsDrop,
      logisticsScheduleDate: lock.logisticsScheduleDate,
      paymentMode,
      raw: {
        lock: updated,
        razorpay: {
          razorpay_order_id,
          razorpay_payment_id,
        },
      },
    } as any);

    await createPayment({
      id: `PAY-${Date.now()}`,
      status: 'CAPTURED_AND_VERIFIED',
      provider: 'razorpay',
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
      method: sanitizeString(body.method || 'razorpay_checkout', 80),
      paymentType: paymentMode,
      amount: paidAmount,
      currency: 'INR',
      lockId: lock.id,
      priceLockId: lock.id,
      invoiceId: invoice.id,
      buyerName: lock.buyerName,
      buyerPhone: lock.buyerPhone,
      buyerEmail: lock.buyerEmail,
      paymentMode,
      raw: {
        razorpay_order_id: String(razorpay_order_id),
        razorpay_payment_id: String(razorpay_payment_id),
        method: sanitizeString(body.method || 'razorpay_checkout', 80),
      },
    } as any);

    const emailTo = lock.buyerEmail || lock.email;

    if (emailTo) {
      await sendOrQueueEmail({
        to: emailTo,
        subject: `Talmech Trading invoice ${invoice.id}`,
        html: invoiceHtml(
          {
            ...lock,
            ...updated,
            paymentMode,
            paymentOrderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
          },
          invoice
        ),
        leadId: lock.id,
      });
    }

    return NextResponse.json({
      ok: true,
      lock: updated,
      invoice,
      invoiceUrl: `/price-lock/${lock.id}/invoice`,
      message:
        'Payment verified successfully. Invoice generated and email sent or queued.',
    });
  } catch (error) {
    console.error('RAZORPAY VERIFY ROUTE ERROR:', error);
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });

    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to verify Razorpay payment.',
      },
      { status: 500 }
    );
  }
}
