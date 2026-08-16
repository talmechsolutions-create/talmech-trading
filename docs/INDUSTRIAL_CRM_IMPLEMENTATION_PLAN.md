# Industrial CRM Implementation Plan

Audit date: 2026-08-16

This is a phased implementation plan for the future Industrial Intelligence and CRM integration module. No implementation was performed during the audit task.

## Ground Rules

- Do not run `prisma db push`.
- Do not create destructive migrations.
- Do not import production manufacturer data without dry-run.
- Do not put all companies into `CrmLead`.
- Do not expose public contact data.
- Do not load 100,000 contacts into one admin page.
- Keep existing CRM, outreach, marketplace, admin, TMIS, WhatsApp upload, and account functionality intact.

## Phase 0: Approval And Design Freeze

Deliverables:
- Review `docs/INDUSTRIAL_CRM_AUDIT.md`.
- Review `docs/INDUSTRIAL_CRM_ARCHITECTURE.md`.
- Approve model names, lifecycle statuses, taxonomy, route names, and import flow.
- Decide whether admin RBAC is in scope before import commit.

Exit criteria:
- Approved data model.
- Approved admin route map.
- Approved migration strategy.
- Approved security requirements.

## Phase 1: Foundation And Safety

Status: completed in this repository as Phase 1 foundation on 2026-08-16.

Scope:
- Add admin permission model if approved.
- Add stronger audit/event model.
- Add centralized CSV escaping with formula injection protection.
- Fix marketplace public CSV to export only public-safe rows or protect it.
- Add shared pagination request/response helpers.

No industrial import yet.

Suggested work:
- `AdminActor` / `AdminRole` / `AdminPermission` or a minimal equivalent.
- `AuditEvent` with indexes on actor/action/entity/entityId/createdAt/importBatchId.
- `csvSafeCell()` utility.
- Pagination utility with `limit`, `cursor`, and max limit enforcement.
- CSRF token enforcement for future bulk mutation APIs.

Tests:
- Auth/permission API tests.
- CSV escaping tests.
- Audit write tests.
- Pagination helper tests.

Verification:
- `npm run typecheck`
- `npm run build`
- `npx prisma validate`

Completed in this Phase 1 pass:
- Added the core Industrial Intelligence Prisma domain: company, plant, contact, process, capability, service opportunity, source, activity, assignment, import batch/row, duplicate candidate/resolution, promotion, and audit event models.
- Added normalized duplicate-foundation fields and indexes for company names, domains, GSTIN, plant identity/address, phones, WhatsApp numbers, emails, location, verification, lifecycle, priority, and timestamps.
- Added additive admin permission models: actor, role, permission, actor-role, and role-permission.
- Added reusable industrial permission constants/helper with deny-by-default write behavior unless configured.
- Added reusable industrial audit helper with PII-aware redaction for future industrial actions.
- Created an additive migration at `prisma/migrations/20260816161000_industrial_intelligence_foundation/migration.sql`.

Deferred from the broader suggested safety list:
- Marketplace CSV behavior and centralized CSV formula hardening remain open because the Phase 1 request explicitly prohibited changing marketplace behavior.
- No admin UI, imports, promotion endpoints, or existing CRM/Outreach behavior were changed.

## Phase 2: Prisma Models And Read-Only Admin

Status: completed in this repository as the read-only Industrial Intelligence admin module on 2026-08-16.

Scope:
- Add new Industrial Intelligence tables.
- Do not backfill production data automatically.
- Build read-only admin routes with empty-state UI.

Candidate models:
- `IndustrialCompany`
- `IndustrialPlant`
- `IndustrialContact`
- `IndustrialCapability`
- `IndustrialProcess`
- `IndustrialServiceOpportunity`
- `IndustrialSource`
- `IndustrialImportBatch`
- `IndustrialImportRow`
- `DuplicateCandidate`
- `DuplicateResolution`
- `IndustrialPromotion`
- `IndustrialActivity`

Admin pages:
- `/admin/industrial-intelligence`
- `/admin/industrial-intelligence/companies`
- `/admin/industrial-intelligence/plants`
- `/admin/industrial-intelligence/contacts`
- `/admin/industrial-intelligence/opportunities`
- `/admin/industrial-intelligence/imports`
- `/admin/industrial-intelligence/duplicates`
- `/admin/industrial-intelligence/verification`

APIs:
- Cursor-paginated GET endpoints for companies, plants, contacts, opportunities, imports, duplicates.

Tests:
- Prisma validation.
- Empty-state page render tests if test framework exists.
- API auth and pagination tests.

Completed in this Phase 2 pass:
- Added the protected admin route `/admin/industrial-intelligence` with KPI cards, state/region analytics, service opportunity analytics, empty-state handling, and a bounded companies preview.
- Added read-only admin views for companies, company detail, plant detail, and contacts.
- Added dedicated admin APIs for summary, companies, company detail, plant detail, and contacts.
- Wired all new API routes to `industrial_intelligence.view` through the Phase 1 permission helper.
- Added shared query parsing and server-side pagination helpers with explicit allowlists for filters, sort fields, page sizes, and enum-like query values.
- Added Prisma query services using `count`, `groupBy`, `_count`, bounded `take`, bounded relation sections, and explicit `select` structures.
- Added a Talmech admin home card for Industrial Intelligence.
- Added a no-dependency Phase 2 smoke test script covering pagination bounds, safe filter parsing, read-only route shape, no-store API headers, and RBAC wiring.

Deferred:
- No imports, Google Sheet ingestion, duplicate resolution UI, CRM promotion, Outreach promotion, or create/edit/delete UI were added.
- Phase 1 migration remains unapplied by code in this phase.

## Phase 3: Normalization And Duplicate Engine

Scope:
- Implement deterministic normalization before imports.
- Implement duplicate detection without committing master records.

Normalizers:
- company legal suffix normalization: `Ltd`, `Limited`, `Pvt`, punctuation, casing.
- official domain extraction.
- Indian phone normalization.
- email normalization.
- GSTIN normalization.
- location normalization.
- department/designation normalization.
- service opportunity normalization.
- process/category normalization.

Duplicate tiers:
1. GSTIN exact.
2. official domain exact.
3. phone exact.
4. email exact.
5. normalized company name.
6. company + city.
7. company + plant address.
8. fuzzy name candidate.
9. manual review.

Required tests:
- `Ramkrishna Forgings Ltd` and `Ramkrishna Forgings Limited` match as company candidates.
- `Ramkrishna Forgings Plant I` and `Ramkrishna Forgings Plant V` remain separate plant candidates.
- Tata Steel plants remain separate under one company.
- Board-line phone does not automatically merge unrelated contacts.
- Missing GSTIN/domain falls back to weaker candidate tiers.

## Phase 4: Import Dry-Run

Scope:
- Build XLSX/CSV upload.
- Parse rows into `IndustrialImportBatch` and `IndustrialImportRow`.
- Validate/normalize rows.
- Run duplicate detection.
- Show preview. No commit.

Flow:
```text
Upload
-> Parse
-> Validate
-> Normalize
-> Duplicate detection
-> Dry-run summary
-> Row preview
```

Preview counts:
- total rows
- valid rows
- invalid rows
- new company candidates
- existing company update candidates
- new plant candidates
- existing plant update candidates
- new contact candidates
- duplicate candidates
- conflict rows

Admin UI:
- batch list
- batch detail
- invalid rows
- duplicate rows
- new/update summary
- source coverage

Tests:
- CSV parser fixtures.
- XLSX parser fixtures if dependency exists or is approved.
- Formula injection neutralization.
- payload size limits.
- authorization and CSRF.
- duplicate preview snapshots.

## Phase 5: Duplicate Review And Approval

Scope:
- Let admin resolve duplicate candidates before commit.
- Add manual resolution audit.

Actions:
- merge into existing company
- update existing company
- create new company
- create new plant under existing company
- skip row
- mark not duplicate

Rules:
- Fuzzy candidates require manual review.
- Company-level match cannot overwrite plant-level fields without plant selection.
- Plant-level match cannot collapse separate plant rows under one plant unless address/plant code supports it.

Tests:
- duplicate resolution transitions.
- audit events.
- idempotency for repeated resolution calls.

## Phase 6: Commit And Rollback

Scope:
- Commit approved import batches to master tables.
- Record row-level commit output.
- Support rollback where safe.

Commit rules:
- Batch must be in `APPROVED`.
- Commit endpoint should be idempotent.
- Use chunks to avoid oversized transactions.
- Store created/updated entity ids on each import row.
- Write audit events for every batch and summary counts.

Rollback rules:
- Allow rollback before downstream promotions.
- Mark records as rolled back or delete only if safe and created solely by that batch.
- For updates, store before/after summaries or use correction events.

Tests:
- commit happy path.
- partial failure and retry.
- rollback before promotion.
- rollback blocked after promotion.
- no duplicate entity creation on commit retry.

## Phase 7: Verification Queue

Scope:
- Build operational verification UI.

Views:
- company verification queue
- plant verification queue
- contact verification queue
- source coverage view
- stale records view
- conflict rows

Actions:
- mark source captured
- mark partially verified
- mark verified
- mark conflicting
- mark stale
- add verification note
- assign owner

Tests:
- lifecycle transition validation.
- audit events.
- filter pagination.

## Phase 8: Opportunity Scoring And Qualification

Scope:
- Add scoring and qualification workflows for service opportunities.

Service opportunity types:
- MPI / NDT
- Visual Inspection
- Grinding
- Fettling
- Sorting
- Segregation
- Rework
- Oiling
- Packing
- Material Handling
- Production Support
- Quality Containment
- Managed Manpower
- Other Industrial Services

Qualification fields:
- service type
- evidence
- contact department
- plant process
- location fit
- priority
- expected need
- next action
- disqualification reason

Tests:
- scoring function.
- filter performance.
- lifecycle transitions.

## Phase 9: Outreach Promotion

Scope:
- Promote selected verified/qualified contacts to `OutreachProspect`.

Rules:
- check `OutreachSuppression` before creating.
- include company, plant, department, designation, source, opportunity context.
- set source as `industrial-intelligence`.
- create `IndustrialPromotion` link.
- preserve existing outreach consent semantics.

APIs:
- `POST /api/admin/industrial-intelligence/promote/outreach`

Tests:
- suppression blocks promotion.
- duplicate outreach prospect handled.
- promotion link created.
- audit event written.

## Phase 10: CRM Promotion

Scope:
- Promote qualified/engaged industrial opportunities to CRM.

Current target:
- `CrmLead`

Recommended mapping:
- `leadType`: manufacturer/supplier/service opportunity.
- `company`: `IndustrialCompany.canonicalName`
- `contact`: best verified contact.
- `phone/email`: selected verified contact point.
- `city/state`: plant or company location.
- `metal`: industry/process/product/service label.
- `quantity`: empty or opportunity estimate.
- `nextAction`: generated from qualification.
- `notes`: source, plant, service opportunity, verification summary.
- `sourceLeadId`: industrial promotion id or company/opportunity id.

APIs:
- `POST /api/admin/industrial-intelligence/promote/crm`

Tests:
- only qualified records promote unless override is audited.
- duplicate CRM promotion prevented by `IndustrialPromotion`.
- CRM lead created.
- lifecycle changes to `CRM_PROMOTED`.

## Phase 11: Analytics

Scope:
- Add dashboard KPIs and analytics.

Dashboards:
- companies by state/industry.
- plants by cluster.
- contacts by department.
- verification coverage.
- source coverage.
- duplicate backlog.
- import quality.
- service opportunity heatmap.
- outreach readiness.
- CRM promotion funnel.

Performance:
- use grouped database queries or cached summary tables.
- avoid scanning contact table for every dashboard render.

## Phase 12: Hardening And Production Rollout

Checklist:
- authorization reviewed.
- CSRF enforced on mutating APIs.
- CSV export safe.
- rate limits configured.
- audit events indexed.
- production migrations reviewed.
- import dry-run tested on real-like samples.
- no public exposure of contact data.
- build passes.
- type-check passes.
- Prisma validate passes.
- rollback tested.

Rollout:
1. Deploy read-only empty module.
2. Enable dry-run imports for admins.
3. Enable duplicate review.
4. Enable commit for limited admin role.
5. Enable outreach promotion.
6. Enable CRM promotion.
7. Enable analytics.

## Suggested API Contract Summary

List companies:
```text
GET /api/admin/industrial-intelligence/companies?limit=50&cursor=...&state=...&industry=...&verificationStatus=...
```

Create import batch:
```text
POST /api/admin/industrial-intelligence/imports
```

Dry run import:
```text
POST /api/admin/industrial-intelligence/imports/[batchId]/dry-run
```

Resolve duplicate:
```text
POST /api/admin/industrial-intelligence/duplicates/[candidateId]/resolve
```

Commit batch:
```text
POST /api/admin/industrial-intelligence/imports/[batchId]/commit
```

Promote to outreach:
```text
POST /api/admin/industrial-intelligence/promote/outreach
```

Promote to CRM:
```text
POST /api/admin/industrial-intelligence/promote/crm
```

## Migration Strategy

1. Add only new tables first.
2. Avoid altering existing models in the first migration unless adding non-invasive indexes.
3. Add indexes needed for list/filter routes.
4. Deploy behind feature flag.
5. Validate migration against staging database.
6. Seed taxonomy rows if taxonomy is stored in DB.
7. Keep all import commits disabled until dry-run and duplicate review pass acceptance.

## Rollback Strategy

For code:
- revert feature flag or hide route.
- leave new tables in place if unused.

For migrations:
- prefer forward fixes.
- avoid dropping tables with import/audit data.

For import data:
- use batch rollback before promotion.
- if promoted, create correction/merge/disqualification events rather than destructive deletion.

## Tests To Run For Each Phase

Baseline:
- `npm run typecheck`
- `npm run build`
- `npx prisma validate`

When model changes occur:
- `npx prisma generate`
- migration status command in staging
- targeted API/unit tests

When import changes occur:
- parser fixture tests
- duplicate fixture tests
- authorization tests
- CSRF tests
- load test script for at least 100,000 contacts worth of generated rows before production-scale import.

## Documentation Updates Needed Later

- Data dictionary for every Industrial Intelligence model.
- Admin runbook for imports.
- Duplicate resolution guide.
- Verification SOP.
- Outreach consent and suppression policy.
- CRM promotion SOP.
- Rollback SOP.
- Production deployment checklist.
