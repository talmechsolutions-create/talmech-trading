# Talmech Trading

Public metal marketplace + protected internal admin/CRM system.

## What is new in this build

- Public admin button removed from website navigation.
- Buyer/supplier/contact lead data remains inside protected admin routes only.
- Marketplace listing cards are clickable and open a professional product/detail modal.
- Metal category/product forms are clickable and open detailed product pages.
- Public requirement/sell form requires at least two image/document references.
- Public users receive an email confirmation when a requirement is posted.
- If email API is not configured, confirmations are queued into `data/email-outbox.json`.
- Live WhatsApp/contact support added with +91 7389642874.
- Marketplace includes a live rate board with timestamps, refresh button and location estimate.
- Public SEO copy has been cleaned; no admin/SEO wording is shown to users.
- UI/UX upgraded with stronger marketplace cards, product visuals, modals and mobile responsiveness.

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Protected admin portal is still available directly:

```text
http://localhost:3000/dashboard
```

Admin credentials are set in `.env.example`. Create `.env.local` for real usage.

## Email confirmation

Add these values to `.env.local` if you want real email delivery through Resend:

```env
RESEND_API_KEY=""
NOTIFICATION_FROM_EMAIL="Talmech Trading <onboarding@resend.dev>"
ADMIN_NOTIFICATION_EMAIL="your_admin_email@example.com"
```

Without `RESEND_API_KEY`, emails are saved into:

```text
data/email-outbox.json
```

## Live prices

Add either API key to `.env.local`:

```env
METALS_DEV_API_KEY=""
METALPRICE_API_KEY=""
```

Rows marked `LIVE` are provider-backed base rates only. `FALLBACK_ESTIMATE` and `MANUAL_QUOTE_REQUIRED` rows, including steel, brass, iron, scrap and product-wise local rates, must be verified with suppliers before final booking.

## WhatsApp Assisted Upload Setup

Phase 1 uses `/whatsapp-upload` with a `wa.me` prefilled WhatsApp message and a protected admin review queue at `/admin/whatsapp-uploads`. Public users do not need to sign in. Submissions stay `Pending Review` and Talmech manually verifies product details, photos, documents, pricing and availability before any listing or RFQ conversion.

Add these optional placeholders to `.env.local` when preparing later WhatsApp integrations:

```env
NEXT_PUBLIC_TALMECH_WHATSAPP_NUMBER=917389642874
WHATSAPP_PROVIDER=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

Phase 2 can connect a WhatsApp Business API webhook through `/api/whatsapp/webhook-placeholder` after provider verification is designed. Phase 3 can parse incoming WhatsApp messages and media automatically. Phase 1 does not store heavy images, documents or base64 media in the project; users attach those files directly in WhatsApp chat.

## Production readiness notes

Set strong production secrets before deployment:

```env
ADMIN_USERNAME=""
ADMIN_PASSWORD=""
ADMIN_SESSION_SECRET=""
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
OTP_PROVIDER_ENDPOINT=""
OTP_PROVIDER_API_KEY=""
OTP_HASH_SECRET=""
DATABASE_URL=""
```

OTP delivery uses the server API routes under `/api/auth/request-otp` and `/api/auth/verify-otp`. Development may return a visible OTP for local testing only; production requires a configured provider.

Razorpay payments are created from server-side price-lock amounts. Production order creation fails if Razorpay keys are missing.

Local JSON fallback files under `data/*.json` are ignored by git. To reset local development data only:

```bash
npm run clean:local-data
```
Deployment trigger update from Talmech account.
