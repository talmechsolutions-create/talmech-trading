# Industrial CRM Phase 4 Result

Date: 2026-08-27

Phase 4 implemented the controlled Industrial Intelligence import foundation for CSV/XLSX upload, reviewed column mapping, dry-run analysis, paginated admin review, approval, and guarded commit scaffolding. It did not import the real Talmech workbook, did not seed sample manufacturers, did not promote records to CRM or Outreach, and did not change Marketplace behavior.

## Import Architecture

The workflow is:

```text
File upload
-> file validation
-> sheet discovery
-> column auto-mapping
-> admin mapping review
-> dry-run processing
-> row validation
-> Phase 3 normalization
-> Phase 3 duplicate detection
-> paginated admin review
-> approval
-> guarded commit
```

Upload creates an `IndustrialImportBatch` only. It never creates `IndustrialCompany`, `IndustrialPlant`, or `IndustrialContact` records automatically.

## Supported Formats

Supported:
- `.csv`
- `.xlsx`

CSV parsing is dependency-free and handles quoted values, escaped quotes, CRLF/LF rows, empty rows, and formula-looking values.

XLSX parsing is dependency-free. The importer reads the XLSX ZIP central directory, workbook relationships, shared strings, and worksheet cell values needed for ordinary spreadsheet uploads. This avoids adding the legacy `xlsx` package or another runtime dependency.

Limits:
- maximum upload size: 8 MB,
- maximum processed rows per sheet: 10,000,
- maximum columns per sheet: 120,
- maximum sheets warning threshold: 25.

## Import Modes

Supported modes:
- `COMPANY_PLANT_MASTER`
- `CONTACT_ENRICHMENT`
- `DISCOVERY_QUEUE`
- `GENERIC_MAPPING`

The importer suggests a mode from sheet name and headers, but the mode is stored as reviewed batch metadata and can be overridden through mapping confirmation.

## Column Mapping

Added controlled target fields for company, plant, contact, capability, opportunity, verification, source, and notes data.

Auto-mapping returns:
- source column,
- target field,
- confidence,
- reason.

Ambiguous headers are not silently mapped. The admin detail page shows sheets and processability; mapping is persisted in `IndustrialImportBatch.raw.phase4.mapping`.

## Normalization Contract

Dry run reuses Phase 3 normalizers:
- company name,
- official domain,
- GSTIN,
- phone,
- email,
- location,
- department,
- process taxonomy,
- service opportunity taxonomy.

Raw source values remain in `IndustrialImportRow.raw`. Normalized values and dry-run metadata are stored in `IndustrialImportRow.normalized`.

## Duplicate Contract

Every valid import row is passed through the Phase 3 duplicate matcher before commit planning.

Classifications include:
- `NEW_COMPANY`
- `MATCH_EXISTING_COMPANY`
- `POSSIBLE_COMPANY_DUPLICATE`
- `NEW_PLANT`
- `MATCH_EXISTING_PLANT`
- `SAME_COMPANY_DIFFERENT_PLANT`
- `POSSIBLE_PLANT_DUPLICATE`
- `NEW_CONTACT`
- `MATCH_EXISTING_CONTACT`
- `POSSIBLE_CONTACT_DUPLICATE`
- `MANUAL_REVIEW`
- `INVALID`

Fuzzy/possible matches and plant ambiguity require review. Same-company/different-plant safeguards remain active for cases such as Ramkrishna Plant I vs Plant V and Tata Steel Jamshedpur vs Kalinganagar.

## Dry-Run Behavior

Dry run calculates actual batch counts:
- total source rows,
- valid rows,
- invalid rows,
- new company candidates,
- existing company matches,
- possible company duplicates,
- new plant candidates,
- existing plant matches,
- possible plant duplicates,
- same-company/different-plant rows,
- new contacts,
- existing contact matches,
- possible contact duplicates,
- capabilities,
- service opportunities,
- source rows,
- manual review rows,
- rejected rows.

Dry run deletes and regenerates previous dry-run rows for the same batch, making repeated dry runs deterministic before approval.

## Review Workflow

Admin routes added:
- `/admin/industrial-intelligence/imports`
- `/admin/industrial-intelligence/imports/[id]`

The import list includes upload and batch history. The detail page shows batch status, sheet metadata, summary counts, and a paginated row review table with row number, company, plant, state, city, classification, duplicate score, verification, planned action, and issues.

Review decisions supported through API:
- `CREATE_NEW_COMPANY`
- `USE_EXISTING_COMPANY`
- `CREATE_NEW_PLANT`
- `USE_EXISTING_PLANT`
- `CREATE_NEW_CONTACT`
- `USE_EXISTING_CONTACT`
- `HOLD_FOR_REVIEW`
- `REJECT_ROW`

The API checks that review row IDs belong to the target batch.

## Commit Behavior

Commit is implemented but guarded:
- batch must be `APPROVED`,
- repeated commit on an already committed batch is idempotent,
- processing is bounded,
- row-level status and created IDs are recorded,
- failed rows are marked with errors,
- audit events record start/completion/failure.

The commit path currently creates new company/plant/contact records only for rows planned as creates. It does not update pre-existing records or merge duplicates automatically.

No real import was executed during this phase.

## Rollback Design

Rollback remains non-destructive by design. Imported records are traceable through:
- `IndustrialImportRow.companyId`,
- `IndustrialImportRow.plantId`,
- `IndustrialImportRow.contactId`,
- entity `raw.createdByImportBatch`,
- audit events.

Pre-existing records are never deleted merely because an import touched them. Future rollback should mark or supersede batch-created records where safe, and block destructive rollback after downstream promotion.

## Permissions

Read/list/detail import endpoints require:
- `industrial_intelligence.view`

Mutating endpoints require:
- `industrial_intelligence.import`

Server-side permission checks are enforced in API routes. The UI only supplements those checks.

## API Routes

Added:
- `GET /api/admin/industrial-intelligence/imports`
- `POST /api/admin/industrial-intelligence/imports/upload`
- `GET /api/admin/industrial-intelligence/imports/[id]`
- `POST /api/admin/industrial-intelligence/imports/[id]/mapping`
- `POST /api/admin/industrial-intelligence/imports/[id]/dry-run`
- `POST /api/admin/industrial-intelligence/imports/[id]/review`
- `POST /api/admin/industrial-intelligence/imports/[id]/approve`
- `POST /api/admin/industrial-intelligence/imports/[id]/commit`

All responses use no-store admin cache headers.

## PII Handling

Formula-looking spreadsheet values are neutralized during parsing. Audit metadata is summarized and redacted by `auditIndustrialAction()`, which redacts phone, mobile, WhatsApp, email, token, secret, password, and similar keys.

Raw import rows are retained for review, but no imported contact data is exposed publicly.

## Schema And Migration Status

No Prisma schema change was required. Phase 1 `IndustrialImportBatch`, `IndustrialImportRow`, `IndustrialDuplicateCandidate`, and audit models are reused.

Migration created: no.

Migration applied: no.

## Tests

Added:
- `scripts/industrial-intelligence-phase4-tests.js`

Coverage includes:
- valid forging CSV row,
- valid steel CSV row,
- valid minimal XLSX workbook,
- discovery-only row mode,
- analytics/control sheet exclusion,
- formula-looking spreadsheet text neutralization,
- unsupported file rejection,
- column auto-mapping,
- ambiguous/low-confidence mapping behavior,
- import route RBAC wiring,
- view route RBAC wiring,
- commit idempotency guard,
- approval guard,
- bounded commit processing,
- pagination wiring,
- reuse of Phase 1 import models,
- avoidance of legacy `xlsx` dependency.

## Known Limitations

- The commit path creates new master rows only; update/link-to-existing commit actions are stored as review decisions but should be expanded before the first production commit.
- XLSX parsing targets ordinary workbook structures and does not evaluate formulas, macros, charts, pivots, hidden metadata, or styling.
- The UI provides operational review and action buttons; fine-grained row editing can be added in Phase 5 duplicate review.
- CSRF continues to rely on the existing admin same-origin middleware pattern rather than route-local token enforcement.

## First Real Talmech Workbook Dry-Run Procedure

1. Confirm the reviewed Phase 1 migration has been applied in staging or production through the deployment process.
2. Set `INDUSTRIAL_INTELLIGENCE_PERMISSIONS` so the reviewing admin has `industrial_intelligence.view` and `industrial_intelligence.import`.
3. Open `/admin/industrial-intelligence/imports`.
4. Upload the workbook as `.xlsx` or exported `.csv`.
5. Confirm that analytics/control sheets such as dashboard, state summary, coverage, and sources are excluded.
6. Select the intended manufacturing sheet, such as Forging Master or Steel Master.
7. Review auto-mapped columns and correct ambiguous mappings through the mapping API/UI flow.
8. Run dry run.
9. Review summary counts and paginated rows, especially invalid rows, duplicate candidates, same-company/different-plant rows, and discovery-only rows.
10. Reject or hold questionable rows; approve only rows that should become master records.
11. Stop after dry run for first operational review. Do not commit until Talmech approves the dry-run output.

