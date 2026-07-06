# Talmech sub-product professional page patch

This patch replaces the previous generic sub-product page with a professional, reusable product intelligence page for every metal sub-product route under `/products/[product]`.

## Added / improved

- Professional product hero with stronger layout, product-specific CTAs and visual card.
- Product snapshot, pricing method, common grades, buyer use cases, supplier sources, quality checks and target buyer sections.
- Monthly marketplace intelligence section:
  - Buyer view: top 10 supplier / sourcing regions.
  - Seller view: top 10 buyer / demand regions.
  - Trader view: both supply and demand region maps.
- Intelligence data is read from local marketplace JSON data where available and falls back to a market model until enough live data is available.
- New `/api/product-intelligence` endpoint.
- Product-level metadata and JSON-LD Product schema retained for SEO.
- Mobile-responsive CSS for hero, cards, intelligence tables and CTA sections.
- `lib/routeService.ts` TypeScript fetch header error fixed.

## Files changed / added

- `app/products/[product]/page.tsx`
- `components/ProductMarketIntelligence.tsx`
- `app/api/product-intelligence/route.ts`
- `lib/productIntelligence.ts`
- `lib/routeService.ts`
- `app/globals.css`

## Notes

The monthly intelligence block is live-ready. It currently aggregates from local marketplace and requirement JSON records. In production, you can connect this same endpoint to analytics, CRM, search, and marketplace transaction tables.
