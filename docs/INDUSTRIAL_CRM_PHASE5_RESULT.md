# Industrial CRM Phase 5 Result

Date: 2026-08-27

Phase 5 implemented the operational Industrial Intelligence management layer and the reusable Talmech full research workbook profile. It did not apply a migration, did not import the real Talmech workbook, did not import staging data, did not import production data, and did not merge this branch into main.

## Manual CRUD

Added server-authorized workflows for:
- manual company create/update,
- manual plant create/update,
- manual contact create/update,
- research prospect creation,
- source / verification evidence creation,
- process upsert,
- capability creation,
- Talmech service opportunity creation.

The admin dashboard now exposes quick actions for `Add Company`, `Add Research Prospect`, and `Import Workbook`. Company detail exposes `Add Plant`, `Add Contact`, `Add Capability`, `Add Service Opportunity`, and `Add Source / Evidence`.

## RBAC

Write routes enforce Phase 1 permissions server-side:
- `industrial_intelligence.edit` for manual create/update workflows,
- `industrial_intelligence.verify` for source / verification evidence writes,
- `industrial_intelligence.import` for import upload, mapping, dry-run, review, approve, and commit.

Frontend buttons only reflect access. They are not the authorization boundary.

## Duplicate Safeguards

Manual company, plant, and contact creation uses Phase 3 normalization and duplicate detection before create.

If duplicate candidates exist, the API returns `DUPLICATE_REVIEW_REQUIRED` instead of silently creating. Admins can then:
- use an existing record id,
- create anyway with justification,
- cancel.

The duplicate override justification is preserved in raw metadata and audit events are emitted.

## Verification Preservation

Company, plant, and contact update paths guard against silent verification downgrade. A downgrade requires explicit justification.

Research prospects default to discovery-style states and do not become official verified records automatically.

## Talmech Workbook Profile

Added reusable import profile:

`TALMECH_FULL_RESEARCH_WORKBOOK`

The profile processes canonical sheets in this order:
1. `Master Prospects`
2. `Steel Master - India`
3. `Phone CRM - Manufacturing`
4. `Regional Discovery Queue`

The dry run produces per-phase statistics for:
- `FORGING_MASTER`
- `STEEL_MASTER`
- `PHONE_CONTACT_ENRICHMENT`
- `DISCOVERY_QUEUE`

It also produces one consolidated summary.

## Sheet Roles

Canonical creation/enrichment sheets:
- `Master Prospects`
- `Steel Master - India`
- `Phone CRM - Manufacturing`
- `Regional Discovery Queue`

Derived sheets excluded from independent entity creation:
- `Verified Contacts`
- `Research Queue`
- `Existing - Forging`
- `Existing - Steel Rolling`
- `Existing - Foundry Casting`
- `Existing - Other Mfg`
- `Matched to Forging Master`
- `New Business From Phone`
- `New Additions - VCF2`
- `Major Steel Plants`
- `Secondary Steel & Rolling`
- `Steel Contact Matches`

Analytics/control sheets excluded from entity creation:
- `Dashboard`
- `Steel Dashboard`
- `Phone Contact Summary`
- `Sources & Method`
- `Steel Sources & Coverage`
- `India Coverage Control`
- `State & Region Summary`

Their presence is preserved in import batch metadata for audit traceability.

## Upsert Behavior

The import commit path now re-checks exact identifiers before creating records:
- company GSTIN,
- official domain,
- normalized company name + city,
- plant normalized name + real location key,
- contact phone,
- contact WhatsApp,
- contact email.

When a match is found, the existing record is enriched and traced with `enrichedByImportBatch` instead of creating a duplicate. Newly created records remain traced with `createdByImportBatch`.

## Contact Enrichment

The profile adds mapping support for phone CRM enrichment fields such as:
- existing contact labels,
- existing phone numbers,
- existing roles/departments,
- existing contact emails,
- matched master prospect,
- master match score,
- master match confidence,
- person-company parse confidence,
- CRM priority,
- promotion decision.

Uncertain phone-contact matches remain enrichment/review input, not automatic verified company creation.

## Database Status

The previously classified database remains treated as unknown/possible-production until proven otherwise. Phase 5 did not run migration apply, `prisma db push`, `prisma migrate reset`, or a real-data commit.

## Real Data Status

Real Talmech workbook imported: no.

Real workbook dry run executed: no.

Staging data imported: no.

Production data imported: no.

CRM/Outreach bulk conversion: no.

## Validation

Added:
- `scripts/industrial-intelligence-phase5-tests.js`

Coverage includes:
- manual company creation route and service,
- manual plant creation route and service,
- manual contact creation route and service,
- research prospect creation,
- duplicate warning state,
- manual override justification,
- permission enforcement,
- workbook profile registration,
- canonical sheet ordering,
- derived sheet exclusion,
- analytics sheet exclusion,
- contact enrichment fields,
- discovery preservation,
- repeat-import enrichment markers.

## Exact Real-Data Activation Procedure

1. Verify the target database identity and environment with the provider. Do not rely on the current ambiguous `DATABASE_URL`.
2. Confirm backup availability and restoration procedure.
3. Apply the reviewed additive Industrial Intelligence migration only through the approved deployment process.
4. Run `npx prisma validate` and `npx prisma generate`.
5. Configure staging admin permissions: `industrial_intelligence.view`, `industrial_intelligence.edit`, `industrial_intelligence.verify`, `industrial_intelligence.import`, and `industrial_intelligence.resolve_duplicates`.
6. Run all Industrial Intelligence tests and full build validation.
7. Upload the real workbook using `TALMECH_FULL_RESEARCH_WORKBOOK`.
8. Run dry run only.
9. Review per-phase and consolidated summaries, invalid rows, duplicate candidates, same-company/different-plant rows, and discovery-only records.
10. Resolve duplicate decisions and source-verification questions.
11. Stop for explicit Talmech approval before any commit.
12. Commit first in staging only after approval.
13. Review staging records and audit events.
14. Repeat production only after backup, migration confirmation, staging dry-run success, duplicate review, and explicit production approval.
