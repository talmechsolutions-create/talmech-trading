# Talmech Advanced Search + Pin-to-Pin Logistics Patch

Replace the files in this ZIP into the same paths in your project.

## Main fixes

1. Marketplace search no longer hides relevant products only because seller is outside buyer city.
2. Results are ranked local-first: exact city → same state → all India relevant stock.
3. Search now checks product, grade, metal, city, PIN, technical text, seller/trader data and raw listing details.
4. Search supports keyword/phrase matching and common aliases such as MS plate, steel plate, scrap, turning, copper, aluminium, etc.
5. Seller listing form now captures exact pickup pin/gate using a pin picker, GPS or Google Maps link.
6. Buyer logistics checkout now captures exact delivery/unloading pin using a pin picker, GPS or Google Maps link.
7. Logistics ETA and freight now use pin-to-pin coordinates when available, falling back to city-to-city coordinates.
8. Vehicle options still use admin-controlled pricing only; buyer cannot edit vehicle rate/km.
9. Price lock stores pickup/drop coordinates for logistics/invoice/admin review.

## Important deployment step

Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Note

Without a paid maps routing API, the module uses coordinate-to-coordinate route estimate based on Indian industrial city coordinates / selected pins. For exact commercial-grade road distance with toll/traffic, connect Google Distance Matrix, MapmyIndia, Ola Maps or Here Maps later. This patch already stores pickup/drop pins so the integration is ready.
