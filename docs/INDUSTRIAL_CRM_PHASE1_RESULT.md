# Industrial CRM Phase 1 Result

Date: 2026-08-16

Phase 1 implemented the secure persistent foundation for Talmech Industrial Intelligence. It did not build the admin UI, import Google Sheet data, add XLSX/CSV import, rewrite CRM, rewrite Prospect Outreach, or change marketplace behavior.

## Models Added

Admin permission foundation:
- `AdminActor`
- `AdminRole`
- `AdminPermission`
- `AdminActorRole`
- `AdminRolePermission`

Industrial Intelligence domain:
- `IndustrialCompany`
- `IndustrialPlant`
- `IndustrialContact`
- `IndustrialProcess`
- `IndustrialCapability`
- `IndustrialServiceOpportunity`
- `IndustrialSource`
- `IndustrialActivity`
- `IndustrialAssignment`
- `IndustrialImportBatch`
- `IndustrialImportRow`
- `IndustrialDuplicateCandidate`
- `IndustrialDuplicateResolution`
- `IndustrialPromotion`
- `IndustrialAuditEvent`

Enums added:
- industry category
- verification status
- lifecycle status
- priority
- source type
- contact scope
- service type
- opportunity status
- import batch/row status
- duplicate status/resolution action
- promotion type/target/status
- admin permission effect

## Relations

- One `IndustrialCompany` has many plants, contacts, capabilities, service opportunities, sources, activities, assignments, promotions, import rows, and audit events.
- One `IndustrialPlant` belongs to one company and can have many contacts, capabilities, service opportunities, sources, activities, assignments, promotions, import rows, and audit events.
- One `IndustrialContact` belongs to one company and optionally one plant.
- `IndustrialCapability` belongs to a company, optionally a plant, and optionally a controlled `IndustrialProcess`.
- `IndustrialServiceOpportunity` belongs to a company and optionally a plant.
- `IndustrialSource` can point to company, plant, contact, capability, service opportunity, and import batch records.
- Import batches own import rows and duplicate candidates.
- Duplicate resolutions belong to duplicate candidates.
- Promotions link industrial company/plant/contact/opportunity records to downstream target ids such as OutreachProspect or CrmLead without modifying those existing models.
- Industrial audit events can reference import batch, company, plant, contact, and service opportunity records.

Delete behavior is conservative:
- Company-owned master relations use `Restrict` where deleting a company would orphan core records.
- Optional contextual links use `SetNull`.
- Import rows cascade only when their staging batch is deleted.

## Indexes And Constraints

Normalization and duplicate-readiness:
- `IndustrialCompany.normalizedName`
- `IndustrialCompany.officialDomain`
- `IndustrialCompany.gstin`
- `IndustrialPlant.companyId + normalizedPlantName`
- `IndustrialPlant.companyId + city`
- `IndustrialPlant.state + district + city`
- `IndustrialPlant.industrialCluster`
- `IndustrialPlant.industrialArea`
- `IndustrialPlant.plantType`
- `IndustrialContact.normalizedPhone`
- `IndustrialContact.normalizedWhatsapp`
- `IndustrialContact.normalizedEmail`

Operational filters:
- company industry/state, region, verification, lifecycle, priority, created/updated timestamps.
- plant verification, lifecycle, location, created/updated timestamps.
- contact department, verification, consent, scope, created/updated timestamps.
- service type, fit level, score, status, verification, owner, created/updated timestamps.
- source type, source domain, verification level, verification-source flag, captured date.
- assignment owner/status/purpose/due date.
- import batch status/createdBy/file hash/date.
- duplicate status/match tier/entities/fingerprint.
- promotion type, target entity/id, status, promotion key.
- audit actor/action/entity/request/import/company/plant/contact/opportunity/date.

Idempotency:
- `IndustrialPromotion.promotionKey` is unique.
- `IndustrialImportRow.batchId + rowNumber` is unique.
- `IndustrialProcess.normalizedName` is unique.
- Admin actor username, role key, and permission key are unique.

No dangerous uniqueness was added for plant names, contact phones, contact emails, company domains, or GSTIN. Those are indexed for duplicate detection but not hard-merged.

## Security / RBAC Additions

Added persistent permission tables for future granular admin RBAC.

Added `lib/security/industrialPermissions.ts` with controlled permissions:
- `industrial_intelligence.view`
- `industrial_intelligence.edit`
- `industrial_intelligence.verify`
- `industrial_intelligence.import`
- `industrial_intelligence.resolve_duplicates`
- `industrial_intelligence.promote_outreach`
- `industrial_intelligence.promote_crm`
- `industrial_intelligence.admin`

The helper uses the existing admin session cookie and `verifyAdminToken()`. It does not create a new auth system. Sensitive permissions are denied by default unless configured through `INDUSTRIAL_INTELLIGENCE_PERMISSIONS` or future DB-backed role checks.

## Audit Logging Foundation

Added `IndustrialAuditEvent` for richer future audit trails.

Added `lib/security/industrialAudit.ts`, which:
- creates industrial audit event ids,
- sanitizes text fields,
- redacts sensitive keys including phone, mobile, WhatsApp, email, tokens, secrets, and passwords,
- logs to console,
- attempts to persist to `IndustrialAuditEvent` after the migration is applied.

The helper is not yet wired into existing routes because Phase 1 does not implement industrial UI/import/promotion workflows.

## Migration Status

Created:
- `prisma/migrations/20260816161000_industrial_intelligence_foundation/migration.sql`

Migration characteristics:
- additive only,
- creates new enums,
- creates new tables,
- creates indexes and foreign keys,
- does not alter existing CRM, Outreach, marketplace, lead, account, payment, or WhatsApp upload tables,
- does not move or import data.

Applied: no.

## Existing Features Changed

No existing CRM behavior changed.

No existing Outreach behavior changed.

No existing marketplace behavior changed.

No admin UI was added.

No Google Sheet or manufacturer data was imported.

## Validation

Run before handoff:
- `npx prisma format`
- `npx prisma validate`
- `npm run typecheck`
- `npm run build`

See final task report for exact command results.

## Remaining Phase 2 Work

Recommended next phase:
1. Generate Prisma client in the target environment after review.
2. Review and apply the migration in staging only.
3. Add read-only industrial admin routes with server-side pagination and empty states.
4. Add list/detail APIs for companies, plants, contacts, opportunities, imports, duplicates, and sources.
5. Wire `requireIndustrialPermission()` into those new admin APIs.
6. Add tests for pagination, authorization, and empty-state reads.

Do not begin import, duplicate review UI, outreach promotion, or CRM promotion until the read-only Phase 2 layer is reviewed.
