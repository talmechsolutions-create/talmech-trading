Talmech Trading v9 payment clarity patch

Purpose:
- Make buyer payment screen buyer-facing only.
- Hide supplier-side service charge from public buyer invoice/payment pages.
- Keep supplier settlement/service charge inside admin/backend only.
- Add indicative GST calculation for metal/material and Talmech buyer service charge.
- Improve compliance wording: final HSN/GST must be verified from supplier tax invoice and statutory applicability before dispatch.

Files changed:
- lib/pricing.ts
- components/PublicMarketplace.tsx
- app/api/price-locks/route.ts
- app/price-lock/[id]/payment/payment-client.tsx
- app/price-lock/[id]/invoice/page.tsx
- lib/proDb.ts
- prisma/schema.prisma
- app/globals.css

Important GST note:
Most industrial metal categories used here are estimated at 18% GST for buyer understanding, including common steel, copper/brass, aluminium, zinc, nickel and lead product categories. Final GST/HSN must be verified against the actual supplier tax invoice, product form, state supply and current law before dispatch.

After replacing files:
1. npm install
2. npm run dev

If using Prisma/PostgreSQL:
1. npm run db:generate
2. npm run db:push

Razorpay keys remain server-side only:
RAZORPAY_KEY_ID="rzp_test_or_live_key_id"
RAZORPAY_KEY_SECRET="your_secret_key_here"

Never expose Razorpay secret in NEXT_PUBLIC variables.
