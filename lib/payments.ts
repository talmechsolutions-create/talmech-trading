import crypto from 'crypto';

type RazorpayOrderInput = {
  amount: number; // amount in rupees
  receipt: string;
  notes?: Record<string, string>;
};

type RazorpayOrderSuccess = {
  ok: true;
  order: {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
  };
};

type RazorpayOrderFailure = {
  ok: false;
  error: string;
  details?: unknown;
  configMissing?: boolean;
};

type WebhookVerifyObjectInput = {
  rawBody: string;
  signature: string | null;
  secret?: string;
};

function safeTimingCompare(expected: string, received: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

export async function createRazorpayOrder(
  input: RazorpayOrderInput
): Promise<RazorpayOrderSuccess | RazorpayOrderFailure> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    return {
      ok: false,
      configMissing: true,
      error:
        'Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local and restart the server.',
    };
  }

  if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    return {
      ok: false,
      error:
        'Invalid Razorpay Key ID format. It should start with rzp_test_ or rzp_live_.',
    };
  }

  const amountInRupees = Number(input.amount || 0);

  if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
    return {
      ok: false,
      error: 'Invalid Razorpay order amount.',
      details: { receivedAmount: input.amount },
    };
  }

  const amountInPaise = Math.round(amountInRupees * 100);

  if (amountInPaise < 100) {
    return {
      ok: false,
      error: 'Razorpay amount must be at least INR 1.',
      details: { amountInRupees, amountInPaise },
    };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: String(input.receipt || `receipt_${Date.now()}`).slice(0, 40),
        notes: input.notes || {},
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('RAZORPAY ORDER CREATE FAILED:', {
        status: response.status,
        amountInRupees,
        amountInPaise,
        response: data,
      });

      return {
        ok: false,
        error:
          data?.error?.description ||
          data?.error?.reason ||
          data?.message ||
          `Razorpay order creation failed with status ${response.status}.`,
        details: data,
      };
    }

    return {
      ok: true,
      order: data,
    };
  } catch (error) {
    console.error('RAZORPAY ORDER CREATE ERROR:', error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to connect to Razorpay order API.',
    };
  }
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keySecret) {
    console.error('RAZORPAY VERIFY FAILED: Missing RAZORPAY_KEY_SECRET');
    return false;
  }

  if (!orderId || !paymentId || !signature) {
    console.error('RAZORPAY VERIFY FAILED: Missing verification fields', {
      hasOrderId: Boolean(orderId),
      hasPaymentId: Boolean(paymentId),
      hasSignature: Boolean(signature),
    });
    return false;
  }

  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  return safeTimingCompare(expectedSignature, signature);
}

export function verifyRazorpayWebhookSignature(
  input: WebhookVerifyObjectInput
): boolean;

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret?: string
): boolean;

export function verifyRazorpayWebhookSignature(
  rawBodyOrInput: string | WebhookVerifyObjectInput,
  signatureArg?: string | null,
  secretArg?: string
): boolean {
  const rawBody =
    typeof rawBodyOrInput === 'string'
      ? rawBodyOrInput
      : rawBodyOrInput.rawBody;

  const signature =
    typeof rawBodyOrInput === 'string'
      ? signatureArg
      : rawBodyOrInput.signature;

  const secret =
    typeof rawBodyOrInput === 'string'
      ? secretArg
      : rawBodyOrInput.secret;

  const webhookSecret = (secret || process.env.RAZORPAY_WEBHOOK_SECRET)?.trim();

  if (!webhookSecret) {
    console.error('RAZORPAY WEBHOOK VERIFY FAILED: Missing RAZORPAY_WEBHOOK_SECRET');
    return false;
  }

  if (!rawBody || !signature) {
    console.error('RAZORPAY WEBHOOK VERIFY FAILED: Missing raw body or signature', {
      hasRawBody: Boolean(rawBody),
      hasSignature: Boolean(signature),
    });
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return safeTimingCompare(expectedSignature, signature);
}
