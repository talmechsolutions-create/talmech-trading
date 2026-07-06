# Talmech Marketing, SEO and Security Upgrade

This build keeps existing marketplace, logistics, trader, payment and admin features and adds a protected SEO + Marketing Tracker module.

## New / upgraded admin module

Protected route:

```txt
/seo-tracker
```

Added to:

```txt
/dashboard
```

The module includes:

- SEO page tracker for public routes, metal pages and sub-product pages
- API connection checklist for Search Console, GA4, SERP tools, Meta, Google Ads, LinkedIn, Cloudinary, Razorpay, Resend and OpenRouteService
- Marketing campaign planner for buyer, seller and trader acquisition
- UTM/source tracking from public website visits
- Mobile/desktop traffic tracking
- Buyer/seller/trader growth playbooks
- Recent marketing events table
- Protected admin-only access for audit and campaign APIs

## API keys to add in `.env.local`

Minimum recommended live stack:

```env
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=""
GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY=""
GOOGLE_SEARCH_CONSOLE_SITE_URL=""
GA4_PROPERTY_ID=""
GOOGLE_APPLICATION_CREDENTIALS_JSON=""
SERPAPI_KEY=""
OPENROUTESERVICE_API_KEY=""
RAZORPAY_WEBHOOK_SECRET=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
RESEND_API_KEY=""
```

Optional paid marketing stack:

```env
GOOGLE_ADS_DEVELOPER_TOKEN=""
GOOGLE_ADS_CUSTOMER_ID=""
GOOGLE_ADS_CLIENT_ID=""
GOOGLE_ADS_CLIENT_SECRET=""
GOOGLE_ADS_REFRESH_TOKEN=""
META_ACCESS_TOKEN=""
META_AD_ACCOUNT_ID=""
META_PIXEL_ID=""
LINKEDIN_ACCESS_TOKEN=""
LINKEDIN_AD_ACCOUNT_ID=""
DATAFORSEO_LOGIN=""
DATAFORSEO_PASSWORD=""
YOUTUBE_API_KEY=""
YOUTUBE_CHANNEL_ID=""
```

## Security changes

- Admin session uses signed HttpOnly SameSite=strict cookie
- Admin session token includes timestamp, nonce and username
- Login has failed-attempt lockout
- `/seo-tracker`, `/api/seo-audit`, `/api/marketing-campaigns` and admin-only marketing reports are protected
- Public marketing event POST remains open so the public website can track page views
- Admin pages and protected APIs return `X-Robots-Tag: noindex, nofollow, noarchive`
- Razorpay webhook signature verification remains server-side only

## Important credential note

This ZIP contains a placeholder `.env.local` and `.env.example`. Re-enter your real keys locally. Do not commit production secrets into Git or share screenshots containing keys/passwords.

## After extracting

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

If using Razorpay webhooks, keep this route in Razorpay dashboard:

```txt
https://yourdomain.com/api/razorpay/webhook
```
