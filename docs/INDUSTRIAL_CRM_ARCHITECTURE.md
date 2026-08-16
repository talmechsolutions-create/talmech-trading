# Industrial CRM Architecture

Audit date: 2026-08-16

This document designs the future Industrial Intelligence and CRM integration layer for Talmech Trading. It is intentionally a planning document. It does not imply that Prisma schema, migrations, APIs, or UI have already been implemented.

## Architecture Principle

Industrial Intelligence is the master discovery and verification system. CRM is the sales pipeline after qualification. Outreach is the communication execution layer. Marketplace is the public listing/RFQ layer. User accounts are operational customer/supplier accounts.

Do not import all manufacturer records into CRM.

Recommended flow:

```text
Industrial Intelligence
-> Company
-> Plant(s)
-> Contact(s)
-> Capabilities / processes
-> Service opportunities
-> Verification
-> Qualification
-> Prospect outreach
-> Qualified CRM account / opportunity
-> Meeting / RFQ / quotation / customer
```

## Current System Ownership

Current owners:
- `UserRegistration`: onboarding/account record, not company master.
- `PublicLead`: inbound website requirement/lead.
- `MarketplaceListing`: public/private listing row.
- `CrmLead`: lightweight CRM funnel row.
- `OutreachProspect`: manual outreach contact/prospect.
- `OutreachSuppression`: global do-not-contact.
- `WhatsappUpload`: WhatsApp-assisted submission review.
- `LogisticsProvider`: transport/vendor onboarding.
- TMIS static seed data: draft knowledge/reference intelligence.

New owner required:
- Industrial Intelligence owns company, plant, contact, capability, process, opportunity, source, verification, duplicate, import, and promotion records.

## Domain Boundary

Industrial Intelligence should answer:
- Which companies exist?
- Which plants do they operate?
- What industrial categories and processes apply?
- What products/capabilities are present?
- Which contacts belong to the company or plant?
- Which service opportunities exist?
- What sources support the information?
- What has been verified?
- Is the record qualified for outreach or CRM?

CRM should answer:
- Which qualified relationship is being actively sold?
- What stage is it in?
- What is the next action?
- What meeting/RFQ/quote/opportunity value exists?

Outreach should answer:
- Which contact should receive which message?
- What consent/suppression state applies?
- What was sent or prepared?
- What follow-up is due?

Marketplace should answer:
- What verified opportunity/listing/RFQ can be shown or actioned publicly?

## Proposed Core Data Model

### IndustrialCompany

Purpose: canonical manufacturer/company entity.

Suggested fields:
- `id`
- `createdAt`
- `updatedAt`
- `canonicalName`
- `legalName`
- `normalizedName`
- `aliases`
- `industry`
- `subcategory`
- `companyType`
- `officialWebsite`
- `officialDomain`
- `gstin`
- `country`
- `region`
- `state`
- `city`
- `headOfficeAddress`
- `verificationStatus`
- `lifecycleStatus`
- `priorityScore`
- `opportunityScore`
- `sourceConfidence`
- `notes`

Indexes:
- `normalizedName`
- `officialDomain`
- `gstin`
- `state`, `city`
- `industry`, `subcategory`
- `verificationStatus`, `lifecycleStatus`
- compound `industry, state`

Uniqueness:
- unique `gstin` when not null, if business permits.
- unique `officialDomain` when not null and verified.

### IndustrialPlant

Purpose: plant/factory/unit under a company.

Suggested fields:
- `id`
- `companyId`
- `plantName`
- `plantCode`
- `normalizedPlantName`
- `plantType`
- `country`
- `region`
- `state`
- `district`
- `city`
- `industrialCluster`
- `industrialArea`
- `address`
- `pincode`
- `lat`
- `lng`
- `verificationStatus`
- `lifecycleStatus`
- `opportunityScore`
- `notes`

Indexes:
- `companyId`
- `state`, `district`, `city`
- `industrialCluster`
- `plantType`
- `verificationStatus`
- compound `companyId, normalizedPlantName`
- compound `companyId, city`

Uniqueness:
- avoid global unique plant names.
- consider soft unique compound `companyId, normalizedPlantName, city` after review.

### IndustrialContact

Purpose: person/contact linked to company and optionally plant.

Suggested fields:
- `id`
- `companyId`
- `plantId`
- `personName`
- `normalizedPersonName`
- `department`
- `designation`
- `seniority`
- `phone`
- `phoneNormalized`
- `whatsapp`
- `whatsappNormalized`
- `email`
- `emailNormalized`
- `sourceId`
- `verificationStatus`
- `consentStatus`
- `lastVerifiedAt`
- `notes`

Indexes:
- `companyId`
- `plantId`
- `department`
- `phoneNormalized`
- `whatsappNormalized`
- `emailNormalized`
- `verificationStatus`
- `consentStatus`

Uniqueness:
- use exact contact-point uniqueness carefully. The same phone may be a board line. Prefer duplicate candidates over hard uniqueness unless the contact point is clearly personal.

Departments:
- Plant / Factory
- Quality / QA / QC
- Production
- Operations
- Purchase
- Procurement
- SCM
- HR
- Administration
- Maintenance
- NDT / MPI
- Sales
- Management
- Director / Owner

### IndustrialCapability

Purpose: company/plant capability or product/process capacity.

Suggested fields:
- `id`
- `companyId`
- `plantId`
- `capabilityType`
- `industry`
- `subcategory`
- `process`
- `product`
- `material`
- `capacityText`
- `qualityCertifications`
- `verificationStatus`
- `sourceId`

Indexes:
- `companyId`, `plantId`
- `industry`, `subcategory`
- `process`
- `product`
- `material`

### IndustrialProcess

Purpose: controlled process taxonomy, optionally reused across capabilities.

Values should support forging, steel, and other categories:
- Closed Die
- Open Die
- Hot Forging
- Warm Forging
- Cold Forging
- Ring Rolling
- Heavy Forging
- Precision Forging
- Integrated Steel Plant
- Secondary Steel
- Rolling Mill
- Re-Rolling Mill
- TMT
- Billet/Ingot
- Induction Furnace
- Electric Arc Furnace
- Sponge Iron / DRI
- Alloy Steel
- Special Steel
- Stainless Steel
- Wire Rod
- Structural Steel
- Foundry / Casting
- Heat Treatment
- Machining
- Automotive Components
- Bearings
- Gears
- Fasteners
- Fabrication
- Engineering Manufacturing

### IndustrialServiceOpportunity

Purpose: service opportunity at company or plant level.

Supported service opportunities:
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

Suggested fields:
- `id`
- `companyId`
- `plantId`
- `opportunityType`
- `opportunityStage`
- `priority`
- `score`
- `evidence`
- `estimatedNeed`
- `sourceId`
- `verificationStatus`
- `qualifiedAt`
- `ownerAdminId`

### IndustrialSource

Purpose: source/evidence record.

Suggested fields:
- `id`
- `sourceType`
- `sourceUrl`
- `sourceTitle`
- `sourceDomain`
- `sheetName`
- `sheetTab`
- `rowNumber`
- `importBatchId`
- `capturedAt`
- `verificationStatus`
- `confidenceLevel`
- `raw`

Every company, plant, contact, capability, and opportunity should have at least one source link or import row reference.

### IndustrialImportBatch

Purpose: import job header.

Suggested fields:
- `id`
- `createdAt`
- `createdBy`
- `status`
- `fileName`
- `fileType`
- `fileSha256`
- `sourceSystem`
- `sourceUrl`
- `totalRows`
- `validRows`
- `invalidRows`
- `duplicateCandidates`
- `newCompanies`
- `newPlants`
- `newContacts`
- `updatedCompanies`
- `committedAt`
- `rolledBackAt`
- `notes`

Statuses:
- `UPLOADED`
- `PARSED`
- `VALIDATED`
- `DRY_RUN_READY`
- `DUPLICATE_REVIEW`
- `APPROVED`
- `COMMITTING`
- `COMMITTED`
- `FAILED`
- `ROLLED_BACK`

### IndustrialImportRow

Purpose: row-level staging and audit.

Suggested fields:
- `id`
- `batchId`
- `rowNumber`
- `status`
- `raw`
- `normalized`
- `validationIssues`
- `duplicateCandidateIds`
- `commitAction`
- `createdCompanyId`
- `createdPlantId`
- `createdContactId`
- `error`

Statuses:
- `PARSED`
- `INVALID`
- `VALID`
- `DUPLICATE_CANDIDATE`
- `CONFLICT`
- `READY_TO_COMMIT`
- `COMMITTED`
- `SKIPPED`
- `FAILED`

### DuplicateCandidate

Purpose: reviewable duplicate match.

Suggested fields:
- `id`
- `batchId`
- `rowId`
- `candidateType`
- `existingEntityType`
- `existingEntityId`
- `matchTier`
- `matchScore`
- `matchReasons`
- `status`
- `resolvedBy`
- `resolvedAt`
- `resolution`

Resolutions:
- `MERGE`
- `UPDATE_EXISTING`
- `CREATE_NEW_COMPANY`
- `CREATE_NEW_PLANT`
- `SKIP_ROW`
- `MARK_NOT_DUPLICATE`

### IndustrialPromotion

Purpose: explicit link from industrial intelligence to downstream systems.

Suggested fields:
- `id`
- `companyId`
- `plantId`
- `contactId`
- `opportunityId`
- `promotionType`
- `targetEntity`
- `targetEntityId`
- `createdAt`
- `createdBy`
- `notes`

Target examples:
- `OutreachProspect`
- `CrmLead`
- `MarketplaceListing`
- `UserRegistration`
- `SupportTicket`

## Location Model

Use explicit fields instead of collapsing locations:
- `country`
- `region`
- `state`
- `district`
- `city`
- `industrialCluster`
- `industrialArea`
- `plantAddress`
- `pincode`
- optional `lat`, `lng`

Company can have headquarters location and many plant locations.

Examples:
- Ramkrishna Forgings -> Plant I, Plant III/IV, Plant V, Plant VII.
- Tata Steel -> Jamshedpur, Kalinganagar, Meramandali.

Do not collapse multi-plant companies into one record.

## Industry Taxonomy

Model taxonomy as controlled tables/enums or config-seeded database rows, not arbitrary strings.

Top-level:
- `FORGING`
- `STEEL`
- `OTHER`

FORGING subcategories:
- Closed Die
- Open Die
- Hot Forging
- Warm Forging
- Cold Forging
- Ring Rolling
- Heavy Forging
- Precision Forging

STEEL subcategories:
- Integrated Steel Plant
- Secondary Steel
- Rolling Mill
- Re-Rolling Mill
- TMT
- Billet/Ingot
- Induction Furnace
- Electric Arc Furnace
- Sponge Iron / DRI
- Alloy Steel
- Special Steel
- Stainless Steel
- Wire Rod
- Structural Steel

OTHER subcategories:
- Foundry / Casting
- Heat Treatment
- Machining
- Automotive Components
- Bearings
- Gears
- Fasteners
- Fabrication
- Engineering Manufacturing

## Verification Model

Verification status should be separate from lifecycle status.

Verification statuses:
- `UNVERIFIED`
- `SOURCE_CAPTURED`
- `AUTO_NORMALIZED`
- `NEEDS_REVIEW`
- `PARTIALLY_VERIFIED`
- `VERIFIED`
- `CONFLICTING`
- `STALE`

Lifecycle statuses:
- `DISCOVERED`
- `VERIFICATION_PENDING`
- `VERIFIED`
- `QUALIFIED`
- `OUTREACH_READY`
- `CONTACTED`
- `ENGAGED`
- `CRM_PROMOTED`
- `OPPORTUNITY`
- `QUOTATION`
- `CUSTOMER`
- `DISQUALIFIED`

## Duplicate Strategy

Exact keys:
1. GSTIN
2. official domain
3. email
4. phone/WhatsApp

Strong composite keys:
5. normalized company name + city/state
6. normalized company name + plant address
7. normalized company name + official website domain

Fuzzy candidates:
8. company name similarity
9. alias similarity
10. nearby plant/location similarity

Manual review:
- Required for fuzzy matches and multi-plant ambiguity.
- Required when the same company name exists in different cities with no official domain/GSTIN.
- Required when one row has company-level data and another has plant-level data.

## Import Flow

```text
Upload XLSX/CSV
-> Parse
-> Validate
-> Normalize
-> Dry run
-> Duplicate detection
-> Conflict review
-> Admin approval
-> Commit
-> Audit log
-> Optional rollback
```

Rules:
- Never commit directly from upload.
- Store the raw row and normalized row.
- Keep Google Sheet URL/tab/row source references.
- Let admins choose duplicate resolutions before commit.
- Commit in chunks and keep row-level results.

## Admin UX

Primary route: `/admin/industrial-intelligence`.

Required views:
- Dashboard KPIs
- Company table
- Plant table
- Contact table
- Verification queue
- Duplicate-review queue
- Import batches
- Import row detail
- State/region analytics
- Source coverage
- Opportunity analytics

Required filters:
- Region
- State
- District
- City
- Industrial cluster
- Industry
- Subcategory
- Plant type
- Product
- Process
- Service opportunity
- Contact department
- Verification status
- Existing phone contact
- Outreach status
- CRM status
- Priority
- Source
- Last verified date

UX rule: all table views must be server-paginated. Do not load the national database into a single browser request.

## API Rules

All admin APIs:
- Require admin auth.
- Require CSRF token for mutating operations.
- Enforce request size limits.
- Enforce server-side pagination.
- Return stable error codes.
- Audit all bulk actions.
- Avoid returning raw contact data unless explicitly needed by the view.

List endpoints:
- `limit` default 50, max 100.
- `cursor` or keyset pagination.
- Indexed filters only.
- Search endpoint should use normalized search table or database-supported search.

Import endpoints:
- upload max size defined by config.
- parse asynchronously or in bounded chunks.
- no commit without batch approval.
- commit endpoint idempotent by batch id and expected status.

## Performance Design

Target:
- 10,000 companies
- 30,000 plants
- 100,000 contacts
- large activity history

Required:
- indexes on normalized names, domain, GSTIN, phone/email, state/city, industry, lifecycle, verification status.
- cursor pagination.
- bounded includes; avoid N+1.
- aggregate counters cached or computed with targeted queries.
- import chunking.
- background-safe processing.
- strict query limits.

Avoid:
- full-table `findMany()`.
- client-side `JSON.stringify` search.
- importing all rows into React state.
- storing critical query fields only in `raw`.

## Promotion Architecture

Promotion to Outreach:
- Select company/plant/contact/opportunity.
- Check suppression.
- Create `OutreachProspect` with source `industrial-intelligence`.
- Store `IndustrialPromotion` link.
- Keep industrial lifecycle as `OUTREACH_READY` or `CONTACTED`.

Promotion to CRM:
- Require `VERIFIED` or override with audit reason.
- Require company and at least one contact or opportunity.
- Create `CrmLead` or future `CrmAccount/CrmOpportunity`.
- Store `IndustrialPromotion` link.
- Change lifecycle to `CRM_PROMOTED`.

Promotion to Marketplace:
- Require verified public-safe listing content.
- Create or link `MarketplaceListing`.
- Do not expose private contact data.

Promotion to Account:
- Only after customer/supplier onboarding is intended.
- Use `UserRegistration` or future account model.

## Google Sheets Strategy

Google Sheets should remain research/staging, not runtime.

Recommended handling:
- Source data lives in Google Sheets during research.
- Export to CSV/XLSX.
- Upload to Talmech admin import.
- Talmech database becomes operational source after approved import.
- Store source sheet metadata for traceability.
- Re-imports should be diffed by file checksum/source row ids when possible.

## Security Architecture

Required before broad rollout:
- admin RBAC for import/view/export/commit/delete/rollback.
- CSRF token enforcement for imports and destructive actions.
- PII redaction in logs.
- CSV formula neutralization.
- export permission checks.
- audit trail with actor, ip/request id, batch id, entity id, and action.
- retention policy for phone/email/source rows.
- opt-out/suppression checks before outreach.

## Recommended Reuse Map

Reuse:
- `OutreachSuppression` for do-not-contact.
- `OutreachProspect` as outbound outreach target.
- `CrmLead` as current CRM target.
- `MarketplaceListing` as marketplace target.
- `UserRegistration` as account target.
- `AdminAction` temporarily.
- TMIS review language and draft governance.

Do not reuse:
- `CrmLead` as company master.
- `OutreachProspect` as plant/contact master.
- `PublicLead` as industrial intelligence.
- `WhatsappUpload` as import batch.

## Open Architecture Decisions

1. Whether admin RBAC is added before or during Industrial Intelligence Phase 1.
2. Whether taxonomy is Prisma data seeded from config or TypeScript constants initially.
3. Whether CRM remains `CrmLead` or gets normalized CRM account/opportunity models after Industrial Intelligence is live.
4. Whether imports run synchronously in API chunks or via a job queue/worker.
5. Whether search uses PostgreSQL trigram/full-text indexes or a separate search service later.

