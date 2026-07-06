# Talmech final integrated fix

This build integrates OpenRouteService server-side routing, strict marketplace search relevance, professional pin/geocoding flow, cleaned marketplace data, admin-session security cleanup, and GST-aware invoice display.

## Required production steps

1. Regenerate exposed credentials and set them in `.env.local` only.
2. Add `OPENROUTESERVICE_API_KEY` server-side only. Do not prefix it with `NEXT_PUBLIC_`.
3. Run `npm install`, `npx prisma generate`, `npx prisma db push`, `npm run build`.
4. Replace default admin credentials before deployment.

## Notes

- Public marketplace search now filters by product family first, then ranks by location.
- Enquiry clicks no longer create duplicate public marketplace listings.
- Existing duplicated CTA-generated listings were removed from `data/marketplace-listings.json`; leads remain in lead files.
- Real road distance uses OpenRouteService when valid pickup and delivery coordinates are available.
- GST/HSN remains indicative until a tax professional verifies supplier invoice, place of supply, HSN and statutory applicability.
