# Talmech Production Readiness Report

Date: 2026-07-06

## Scope Completed

- Added shared server-side validation helpers in `lib/validation.ts`.
- Added server OTP request/verify APIs:
  - `/api/auth/request-otp`
  - `/api/auth/verify-otp`
- Updated onboarding to use server-side OTP. Development may display a temporary OTP; production requires a configured provider.
- Hardened public onboarding status lookup so it returns masked status metadata only.
- Sanitized public requirement, CRM lead, marketplace listing, and price-lock write paths.
- Added explicit live-rate statuses:
  - `LIVE`
  - `FALLBACK_ESTIMATE`
  - `MANUAL_QUOTE_REQUIRED`
- Updated live-rate UI surfaces to explain that non-live rows need supplier/admin confirmation.
- Hardened Razorpay order creation and verification:
  - Production fails when keys are missing.
  - Order verification checks the stored price-lock order ID.
  - Paid amount is taken from the server-side lock, not the browser payload.
  - Duplicate payment verification returns idempotently.
  - Payment storage checks provider payment ID before creating a new row.
- Strengthened admin session handling:
  - Weak/default admin credentials are blocked in production.
  - Protected routes preserve `next` redirect after login.
- Added local JSON fallback reset script:
  - `npm run clean:local-data`
- Confirmed `.gitignore` includes local data, environment files, build output, and dependencies.

## Production Environment Required

Set these before production deployment:

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
NEXT_PUBLIC_SITE_URL=""
```

## Important Business Rules Preserved

- No new app was created.
- Existing marketplace, TMIS, product, payment, onboarding, RFQ, logistics, buyer, seller, and knowledge pages were preserved.
- TMIS draft/review content was not marked Verified or Published.
- No destructive production database writes were added.
- JSON files remain local fallback storage only.

## Manual Items Before Go-Live

- Resolve `npm audit` findings. Current audit reports a high-severity Next.js advisory and a moderate PostCSS advisory; npm suggests `npm audit fix --force`, which would move the project to Next 16.x and should be handled as a planned framework upgrade.
- Connect a real SMS/email OTP provider and confirm delivery logs.
- Configure Razorpay live keys and webhook secret.
- Confirm Razorpay webhook events in the Razorpay dashboard.
- Configure `DATABASE_URL` and run Prisma migration/deployment workflow.
- Replace local/demo seed listings with approved production records.
- Confirm legal terms, refund policy, GST/tax invoice workflow, and customer support process.
- Run a live payment test in Razorpay test mode before switching to live mode.

## Verification

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Build note: an earlier build emitted a non-blocking CSS autoprefixer warning recommending `flex-start` instead of `start`.
- `npm audit --audit-level=moderate`: failed due to Next.js/PostCSS advisories requiring a planned dependency upgrade.
