import { NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/payments';
import { findPriceLock, updatePriceLock } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const lockId = body.lockId;

    if (!lockId) {
      return NextResponse.json(
        { ok: false, error: 'Missing lockId' },
        { status: 400 }
      );
    }

    const lock = await findPriceLock(lockId);

    if (!lock) {
      return NextResponse.json(
        { ok: false, error: 'Payment record not found' },
        { status: 404 }
      );
    }

    const amount = Number(
      lock.paymentAmount || lock.payableNow || lock.priceLockAdvance || 0
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid payable amount',
          details: {
            paymentAmount: lock.paymentAmount,
            payableNow: lock.payableNow,
            priceLockAdvance: lock.priceLockAdvance,
          },
        },
        { status: 400 }
      );
    }

    console.log('RAZORPAY CREATE ORDER REQUEST:', {
      lockId: lock.id,
      amountInRupees: amount,
      paymentMode: lock.paymentMode,
      hasKeyId: Boolean(process.env.RAZORPAY_KEY_ID),
      hasSecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
    });

    const result = await createRazorpayOrder({
      amount,
      receipt: String(lock.id),
      notes: {
        lockId: String(lock.id),
        priceLockId: String(lock.id),
        paymentMode: String(lock.paymentMode || 'PRICE_LOCK_25'),
        product: String(lock.product || ''),
        buyerPhone: String(lock.buyerPhone || ''),
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          details: result.details || null,
          configMissing: Boolean(result.configMissing),
        },
        {
          status: result.configMissing
            ? process.env.NODE_ENV === 'production'
              ? 503
              : 200
            : 502,
        }
      );
    }

    await updatePriceLock(lock.id, {
      status:
        lock.paymentMode === 'FULL_PAYMENT'
          ? 'RAZORPAY_ORDER_CREATED_FULL_PAYMENT_PENDING'
          : 'RAZORPAY_ORDER_CREATED_PRICE_LOCK_PENDING',
      paymentOrderId: result.order.id,
      paymentAmount: amount,
    });

    return NextResponse.json({
      ok: true,
      order: result.order,
      keyId: process.env.RAZORPAY_KEY_ID || '',
    });
  } catch (error) {
    console.error('CREATE ORDER ROUTE ERROR:', error);
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });

    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to create Razorpay order',
      },
      { status: 500 }
    );
  }
}
