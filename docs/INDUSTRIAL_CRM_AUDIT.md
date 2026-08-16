# Industrial CRM Audit

Audit date: 2026-08-16

Scope: repository audit and architecture planning only. No runtime code, Prisma schema, migration, production behavior, dependency, or secret changes were made.

## 1. Executive Summary

Talmech Trading is a Next.js 14 App Router production application with public marketplace, admin review, website leads, WhatsApp-assisted uploads, prospect outreach, a lightweight trading CRM, TMIS draft intelligence, logistics, price locks, payments, account onboarding, and Prisma/PostgreSQL-backed persistence with JSON fallback for local development.

The existing CRM is not a company/plant master. `CrmLead` is a flat funnel table for buyer/supplier/logistics leads. `OutreachProspect` is a flat outreach-contact table. `UserRegistration` is an account/onboarding table. `PublicLead` and `MarketplaceListing` handle public requirements and listings. TMIS is currently static TypeScript seed intelligence, not database CRUD.

The new industrial manufacturer database should not be dumped into `CrmLead` or `OutreachProspect`. It needs a separate Industrial Intelligence domain that owns companies, plants, contacts, industrial processes, service opportunities, sources, verification state, imports, duplicates, and promotion links into outreach/CRM. Existing tables should be reused for promotion and operational outcomes, not as the master intelligence store.

## 2. Files Inspected

Core configuration:
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.js`
- `middleware.ts`
- `prisma/schema.prisma`
- `lib/databaseEnv.ts`
- `lib/storageMode.ts`
- `lib/proDb.ts`

Authentication, authorization, and security:
- `lib/adminSecurity.ts`
- `lib/adminSsr.ts`
- `lib/clientAuth.ts`
- `lib/adminAssistedAccounts.ts`
- `lib/otpStore.ts`
- `lib/security/adminMfa.ts`
- `lib/security/apiResponse.ts`
- `lib/security/auditLog.ts`
- `lib/security/csrf.ts`
- `lib/security/inputSanitizer.ts`
- `lib/security/rateLimit.ts`
- `lib/security/securityHeaders.ts`
- `app/api/admin-login/route.ts`
- `app/api/admin-session/route.ts`
- `app/api/auth/request-otp/route.ts`
- `app/api/auth/verify-otp/route.ts`
- `app/api/auth/admin-assisted-login/route.ts`
- `app/api/auth/activate-admin-account/route.ts`

CRM, outreach, leads, uploads, listings, supplier search, and TMIS:
- `app/crm/page.tsx`
- `components/TradingCRM.tsx`
- `app/api/crm-leads/route.ts`
- `app/admin/outreach/page.tsx`
- `components/OutreachCrm.tsx`
- `lib/outreachStore.ts`
- `lib/outreachTemplates.ts`
- `app/api/admin/outreach/*`
- `app/admin-leads/page.tsx`
- `components/AdminLeadConsole.tsx`
- `app/api/leads/route.ts`
- `app/api/public-requirements/route.ts`
- `app/api/marketplace-listings/route.ts`
- `components/AdminListingsConsole.tsx`
- `app/admin/whatsapp-uploads/page.tsx`
- `components/WhatsappUploadsAdmin.tsx`
- `lib/whatsappUploadStore.ts`
- `lib/whatsappUploadTypes.ts`
- `app/api/whatsapp-uploads/route.ts`
- `app/api/whatsapp-uploads/[submissionId]/route.ts`
- `app/api/supplier-search/route.ts`
- `app/api/local-businesses/route.ts`
- `app/admin/tmis/page.tsx`
- `components/tmis/TmisAdminDashboard.tsx`
- `data/tmis/types.ts`
- `data/tmis/seed.ts`
- `data/tmis/admin.ts`
- `data/tmis/planning.ts`

Other surfaces reviewed through file inventory or targeted references:
- `app/admin/*`
- `app/api/account/*`
- `app/api/admin/*`
- `app/api/logistics*`
- `app/api/price-locks*`
- `components/UserApprovalConsole.tsx`
- `components/SupplierManufacturerFinder.tsx`
- `components/tmis/*`
- `lib/supportTicketStore.ts`
- `lib/userStore.ts`
- `lib/marketplaceStore.ts`

## 3. Framework And Version Architecture

- Framework: Next.js `14.2.35`, React `18.3.1`, TypeScript `5.7.2`.
- Router: App Router under `app/`.
- Database client: Prisma `5.22.0` with PostgreSQL provider.
- Package lock: lockfile version 3, matching the root dependencies in `package.json`.
- Next config: `reactStrictMode: true`, `poweredByHeader: false`.
- TypeScript: strict mode enabled, module resolution `bundler`, path alias `@/*`.

Evidence:
- `package.json` scripts include `dev`, `build`, `lint`, `type-check`, `db:generate`, `db:push`, and `postinstall`.
- `prisma/schema.prisma:1-7` configures Prisma client and PostgreSQL datasource from `DATABASE_POSTGRES_URL`.
- `lib/databaseEnv.ts` maps `DATABASE_URL` and `DATABASE_PRISMA_DATABASE_URL` into `DATABASE_POSTGRES_URL` if needed.

## 4. App Router Structure

The application has public pages, protected admin pages, account pages, API route handlers, and TMIS pages in a single Next.js project.

Important route groups:
- Public marketplace/content: `/`, `/public-marketplace`, `/marketplace`, `/products`, `/materials`, `/metals`, `/quality`, `/rfq`, `/manufacturing-intelligence`, `/tmis`, `/whatsapp-upload`, `/post-requirement`.
- Client/account: `/signin`, `/activate-account`, `/account/*`.
- Admin: `/admin`, `/admin/*`, plus legacy top-level admin pages such as `/admin-leads`, `/admin-users`, `/admin-payments`, `/admin-price-locks`, `/admin-logistics`, `/admin-tmis`.
- Internal CRM: `/crm`.
- API: `/api/*` route handlers.

Risk: admin routing is split between `/admin/...` and top-level `/admin-*` pages. A future module should use `/admin/industrial-intelligence` as the primary route and add links from the existing admin home.

## 5. Existing Admin Architecture

Admin UI is a collection of server-rendered pages and client consoles:
- `/admin` links to user approvals, website leads, WhatsApp uploads, prospect outreach, marketplace listings, listing intelligence, support tickets, TMIS review, dashboard, CRM, price locks, and logistics.
- `/admin/outreach` loads prospects server-side through `loadAdminData()` and renders `OutreachCrm`.
- `/admin/listings` loads listings server-side and renders `AdminListingsConsole`.
- `/admin/tmis` renders static seed-review dashboard.
- `/admin-leads` is a client console that fetches `/api/public-requirements` and `/api/marketplace-listings`.

Evidence:
- `app/admin/page.tsx` contains the admin portal link grid.
- `app/admin/outreach/page.tsx` uses `loadAdminData('/admin/outreach', () => listOutreachProspects(), [])`.
- `app/admin/listings/page.tsx` loads `listListings(false)`.
- `components/AdminLeadConsole.tsx:5` fetches `/api/public-requirements`, `/api/marketplace-listings`, and can import a lead to `/api/crm-leads`.

## 6. Authentication Mechanism

Admin authentication:
- Cookie name: `talmech_admin_session`.
- Token format: signed HMAC token containing timestamp, nonce, username, and signature.
- Production rejects weak admin password/session secret.
- Admin login is rate-limited and may require optional email MFA.
- Middleware validates admin cookie before protected pages and APIs.

Client authentication:
- Cookie name: `talmech_client_session`.
- Signed HMAC payload with user id/email/mobile.
- Client session resolves against `UserRegistration` through `findUser()`.
- Admin-assisted accounts use password hashes stored in user raw fields and signed session cookies after login.

Evidence:
- `lib/adminSecurity.ts` defines admin username/password/secret, token creation, token verification, and in-memory failed-login tracking.
- `app/api/admin-login/route.ts` and `app/api/admin-session/route.ts` perform credential checks, rate limiting, optional MFA, audit logging, and cookie issuance.
- `middleware.ts:40` verifies admin session tokens before protected resources.
- `lib/clientAuth.ts` creates and verifies client session tokens and calls `findUser()`.
- `lib/adminAssistedAccounts.ts` uses scrypt hashes for admin-created client accounts.

## 7. Admin Authorization And RBAC

Current admin authorization is single-admin, cookie-based. There is no database-backed admin user table, role table, permission table, or per-module RBAC. Client account roles are represented by strings such as `accountType` and `roleCategory` on `UserRegistration`, and frontend local storage stores some client role state.

Evidence:
- `middleware.ts:6` lists protected page prefixes.
- `middleware.ts:71` decides which APIs are admin-protected.
- `app/api/admin/outreach/prospects/route.ts:10-11` re-checks `verifyAdminToken`.
- `components/UserAuthPanel.tsx` stores role/view values in local storage.

Implication: the Industrial Intelligence module should not assume granular roles exist. If multiple staff will verify/import/export manufacturer data, add a proper admin actor and permission model before broadening access.

## 8. Prisma Architecture

Prisma uses a single schema file with PostgreSQL. `lib/proDb.ts` exports a singleton Prisma client and wraps all major operations with `withDb(fn, fallback)`.

Storage behavior:
- If a database URL exists, Prisma is used.
- If no database URL exists and the app is not production, JSON files under `data/` are used.
- In production, write paths call `requirePersistentStorage()` and should fail if the database is missing.

Evidence:
- `lib/proDb.ts:39-46` defines `withDb`.
- `lib/storageMode.ts:42-46` blocks production writes without a database URL.
- `lib/marketplaceStore.ts` provides JSON read/write helpers.
- `lib/proDb.ts:128`, `178`, `263`, `638`, and `678` list entities with `findMany({ orderBy: { createdAt: 'desc' } })`.

Risks:
- Broad `findMany()` calls load entire tables for CRM, leads, listings, users, outreach prospects, WhatsApp uploads, logistics providers, payments, invoices, etc.
- JSON fallback shapes may diverge from Prisma rows because rich fields are often preserved in `raw`.
- No `prisma/migrations` directory was present in the file inventory, so migration state should be confirmed outside this audit before adding models.

## 9. Existing Database Model Analysis

### UserRegistration

Purpose: buyer, seller, trader, manufacturer, logistics, and admin-assisted account registration/onboarding.

Relationships: none declared.

Indexes: `status`, `accountType`, `roleCategory`, `primaryMobile`, `email`, `gstNumber`.

Unique constraints: none.

Risks:
- Duplicate protection is application-level only through `findFirst()` on mobile/email/GST.
- Many nullable business fields are packed into one broad table.
- Raw JSON carries additional account/security metadata not modeled in Prisma.
- No relation to company master, plant master, contact master, listings, support tickets, or activities.

Reuse: reuse only for accounts/users created after a company becomes a customer/supplier account. Do not use as manufacturer master.

### PublicLead

Purpose: private website requirement/lead submissions.

Relationships: optional one-to-one to `MarketplaceListing` through `MarketplaceListing.leadId`.

Indexes: `intent`, `status`, `metal`, `city`, `pincode`.

Unique constraints: none on lead itself.

Risks:
- No owner/account relationship.
- Contact data is mixed with requirement data.
- Search/filter fields are narrow and not enough for industrial intelligence.
- DELETE API can clear all leads through protected route.

Reuse: reuse for website leads and CRM promotion source only. Do not use as company/plant store.

### MarketplaceListing

Purpose: public/private marketplace listing row derived from leads, account listings, WhatsApp/manual listing flows, or demo overlays.

Relationships: optional `PublicLead`; many `PriceLock`.

Indexes: `type`, `metal`, `city`, `pincode`, `status`.

Unique constraints: `leadId` unique.

Risks:
- Owner/account/contact/admin metadata lives in `raw`.
- Public CSV endpoint currently exports `rows` rather than `publicRows`, which may expose non-public/internal raw fields if CSV is requested.
- `leadId` unique is correct for lead-derived listings but may be limiting if one lead should create multiple plant/service listings.

Reuse: reuse for published marketplace opportunities after verification. Do not store discovery database here.

### PriceLock

Purpose: transactional buyer lock/payment/logistics details for a listing.

Relationships: optional `MarketplaceListing`.

Indexes: `status`, `listingId`.

Unique constraints: none.

Risks:
- Buyer PII and logistics detail in one large row.
- No relation to account/user/customer.
- Several monetary fields are floats.

Reuse: keep separate; link only after industrial intelligence becomes a real deal or listing.

### CrmLead

Purpose: lightweight trading funnel lead with stage, type, company, contact, phone/email, location, metal/quantity/value, next action, notes.

Relationships: none.

Indexes: `leadType`, `stage`, `sourceLeadId`.

Unique constraints: none.

Risks:
- Not normalized; no contacts, activities, company ownership, plants, opportunities, assignments, or duplicate policy.
- CRM stage updates in `TradingCRM` are local React/localStorage only and are not persisted through PATCH.
- No pagination.

Reuse: reuse as the "CRM promoted" target or wrap with a new promotion relation. Do not import industrial master data directly into `CrmLead`.

### Invoice

Purpose: invoice/proforma-like financial document rows.

Relationships: none declared to lead/lock/listing.

Indexes: none.

Unique constraints: none.

Risks:
- IDs are strings but there are no uniqueness relations to transactions.
- Customer and items are JSON.
- No update timestamp.

Reuse: not relevant until CRM opportunity becomes quotation/order.

### Payment

Purpose: Razorpay/admin payment records.

Relationships: none declared.

Indexes: `status`, `lockId`, `invoiceId`, `providerPaymentId`.

Unique constraints: none.

Risks:
- Provider payment id is indexed but not unique; application checks duplicates with `findFirst()`.
- Monetary fields are floats.

Reuse: not part of industrial intelligence master; keep as transaction layer.

### AdminPayout

Purpose: admin payout/settlement records.

Relationships: none declared.

Indexes: `status`, `payoutType`, `lockId`, `logisticsProviderId`.

Unique constraints: none.

Risks:
- Payout party and bank details live in row/JSON without modeled party relation.

Reuse: not relevant until deal/order settlement.

### EmailOutbox

Purpose: queued/recorded outbound emails.

Relationships: none declared.

Indexes: none.

Unique constraints: none.

Risks:
- HTML body and recipient stored without retention policy.
- No status index for queue processing.

Reuse: can be reused for industrial outreach email attempts if retention/redaction policy is improved.

### OutreachProspect

Purpose: source-tracked prospect contact for manual email/WhatsApp outreach.

Relationships: none.

Indexes: `businessType`, `outreachStatus`, `consentStatus`, `email`, `mobile`, `whatsappNumber`, `city`, `state`.

Unique constraints: `prospectId`.

Risks:
- Company duplicate logic treats normalized company name alone as duplicate, which is unsafe for multi-plant companies.
- No company/plant/contact separation.
- List and duplicate checks scan all prospects.
- Immediate import commit; no dry-run batch.

Reuse: reuse for outbound communication after Industrial Intelligence marks a contact/outreach package as `OUTREACH_READY`.

### OutreachSuppression

Purpose: do-not-contact suppression entries by email/phone identifier.

Relationships: none declared.

Indexes: `identifierType`, `sourceProspectId`.

Unique constraints: `identifier`.

Risks:
- Good primitive, but not linked to a general contact table.
- Must be checked by future industrial outreach before promotion.

Reuse: yes, for global outreach suppression.

### AdminAction

Purpose: audit log rows for admin actions.

Relationships: none.

Indexes: none.

Unique constraints: none.

Risks:
- No indexes by action/entity/entityId/actor/createdAt.
- `raw` is accepted by helper but `logAdminAction()` stores only actor/action/entity/entityId/note, so richer redacted context is not persisted.

Reuse: extend or replace with stronger audit/event log for imports, duplicate resolution, and promotion.

### SupportTicket

Purpose: account/client support tickets.

Relationships: none declared.

Indexes: `ownerUserId`, `accountId`, `status`, `email`.

Unique constraints: none.

Risks:
- Owner/account not relationally enforced.

Reuse: not a master-data model; may be linked later to accounts/customers.

### WhatsappUpload

Purpose: WhatsApp-assisted public submission review queue.

Relationships: none declared.

Indexes: `status`, `mobile`, `email`, `accountId`, `listingId`.

Unique constraints: none.

Risks:
- Rich submission detail, account creation state, listing creation state, and timeline live in `raw`.
- Duplicate checks are manual/application-level.

Reuse: pattern can inspire import review queues, but do not reuse it for national manufacturer imports.

### AccountActivationToken

Purpose: activation token table.

Relationships: none declared.

Indexes: `accountId`, `tokenHash`, `status`.

Unique constraints: none.

Risks:
- Token hash should probably be unique if used for lookup.
- Current admin-assisted activation search appears to scan `UserRegistration` raw fields instead of this model.

Reuse: unrelated to industrial intelligence except for account onboarding.

### LogisticsProvider

Purpose: transport/vendor onboarding and service/pricing metadata.

Relationships: none.

Indexes: `status`, `city`, `state`, `contractStatus`.

Unique constraints: none.

Risks:
- Serviceability and pricing are JSON-like arrays/fields in one row.
- No duplicate uniqueness by GST/phone/email.

Reuse: reuse as the logistics-vendor layer only. Do not combine with manufacturing plant master.

## 10. Existing CRM Architecture

Current CRM data model:
- `CrmLead` is the only Prisma CRM model.
- `TradingCRM` has local starter data and localStorage backup.
- `/api/crm-leads` supports GET, CSV export, and POST create.
- No PATCH/DELETE route exists for CRM persistence.
- Stages are `New`, `Contacted`, `Quoted`, `Negotiation`, `Won`, `Lost` in the UI, but stage changes are not persisted.

Data flow:
- `/crm` -> `TradingCRM` -> GET `/api/crm-leads` -> `listCrmLeads()` -> `prisma.crmLead.findMany()`.
- Add lead -> POST `/api/crm-leads` -> sanitize/validate -> `createCrmLead()` -> `prisma.crmLead.create()`.
- Admin lead import -> `AdminLeadConsole.importToLocalCrm()` -> POST `/api/crm-leads`.

Recommended interpretation: `CrmLead` is a terminal/lightweight funnel artifact. Industrial Intelligence should promote qualified companies/opportunities to CRM only after verification and qualification.

## 11. Prospect Outreach Architecture

Current model:
- `OutreachProspect` stores prospect/contact/company-like fields in one row.
- `OutreachSuppression` stores opt-out identifiers.
- `OutreachCrm` provides manual add, bulk paste import, filters, email/WhatsApp preview, send/mark actions, opt-out, notes, and follow-up date.

Data flow:
- `/admin/outreach` -> `listOutreachProspects()` -> `OutreachCrm`.
- Add prospect -> POST `/api/admin/outreach/prospects` -> `createOutreachProspect()`.
- Bulk paste -> POST `/api/admin/outreach/import` -> `importOutreachProspects()` -> per-row `createOutreachProspect()`.
- Send email -> POST `/api/admin/outreach/send-email` -> `sendOutreachEmail()` -> `sendOrQueueEmail()` -> update prospect status.
- WhatsApp -> POST `/api/admin/outreach/mark-whatsapp` -> update last prepared/status.
- Opt-out -> POST `/api/admin/outreach/opt-out` -> `OutreachSuppression`.

Important limits:
- `findDuplicateProspect()` loads all prospects and compares email/mobile/WhatsApp/company.
- Import commits immediately. No dry-run, import batch, row staging, or rollback.
- No plant-specific contact ownership.

## 12. Website Lead Architecture

Current model:
- `/api/public-requirements` stores public marketplace requirement leads in `PublicLead`.
- It can automatically create a `MarketplaceListing` for BUY/SELL/SCRAP when allowed.
- `/api/leads` creates a `CrmLead` directly from a simpler lead form.

Data flow:
- Public form -> POST `/api/public-requirements` -> spam/captcha/rate limit -> validation -> `createLead()` -> optional `createListing(safePublicListing(savedLead))` -> email notifications.
- Admin UI -> `/admin-leads` -> `AdminLeadConsole` fetches leads/listings.
- Admin can import a lead/listing to CRM via `/api/crm-leads`.

Security notes:
- Public POST routes use rate limiting, honeypot, form-fill timing, optional Turnstile, size limits, and input validation.
- GET/DELETE `/api/public-requirements` are protected by middleware except public POST.

## 13. WhatsApp Upload Architecture

Current model:
- `WhatsappUpload` stores public WhatsApp-assisted submissions and admin review state.
- Public POST validates role, submission type, mobile/email/GST, material/product labels, quantity, location, payload size, no base64 media.
- Admin GET/PATCH are protected by middleware.
- Admin workflows can create accounts and listings from a submission through separate admin routes and helpers.

Data flow:
- Public `/whatsapp-upload` -> POST `/api/whatsapp-uploads` -> `createWhatsappUpload()`.
- Admin `/admin/whatsapp-uploads` -> GET `/api/whatsapp-uploads` -> `listWhatsappUploads()` -> table.
- Admin status update -> PATCH `/api/whatsapp-uploads/[submissionId]` -> `updateWhatsappUpload()`.
- Account/listing conversion -> admin routes -> `adminAssistedAccounts` / manual listing helpers -> `UserRegistration`, `MarketplaceListing`, email tracking, upload raw status.

Reuse: the review/status/timeline pattern is relevant, but industrial imports need a stronger `ImportBatch`/`ImportRow` design.

## 14. Supplier/Manufacturer Architecture

Current supplier search is not a persisted manufacturer master:
- `/supplier-search` uses `SupplierManufacturerFinder`.
- `/api/supplier-search` queries SerpApi Google Maps if `SERPAPI_KEY` exists and otherwise returns demo rows.
- `/api/local-businesses` is another SerpApi-backed endpoint.
- Results can be manually added into local Trading CRM/localStorage.

Risk: this is a research/search utility, not a verified database. Future Industrial Intelligence should ingest from approved imports and keep source URLs/evidence.

## 15. TMIS Architecture

TMIS is a static, draft, review-gated intelligence layer:
- Data lives in `data/tmis/*.ts`.
- Status types are limited to `Draft`, `Needs Review`, `Pending Verification`, and `Draft / Needs Review`.
- Admin pages display review queues, source rows, graph relationships, planning rows, and disabled/edit-placeholder style workflows.

Evidence:
- `data/tmis/types.ts:1-2` defines content/verification states as draft/review only.
- `components/tmis/TmisAdminDashboard.tsx` states Phase 1 read-only seed data and Phase 2B database CRUD after approval.

Reuse: reuse the governance language and review patterns. Do not store manufacturer companies/plants in static TMIS seed data.

## 16. Marketplace And Listing Architecture

Marketplace listings are separate from private leads:
- Public GET `/api/marketplace-listings` filters public/approved listings and strips selected raw owner/contact fields.
- Admin listing console patches status/visibility through the same route, protected by middleware for PATCH/DELETE.
- Demo listings are merged only in public GET.

Critical observation:
- For CSV export, `app/api/marketplace-listings/route.ts:33` exports `csv(rows, headers)` instead of `csv(publicRows, headers)`. Headers are limited, but this is still a public endpoint branch and should be corrected before adding more sensitive listing fields.

## 17. Existing Import/Export Functionality

Imports:
- Outreach bulk paste import: immediate commit, no dry-run.
- Website leads: public form to lead/listing.
- WhatsApp uploads: public submission queue, no CSV/XLSX import.
- Admin lead import to CRM: one-click POST to CRM.

Exports:
- CRM CSV via `/api/crm-leads?format=csv`.
- Public requirements CSV via `/api/public-requirements?format=csv`.
- Outreach prospects CSV via `/api/admin/outreach/prospects?format=csv`.
- Marketplace listings CSV via `/api/marketplace-listings?format=csv`.
- Client-side CSV exports in admin consoles.

Missing for industrial intelligence:
- XLSX/CSV file upload parser.
- Dry-run preview.
- Import batch and row staging tables.
- Duplicate-candidate queue.
- Admin approval/commit.
- Rollback marker.
- Formula injection defenses for export and import preview.

## 18. Existing Audit/Logging System

Current audit:
- `auditAdminAction()` logs to console and calls `logAdminAction()`.
- `logAdminAction()` writes to `AdminAction` when database connection exists.
- Redaction helper can redact `raw`, but `logAdminAction()` currently persists only actor/action/entity/entityId/note.

Risks:
- No indexes on `AdminAction`.
- No request id, ip, before/after diff, import batch id, row count, duplicate decision, or rollback state.
- If database is unavailable in local mode, audit persistence is skipped.

Reuse: use the pattern initially, but new import/duplicate/promotion workflows need stronger append-only audit events.

## 19. Duplicate Handling Today

Current duplicate mechanisms:
- `UserRegistration`: application-level duplicate by primary mobile, email, or GST in `createUserRegistration()`.
- `OutreachProspect`: duplicate by email/mobile/WhatsApp or normalized company name.
- `Payment`: application-level duplicate by provider payment id.
- `MarketplaceListing`: unique `leadId` for lead-derived listing.
- `OutreachSuppression`: unique identifier for email/phone suppression.

Gaps:
- No canonical company master.
- No official-domain duplicate match.
- No plant-level duplicate logic.
- No fuzzy matching queue.
- No manual duplicate resolution table.
- No duplicate audit decisions.

## 20. Pagination, Search, And Filter Architecture

Current pattern:
- Server helpers commonly load full tables with `findMany({ orderBy: { createdAt: 'desc' } })`.
- Frontend components filter in memory with `JSON.stringify(row).toLowerCase().includes(query)`.
- Some API list functions accept simple filters but still load all rows first.

Evidence:
- `lib/proDb.ts` lists many full-table `findMany()` calls.
- `lib/outreachStore.ts:351-357` loads all prospects and filters after normalization.
- `components/OutreachCrm.tsx` and `components/AdminLeadConsole.tsx` filter client-side.

Conclusion: a 10,000 company / 30,000 plant / 100,000 contact database requires server-side pagination, indexed filters, query limits, and cursor pagination from day one.

## 21. Security Findings

### HIGH: No granular admin RBAC

Evidence: `middleware.ts:40`, `middleware.ts:71`, `app/api/admin/outreach/prospects/route.ts:10-11`.

Risk: any authenticated admin can access all admin modules and future imports/exports. This is risky for mass PII and industrial contact data.

Recommended correction: add admin users/roles/permissions before exposing large manufacturer-contact exports or import commit controls.

### HIGH: Industrial-scale list endpoints would overload memory if modeled like current lists

Evidence: `lib/proDb.ts:128`, `178`, `263`, `638`; `lib/outreachStore.ts:351-357`.

Risk: full-table `findMany()` and client-side filtering will not scale to 100,000 contacts and large activity history.

Recommended correction: implement cursor pagination, indexed filters, hard limits, and count/aggregation endpoints.

### HIGH: Current outreach import commits without dry-run

Evidence: `app/api/admin/outreach/import/route.ts:27-38`, `lib/outreachStore.ts:564-575`.

Risk: a bad pasted/CSV import can create many wrong prospects immediately; no batch rollback or conflict review.

Recommended correction: new industrial import must use `ImportBatch` and `ImportRow` with parse/validate/normalize/dedupe preview before commit.

### HIGH: Public marketplace CSV branch should not export unfiltered listing source rows

Evidence: `app/api/marketplace-listings/route.ts:29` computes `publicRows`; `app/api/marketplace-listings/route.ts:33` exports `rows`.

Risk: currently headers are limited, but future sensitive columns could leak if CSV export stays public and uses unfiltered rows.

Recommended correction: change CSV to export `publicRows` or protect CSV behind admin auth. Also sanitize CSV formula prefixes.

### MEDIUM: CSRF token helper exists but most admin APIs rely on same-origin middleware fallback

Evidence: `lib/security/csrf.ts` defines token verification; `middleware.ts:101-124` uses origin/referer same-origin checks for mutating protected APIs.

Risk: same-origin checks are useful, but token-based enforcement is stronger and gives clearer protection for import/commit actions.

Recommended correction: require `x-csrf-token` for destructive/bulk admin operations, including import commit and duplicate merge.

### MEDIUM: Audit log is too thin for import governance

Evidence: `lib/security/auditLog.ts`, `lib/proDb.ts:667-668`, `prisma/schema.prisma:389-398`.

Risk: imports, duplicate decisions, and promotions need durable evidence, but current audit persists only small notes without indexes.

Recommended correction: add indexed audit/event tables with actor, request id, entity, entity id, before/after summary, batch id, and redacted raw context.

### MEDIUM: Duplicate checks are application-level and not race-safe

Evidence: `lib/proDb.ts:277` checks user duplicates before create; `lib/outreachStore.ts:276-277` scans all prospects; Prisma schema lacks unique constraints on email/mobile/GST for user/outreach contact fields.

Risk: concurrent imports can create duplicates. Company/plant duplicate logic cannot be enforced today.

Recommended correction: add normalized key tables and unique constraints where business rules allow exact uniqueness.

### MEDIUM: PII appears in logs and raw JSON

Evidence: `lib/adminSsr.ts` logs request/user context; `lib/security/auditLog.ts` logs admin actions; multiple models store `raw` JSON with phone/email fields.

Risk: phone/email/contact data may be retained in logs and raw snapshots longer than needed.

Recommended correction: create PII logging policy, redact raw contact values in audit logs, and set retention/export controls.

### MEDIUM: CSV formula injection is not handled

Evidence: `lib/marketplaceStore.ts` and client CSV builders escape quotes but do not prefix cells beginning with `=`, `+`, `-`, or `@`.

Risk: exported CSVs opened in spreadsheet tools can execute formulas or external references.

Recommended correction: add centralized CSV cell escaping that neutralizes spreadsheet formulas.

### MEDIUM: Public SerpApi endpoints expose search capability without strong validation

Evidence: `app/api/local-businesses/route.ts` accepts `q` and `location`; `app/api/supplier-search/route.ts` uses POST and rate limiting.

Risk: API quota abuse or broad scraping-like use if not protected/rate-limited consistently.

Recommended correction: add rate limiting to `/api/local-businesses`, normalize query length, and consider admin protection if used for bulk research.

### LOW: Weak local defaults are present but production blocks weak admin config

Evidence: `lib/adminSecurity.ts` and `middleware.ts` both define weak-default checks.

Risk: local development may normalize weak secrets; production is guarded.

Recommended correction: keep production checks, document required secrets, and avoid using admin secret as client session fallback in production.

## 22. Current Strengths

- Existing production app is a single coherent Next.js/Prisma project.
- Middleware protects key admin pages and APIs.
- Public forms include rate limiting, honeypot, timing check, optional Turnstile, validation, and payload limits.
- Production writes are guarded by persistent storage checks.
- Marketplace listings separate public row output from private lead/contact data in the normal JSON branch.
- Outreach already has consent status, opt-out suppression, source tracking, template assignment, and basic audit actions.
- TMIS has explicit draft/review governance and avoids premature verified/published claims.
- WhatsApp uploads preserve admin review before conversion.

## 23. Technical Debt

- Flat models carry multiple concepts in one table.
- Heavy use of `raw` JSON for important business state.
- No company/plant/contact master.
- No normalized activity table.
- No server-side pagination for major admin datasets.
- No full import batch/dry-run/rollback architecture.
- No role-based admin permissions.
- No durable rich audit events for high-risk admin actions.
- Client CRM state changes can remain local-only.
- Duplicate checks are mostly best-effort application logic.
- CSV export hardening is incomplete.

## 24. Critical Issues To Address Before Industrial CRM Build

1. Create a separate Industrial Intelligence domain instead of reusing `CrmLead`.
2. Add import batch, row staging, dry-run, duplicate review, approval, commit, and rollback metadata.
3. Add normalized company, plant, contact, process/capability, opportunity, source, verification, assignment, and promotion concepts.
4. Add server-side pagination/indexed filters before loading any national database.
5. Add stronger audit and admin permissions before bulk PII import/export.
6. Fix public CSV export behavior and centralize CSV formula protection.
7. Model company-vs-plant duplicates carefully so Ramkrishna Forgings Ltd can be one company while Plant I and Plant V remain separate plants.

## 25. Recommended Target Architecture

The new module should be named Industrial Intelligence, exposed at `/admin/industrial-intelligence`, and should own:

- company master
- plant master
- contact master
- process/capability master
- service opportunity records
- source/evidence records
- verification lifecycle
- qualification lifecycle
- import batches/rows
- duplicate candidates/resolution
- prospect/outreach assignment
- CRM promotion links

Existing systems remain:
- `OutreachProspect`: communication execution target.
- `CrmLead`: qualified CRM pipeline target.
- `PublicLead`: website inbound requirement source.
- `MarketplaceListing`: public/approved listing target.
- `UserRegistration`: account/customer/supplier onboarding target.
- TMIS seed data: knowledge/reference taxonomy until a DB TMIS model is approved.

## 26. Existing Models To Reuse

Reuse directly:
- `OutreachSuppression` for global do-not-contact checks.
- `EmailOutbox` if email retention/indexing is improved.
- `AdminAction` only as interim audit, with a stronger event table recommended.

Reuse as promotion/relationship targets:
- `OutreachProspect`
- `CrmLead`
- `MarketplaceListing`
- `PublicLead`
- `UserRegistration`
- `SupportTicket`
- `LogisticsProvider`

Do not reuse as industrial master:
- `CrmLead`
- `OutreachProspect`
- `PublicLead`
- `WhatsappUpload`
- `UserRegistration`

## 27. New Models Genuinely Required

Required after planning approval:
- `IndustrialCompany`
- `IndustrialPlant`
- `IndustrialContact`
- `IndustrialContactPoint` or embedded controlled contact fields
- `IndustrialCapability`
- `IndustrialProcess`
- `IndustrialServiceOpportunity`
- `IndustrialSource`
- `IndustrialVerification`
- `IndustrialTag`
- `IndustrialCompanyTag` / `IndustrialPlantTag`
- `IndustrialLifecycleEvent` or `ProspectActivity`
- `ProspectAssignment`
- `IndustrialImportBatch`
- `IndustrialImportRow`
- `DuplicateCandidate`
- `DuplicateResolution`
- `IndustrialPromotion` linking to outreach/CRM/listing/account ids

Optional but likely useful:
- `IndustrialLocation`
- `IndustrialCluster`
- `IndustrialProduct`
- `IndustrialDepartment`
- `IndustrialSourceUrl`
- `IndustrialSearchIndex`

## 28. Proposed Admin Routes

- `/admin/industrial-intelligence`
- `/admin/industrial-intelligence/companies`
- `/admin/industrial-intelligence/companies/[companyId]`
- `/admin/industrial-intelligence/plants`
- `/admin/industrial-intelligence/plants/[plantId]`
- `/admin/industrial-intelligence/contacts`
- `/admin/industrial-intelligence/opportunities`
- `/admin/industrial-intelligence/verification`
- `/admin/industrial-intelligence/duplicates`
- `/admin/industrial-intelligence/imports`
- `/admin/industrial-intelligence/imports/[batchId]`
- `/admin/industrial-intelligence/analytics`
- `/admin/industrial-intelligence/sources`
- `/admin/industrial-intelligence/settings/taxonomy`

## 29. Proposed APIs

Read/list:
- `GET /api/admin/industrial-intelligence/companies`
- `GET /api/admin/industrial-intelligence/companies/[companyId]`
- `GET /api/admin/industrial-intelligence/plants`
- `GET /api/admin/industrial-intelligence/contacts`
- `GET /api/admin/industrial-intelligence/opportunities`
- `GET /api/admin/industrial-intelligence/duplicates`
- `GET /api/admin/industrial-intelligence/imports`

Mutations:
- `POST /api/admin/industrial-intelligence/imports`
- `POST /api/admin/industrial-intelligence/imports/[batchId]/dry-run`
- `POST /api/admin/industrial-intelligence/imports/[batchId]/commit`
- `POST /api/admin/industrial-intelligence/imports/[batchId]/rollback`
- `PATCH /api/admin/industrial-intelligence/companies/[companyId]`
- `PATCH /api/admin/industrial-intelligence/plants/[plantId]`
- `PATCH /api/admin/industrial-intelligence/contacts/[contactId]`
- `POST /api/admin/industrial-intelligence/duplicates/[candidateId]/resolve`
- `POST /api/admin/industrial-intelligence/promote/outreach`
- `POST /api/admin/industrial-intelligence/promote/crm`

All list APIs must require `limit`, support cursor pagination, and enforce maximum limits.

## 30. Import Architecture

Required flow:

1. Upload CSV/XLSX.
2. Parse into rows with source file metadata.
3. Validate required fields.
4. Normalize company names, domains, phones, emails, GSTINs, locations, departments, processes, and service opportunities.
5. Create dry-run `IndustrialImportBatch` and `IndustrialImportRow` records.
6. Run duplicate detection.
7. Show preview counts: new companies, existing company updates, new plants, existing plant updates, new contacts, conflicts, invalid rows.
8. Admin reviews duplicates and conflicts.
9. Admin approves commit.
10. Commit in bounded transaction chunks.
11. Write audit events and promotion candidates.
12. Support rollback by batch where no downstream promotion has made rollback unsafe.

No production import should write master data without dry-run.

## 31. Deduplication Architecture

Match tiers:

1. GSTIN exact match when available.
2. Official domain exact match.
3. Phone exact match.
4. Email exact match.
5. Normalized company name.
6. Company + city.
7. Company + plant address.
8. Fuzzy name candidates.
9. Manual review.

Company-vs-plant rule:
- Company duplicate checks should collapse `Ltd`, `Limited`, `Pvt`, punctuation, and casing.
- Plant duplicate checks must include plant name/code/address/city. Plant I and Plant V are legitimate separate plants under the same company.

## 32. CRM Promotion Workflow

Recommended lifecycle:

`DISCOVERED -> VERIFICATION_PENDING -> VERIFIED -> QUALIFIED -> OUTREACH_READY -> CONTACTED -> ENGAGED -> CRM_PROMOTED -> OPPORTUNITY -> QUOTATION -> CUSTOMER`

Alternative terminal statuses:
- `DISQUALIFIED`
- `DUPLICATE`
- `DO_NOT_CONTACT`
- `STALE`

Mapping:
- `DISCOVERED` through `QUALIFIED`: Industrial Intelligence only.
- `OUTREACH_READY` through `CONTACTED`: create/link `OutreachProspect`.
- `ENGAGED` and `CRM_PROMOTED`: create/link `CrmLead`.
- `OPPORTUNITY`, `QUOTATION`, `CUSTOMER`: future CRM/order/account modules.

## 33. Google Sheet Ingestion Strategy

Google Sheets should remain research/staging. Talmech database should become the operational source of truth after approved import.

Recommended strategy:
- Export source Google Sheet to CSV/XLSX.
- Upload to admin import.
- Store source metadata: sheet name, tab, exported at, uploader, checksum.
- Keep original row payload in `IndustrialImportRow.raw`.
- Store source URL/reference per company/plant/contact/source.
- Never hard-code a Google Sheet dependency into runtime query paths.

## 34. Migration Strategy

Planning-only recommendation:
- Do not modify `prisma/schema.prisma` until model design is approved.
- Prepare a reviewed migration branch.
- Add new tables without touching existing tables first.
- Backfill nothing automatically.
- Add linking fields/tables to existing systems only after master import works.
- Keep feature flag off until import preview and admin read-only screens are tested.

## 35. Testing Strategy

Required tests before implementation release:
- Unit tests for normalization and duplicate keys.
- Unit tests for CSV/XLSX parser and formula-injection neutralization.
- Unit tests for lifecycle transitions.
- API tests for pagination limits and authorization.
- Import dry-run fixture tests for forging and steel sample rows.
- Duplicate tests for `Ramkrishna Forgings Ltd` vs `Ramkrishna Forgings Limited` and Plant I vs Plant V.
- Security tests for unauthorized import/commit/export.
- Load tests or script benchmarks for 10k companies, 30k plants, 100k contacts.

## 36. Deployment Strategy

- Deploy docs and schema changes separately from UI behavior.
- Add feature flag/environment gate for Industrial Intelligence admin module.
- Run `prisma generate`, `prisma validate`, type-check, build.
- Apply reviewed migrations through the existing deployment process, not `prisma db push`.
- Launch read-only dashboard first.
- Enable import dry-run next.
- Enable commit only for admin users with explicit permission.

## 37. Rollback Strategy

- Every import batch should track created/updated entity ids.
- Batch commit should be chunked and auditable.
- Rollback is allowed only before promotion to outreach/CRM/listings or customer/account creation.
- For post-promotion mistakes, prefer status-based correction and merge/supersede records over destructive deletes.
- Keep original import rows and source metadata for forensics.

## 38. Implementation Phases

1. Finalize data model and route/API contract.
2. Add migrations for new Industrial Intelligence tables.
3. Build normalization, taxonomy, and duplicate engine.
4. Build import dry-run and preview UI.
5. Build company/plant/contact read-only admin tables with pagination.
6. Build duplicate review and verification queues.
7. Build commit and audit workflow.
8. Build outreach promotion.
9. Build CRM promotion.
10. Add analytics, source coverage, and opportunity dashboards.

