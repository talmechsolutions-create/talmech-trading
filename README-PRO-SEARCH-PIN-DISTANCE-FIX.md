# Talmech professional search + pin logistics correction

## Main fixes

1. Product search is now strict and professional.
   - Searching `Turning scrap Fe 500D` will not show unrelated TMT bars, pipes or plates only because they share `Fe 500D` or `Steel`.
   - Local/nearby distance affects ranking only after product relevance is confirmed.
   - Search order is: exact/close product match → same city → same state → all-India relevant stock.

2. Fake map click coordinates removed.
   - The old visual grid could create wrong global coordinates, for example negative latitude/longitude or non-India coordinates.
   - The new pin picker uses Google Maps link/GPS/manual lat-lng only and validates India bounds.
   - Invalid coordinates are ignored by logistics calculation.

3. Freight distance is safer.
   - Pin-to-pin distance is used only when both buyer and seller pins are valid India coordinates.
   - Otherwise the system falls back to seller city → buyer city distance.
   - Same-city ready-stock uses a practical local route minimum instead of showing 0 km.

## Optional API needed for 100% live road distance

For exact door-to-door road distance, traffic, tolls and route time, connect one of these APIs later:

- Google Maps Distance Matrix API / Routes API
- MapmyIndia Route Matrix API
- Ola Maps Routes API
- HERE Routing API

This patch prepares the data model and UI for exact pins. Without a paid maps routing API, the app uses validated pin/city distance estimates, not live road navigation distance.

## Files changed

- components/PublicMarketplace.tsx
- components/RequirementForm.tsx
- components/LocationPinPicker.tsx
- lib/marketSearch.ts
- lib/logistics.ts
- app/globals.css
- app/api/logistics/route.ts
- app/api/price-locks/route.ts
- lib/proDb.ts
- lib/marketplaceStore.ts
- prisma/schema.prisma

Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```
