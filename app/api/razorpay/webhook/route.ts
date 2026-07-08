import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/payments';
import { createPayment } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
    });

    if (!isValid) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid Razorpay webhook signature.',
        },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventName = String(event?.event || '');

    const paymentPayload = event?.payload?.payment?.entity || null;
    const orderPayload = event?.payload?.order?.entity || null;
    const paymentEntity = paymentPayload || orderPayload || null;

    if (!paymentEntity) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: 'No payment/order entity found.',
        event: eventName,
      });
    }

    const notes = paymentEntity?.notes || {};
    const priceLockId =
      notes?.priceLockId ||
      notes?.lockId ||
      notes?.price_lock_id ||
      paymentEntity?.notes?.priceLockId ||
      '';

    if (
      eventName === 'payment.captured' ||
      eventName === 'order.paid' ||
      eventName === 'payment.authorized'
    ) {
      await createPayment({
        lockId: String(priceLockId || ''),
        providerOrderId: String(paymentPayload?.order_id || orderPayload?.id || paymentEntity?.order_id || ''),
        providerPaymentId: String(paymentPayload?.id || paymentEntity?.payment_id || paymentEntity?.id || ''),
        amount: Number(paymentEntity?.amount || 0) / 100,
        status:
          eventName === 'payment.captured' || eventName === 'order.paid'
            ? 'captured'
            : 'authorized',
        method: sanitizeString(paymentEntity?.method || 'razorpay', 80),
        paymentType: sanitizeString(eventName, 80),
        raw: {
          event: eventName,
          priceLockId: String(priceLockId || ''),
          providerOrderId: String(paymentPayload?.order_id || orderPayload?.id || paymentEntity?.order_id || ''),
          providerPaymentId: String(paymentPayload?.id || paymentEntity?.payment_id || paymentEntity?.id || ''),
        },
      } as any);
    }

    return NextResponse.json({
      ok: true,
      event: eventName,
    });
  } catch (error) {
    console.error('RAZORPAY WEBHOOK ERROR:', error);
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });

    return NextResponse.json(
      {
        ok: false,
        error: 'Razorpay webhook processing failed.',
      },
      { status: 500 }
    );
  }
}
