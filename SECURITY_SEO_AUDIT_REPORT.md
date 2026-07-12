# Talmech Trading Security and SEO Hardening Report

## Fixed in this pass

- Added live-project verification with `npm run verify:project`.
- Added secret/data preflight with `npm run security:preflight`.
- Added clean audit archive creation with `npm run zip:audit`.
- Removed tracked `data/*.json` files and ZIP archives from Git tracking while keeping local files on disk.
- Hardened `.gitignore` for nested data JSON, audit ZIPs, private key files, generated output, and local secrets.
- Added central helpers under `lib/security/` for rate limiting, CSRF token handling, security headers, audit logging, input sanitization, and structured API responses.
- Added optional Upstash-backed rate limiting with in-memory fallback.
- Added rate limits to admin login/session, OTP, admin-assisted login, public lead/requirement/upload/registration, price-lock, Razorpay order, logistics, supplier search, strategy advisor, small-deal advisor, market signals, bookings, invoices, and marketing event writes.
- Added optional admin MFA behind `ADMIN_MFA_ENABLED=true`.
- Added admin audit logging for login success/failure, MFA events, logout, account/listing creation, email resend, support ticket updates, and payout create/update.
- Strengthened middleware security headers with CSP, HSTS in production, frame/object blocking, nosniff, referrer policy, permissions policy, and private route noindex headers.
- Added same-origin protection for protected mutating admin API requests while leaving external webhooks outside that rule.
- Added central SEO config in `lib/seo/siteSeoConfig.ts`.
- Updated robots and sitemap to use a public/private route policy.
- Added `/llms.txt` for AI crawler context without exposing private/admin/API routes.

## Required environment variables

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `CLIENT_SESSION_SECRET`
- `ADMIN_MFA_ENABLED`
- `ADMIN_MFA_EMAIL`
- `RATE_LIMIT_PROVIDER`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `DATABASE_POSTGRES_URL` or `DATABASE_URL` or `DATABASE_PRISMA_DATABASE_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `OTP_PROVIDER_ENDPOINT`
- `OTP_PROVIDER_API_KEY`
- `OTP_HASH_SECRET`
- SMTP/Zoho email variables from `.env.example`

## Secret rotation checklist

- Rotate Vercel project tokens if `.vercel` was ever shared.
- Rotate database URLs if `.env` or `.env.local` was ever shared.
- Rotate SMTP/Zoho app password if local env files were exposed.
- Rotate Razorpay key secret and webhook secret if local env files were exposed.
- Rotate OTP provider keys and `OTP_HASH_SECRET` if local env files were exposed.
- Rotate `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `CLIENT_SESSION_SECRET` after any accidental folder sharing.

## Production test checklist

- Run `npm run verify:project`.
- Run `npm run security:preflight`.
- Run `npx prisma generate`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Confirm Vercel env vars are configured.
- Confirm production database is configured and JSON fallback is not used.
- Confirm no `.env`, `.env.local`, `.vercel`, `.next`, `node_modules`, ZIP, MP4, or `data/*.json` files are staged.

## Admin security checklist

- Admin login succeeds with strong credentials.
- Failed admin login triggers lockout/rate limit.
- Admin MFA challenge is required only when `ADMIN_MFA_ENABLED=true`.
- Admin logout clears the session cookie.
- Admin create account/listing writes audit logs.
- Resend email and support ticket updates write audit logs.
- Admin payout create/update writes audit logs.
- Protected admin APIs reject unauthenticated requests with structured JSON.

## Client/account checklist

- Client login still sets the server-side client session cookie.
- Account APIs only return data for the signed-in client.
- Client listings, requirements, profile, password, and tickets continue to verify server-side session ownership.
- Client sign out clears the client session cookie.

## Bot and rate-limit checklist

- Public lead form is rate limited.
- WhatsApp upload is rate limited.
- User registration is rate limited.
- OTP request/verify are rate limited by IP and contact.
- Price lock and Razorpay create-order are rate limited.
- AI/provider endpoints are rate limited.
- Turnstile remains optional and activates only when `TURNSTILE_SECRET_KEY` is configured.

## SEO checklist

- Public routes are allowed in robots.
- Admin/account/API/internal routes are disallowed and noindexed.
- Sitemap contains public routes only.
- `/manpower-services`, marketplace, metals, products, logistics, TMIS, and manufacturing intelligence routes are included.
- Organization and WebSite structured data are present.
- No fake review/rating schema was added.
- `/llms.txt` summarizes public site purpose and excludes private/admin/API surfaces.

## Manual functional test checklist

- Admin login.
- Failed admin login lockout.
- Admin logout.
- Admin create account/listing.
- Client login.
- Client listing access only own data.
- Support ticket client/admin flow.
- Public lead form.
- WhatsApp upload.
- Razorpay order/payment flow.
- Sitemap and robots.
- Mobile header/menu.
- Clean audit ZIP opens and excludes ignored/generated/secret files.
