# Smart Logistics Checkout Patch

This patch fixes the marketplace ETA and checkout logistics flow.

## Added / fixed

1. Ready-stock ETA logic
   - If seller listing is `READY_STOCK`, ETA is calculated from seller pickup city to buyer delivery city.
   - Formula: road transit time + 6 hour pickup/loading/admin buffer.
   - Example: 60 km route at approx. 42 km/h = about 1 hr 26 min road time + 6 hr buffer = about 7 hr 26 min.
   - UI now shows `Delivery in ...` and `Get your product by ...`.

2. Made/procured listings
   - If seller needs preparation/procurement, the website keeps normal day-based ETA such as `3 + 1 days`.
   - It does not show same-day ETA for non-ready stock.

3. Buyer checkout logistics option
   - Buyer gets `Need Talmech logistics?` option inside the listing checkout modal.
   - If buyer selects No, normal product checkout continues.
   - If buyer selects Yes, buyer selects destination and system calculates vehicle/freight options.

4. Vehicle and provider calculation
   - Vehicles are selected by product, quantity/weight, and capacity.
   - Logistics provider matching checks seller pickup city, buyer destination city, capacity, availability, and service coverage.
   - Rates are calculated server-side from admin-controlled vendor pricing: rate/km, minimum freight, loading, rate/MT, insurance, fuel surcharge and GST.

5. Checkout/invoice integration
   - Logistics cost is added only when buyer chooses logistics.
   - Payment page shows logistics vehicle, route, provider, ETA, total freight, and buyer payable freight.
   - Invoice email/payment receipt includes logistics vehicle, route, cost, buyer payable and delivery ETA.

## Files changed

- `components/PublicMarketplace.tsx`
- `lib/logistics.ts`
- `app/api/logistics/route.ts`
- `app/api/price-locks/route.ts`
- `app/price-lock/[id]/payment/payment-client.tsx`
- `app/api/razorpay/verify/route.ts`
- `lib/proDb.ts`
- `prisma/schema.prisma`
- `app/globals.css`

## After replacing files

Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```
