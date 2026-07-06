# Talmech SEO, Marketing, Admin Security and Razorpay Security Patch

## Added

- New protected admin module: `/seo-tracker`
- SEO Tracker dashboard with:
  - public route/page scan
  - keyword themes
  - local/state/regional SEO recommendations
  - buyer/seller/trader marketing segmentation
  - API connectivity checklist
  - campaign planning board
  - tracked marketing events table
- Admin dashboard link: **SEO & Marketing Tracker**
- Marketing event capture endpoint: `/api/marketing-events`
- Campaign storage endpoint: `/api/marketing-campaigns`
- SEO audit endpoint: `/api/seo-audit`
- Optional GA4 script integration using `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Optional Meta Pixel integration using `NEXT_PUBLIC_META_PIXEL_ID`

## Security hardening

- Admin session token now includes timestamp, nonce and username signed with HMAC.
- Admin API compares credentials using constant-time comparison.
- Admin login has temporary lockout after failed attempts.
- Admin session cookie uses HttpOnly + SameSite strict.
- Middleware protects `/seo-tracker` and marketing/SEO admin APIs.
- Additional browser security headers added.

## Razorpay security

- Razorpay checkout signature comparison uses constant-time comparison.
- Added `/api/razorpay/webhook` with Razorpay webhook signature verification.
- Add `RAZORPAY_WEBHOOK_SECRET` in `.env.local` before enabling webhooks in Razorpay dashboard.

## Required API keys for live marketing/SEO

Minimum recommended:

1. Google Search Console API credentials
2. Google Analytics 4 Data API credentials
3. SERPAPI_KEY or DataForSEO credentials
4. Google Ads API credentials, if you run Google ads
5. Meta Marketing API + Pixel credentials, if you run Facebook/Instagram ads
6. LinkedIn Marketing API credentials, if you run B2B campaigns
7. Razorpay webhook secret
8. Cloudinary credentials for production image/CDN handling
9. OpenRouteService API key for logistics road routing

## Important

The old admin password and OpenRouteService key were visible in screenshots. Treat them as compromised. Regenerate API keys and change the admin password before production use.
