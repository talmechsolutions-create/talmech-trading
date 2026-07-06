# Payment Tracker, Payout Sender and Admin Security Patch

Added protected admin module: `/admin-payments`.

## Features
- Tracks verified Razorpay buyer payments from price-lock and full-payment flows.
- Separates partial/25% price-lock payments from full payments.
- Shows buyer payable, amount received, balance pending, logistics cost and seller net estimate.
- Creates seller/supplier payout vouchers after payment verification.
- Creates logistics vendor payout vouchers after logistics cost is confirmed.
- Keeps payout status lifecycle: ready, initiated, paid, cancelled.
- Creates internal payout voucher invoices for accounting review.
- Adds CSV export from `/api/admin-payments?format=csv`.
- Admin API/page is protected by signed HttpOnly session cookie middleware.

## Security notes
- Change exposed admin username/password before live deployment.
- Use a long `ADMIN_SESSION_SECRET` of at least 32 characters.
- Use Razorpay webhook signature verification with `RAZORPAY_WEBHOOK_SECRET`.
- Payout sender records payout instructions/vouchers. Real bank transfer/RazorpayX payout requires a separate payout banking integration.

## After applying
Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm run dev
```
