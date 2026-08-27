# Industrial CRM Phase 3 Result

Date: 2026-08-27

Phase 3 implemented the deterministic normalization and duplicate-detection foundation for Talmech Industrial Intelligence. It did not import Google Sheet data, build XLSX/CSV upload, write master records, apply migrations, promote anything to CRM or Outreach, or change Marketplace behavior.

## Normalization Layer

Added a dedicated Industrial Intelligence normalization package under `lib/industrial/`.

Normalizers added:
- company name normalization that preserves the original/display value and creates a separate matching key for casing, punctuation, common legal suffixes, whitespace, `&`/`and`, and spaced initials such as `T K` -> `tk`.
- official domain normalization for protocol, `www`, path, query, hash, case, and trailing slash handling. Non-`www` subdomains are preserved.
- GSTIN normalization with uppercase/separator cleanup and conservative format validation.
- India-aware phone normalization to E.164-style values only when context is known or the number is explicit. Unknown context does not manufacture `+91`.
- email normalization for trim/case and basic shape validation.
- location normalization for country, region, state, district, city, cluster, industrial area, PIN code, and address. India aliases cover `UP`/`U.P.`/`Uttar Pradesh`, `MP`/`M.P.`/`Madhya Pradesh`, `Orissa`/`Odisha`, `Delhi`/`New Delhi`, `Bangalore`/`Bengaluru`, and `Bombay`/`Mumbai`.
- department normalization into controlled application categories while preserving designation text separately.
- process normalization into the approved forging/steel/other manufacturing taxonomy.
- service opportunity normalization into the approved `IndustrialServiceType` enum values.

## Duplicate Engine

Added a pure candidate-scoring engine for:
- company duplicate candidates,
- plant duplicate candidates,
- contact duplicate candidates.

The engine returns:
- candidate type,
- incoming entity,
- existing entity,
- score,
- confidence,
- signals,
- conflicts,
- recommended disposition.

Recommended dispositions:
- `LIKELY_DUPLICATE`
- `POSSIBLE_DUPLICATE`
- `SAME_COMPANY_DIFFERENT_PLANT`
- `CONTACT_MATCH`
- `NO_MATCH`
- `MANUAL_REVIEW`

No function executes merges or writes duplicate resolutions.

## Candidate Ranking

Strong signals:
- normalized GSTIN exact match,
- official domain exact match,
- normalized phone exact match,
- normalized WhatsApp exact match,
- normalized email exact match,
- plant code exact match.

Medium signals:
- normalized company name,
- same parent company,
- company/plant city,
- state,
- industrial cluster,
- PIN code,
- address similarity,
- person name,
- department.

Weak signals:
- conservative deterministic Levenshtein name similarity.

Fuzzy similarity only creates review candidates. It is never treated as an automatic merge rule.

## Plant-Aware Safeguards

Plant matching is separate from company matching. The engine explicitly detects:
- same normalized parent company plus different plant/unit markers,
- same normalized parent company plus different plant cities.

Those cases return `SAME_COMPANY_DIFFERENT_PLANT` instead of a plant merge recommendation. This protects examples such as:
- Ramkrishna Forgings Plant I vs Plant V,
- Tata Steel Jamshedpur vs Tata Steel Kalinganagar.

## Prisma Matcher

Added `findIndustrialDuplicateCandidates()` as a bounded Prisma-backed matcher for future importer dry runs.

It narrows candidates using indexed fields first:
- `IndustrialCompany.gstin`
- `IndustrialCompany.officialDomain`
- `IndustrialCompany.normalizedName`
- `IndustrialCompany.normalizedName + city`
- `IndustrialCompany.normalizedName + state`
- `IndustrialPlant.companyId`
- `IndustrialPlant.companyId + normalizedPlantName`
- `IndustrialPlant.companyId + city`
- `IndustrialPlant.pincode`
- `IndustrialContact.normalizedPhone`
- `IndustrialContact.normalizedWhatsapp`
- `IndustrialContact.normalizedEmail`

It uses explicit `select` projections, `take: 25`, and scoring after narrowing. It avoids full-table scans and does not load the national database into memory.

## PII Handling

Phone and email normalization functions return values to callers but do not log them. The matcher does not place normalized contact points in URLs, console logs, errors, or audit metadata. Future importer/audit integration should continue using `lib/security/industrialAudit.ts` redaction for row-level events.

## Schema And Migration Status

No Prisma schema change was required. Phase 1 already added `IndustrialDuplicateCandidate` and `IndustrialDuplicateResolution` with the needed indexed fields.

Migration created: no.

Migration applied: no.

## Tests

Added:
- `scripts/industrial-intelligence-phase3-tests.js`

Coverage includes:
- requested company-name equivalences,
- requested phone, email, domain, GSTIN, state, city, department, process, and service-opportunity examples,
- false-positive protection for `ABC Steel Industries` vs `ABC Steel Traders`,
- false-positive protection for Ramkrishna multi-plant records,
- false-positive protection for Tata Steel multi-plant records,
- conservative phone-only contact review behavior.

Verified:
- `node scripts\industrial-intelligence-phase3-tests.js`
- `npm run typecheck`

## Phase 4 Importer Contract

Before committing records, the Phase 4 importer should:

1. Parse source rows into raw staging rows.
2. Build typed normalized inputs:
   - `NormalizedCompanyInput`
   - `NormalizedPlantInput`
   - `NormalizedContactInput`
   - `NormalizedCapabilityInput`
   - `NormalizedOpportunityInput`
   - `NormalizedSourceInput`
3. Preserve raw/source values in staging and use normalized values only for matching fields.
4. Call company, domain, GSTIN, phone, email, location, department, process, and service opportunity normalizers.
5. Validate required normalized fields and collect row-level validation issues.
6. Call `findIndustrialDuplicateCandidates()` for each valid normalized candidate record.
7. Store duplicate candidate analysis in `IndustrialDuplicateCandidate` during dry run.
8. Require admin review for conflicts, fuzzy candidates, and plant-aware ambiguity.
9. Commit only approved rows after duplicate decisions are resolved.
10. Write redacted audit events and never log raw phone/email values.

Do not begin Phase 4 automatically.
