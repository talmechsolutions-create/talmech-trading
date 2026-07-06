Talmech V10 focused fix

This patch fixes:
1. Next.js build error in app/api/price-locks/route.ts caused by duplicate paymentMode key.
2. Buyer full-payment special offer: buyer service charge is waived when paymentMode = FULL_PAYMENT.
3. Buyer payment/invoice pages no longer show seller-side service fee or seller settlement data.
4. Buyer invoice and email show buyer-only payment details, GST estimate and terms.
5. MarketRateBoard fetch failure no longer crashes the page; it falls back to regional estimates.

Apply steps:
1. Extract this ZIP.
2. Open the extracted project folder.
3. Copy everything inside it.
4. Paste into your project root:
   C:\new_project\talmech-trading-public-marketplace-final\talmech-trading-marketplace
5. Replace files.
6. Run:
   npm run build
   npm run dev

Razorpay keys stay only in .env.local:
RAZORPAY_KEY_ID="rzp_test_or_live_key_id"
RAZORPAY_KEY_SECRET="your_secret_key_here"

Important business logic:
- Price-lock option: Buyer pays 25% advance and pays buyer service charge 2.5% + GST on service charge.
- Full-payment option: Buyer service charge is waived; buyer pays material value + indicative material GST.
- Seller-side service charge remains backend/admin/seller-settlement only and is not shown in buyer-facing screens.
