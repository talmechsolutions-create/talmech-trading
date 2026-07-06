# Talmech Logistics Module Patch

This build adds a scalable logistics management module to the existing Talmech Trading marketplace.

## Public website

- `/logistics` is now public and added to the website menu.
- Buyers, dealers and suppliers can filter logistics providers by country/state/city, service type, product, load, required date and payment responsibility.
- The page shows admin-approved or contract-pending logistics providers serving the pickup city.
- The system suggests the nearest/default logistics partner based on pickup coverage, delivery coverage, service fit, availability, capacity, proximity and estimated cost.
- The page is mobile responsive using the existing grid/card system and includes SEO metadata.

## Admin portal

- New protected route: `/admin-logistics`.
- Admin can add, edit, remove and export logistics vendors.
- Admin controls serviceable countries, states, cities, nearby regions, services, specializations, fleet/capacity, availability, unavailable dates and pricing.
- Admin controls pricing rules only because logistics vendors are external partners.
- Contract status is tracked with `NOT_SENT`, `SENT`, `SIGNED`, `EXPIRED`.
- Vendor onboarding confirmation email is sent/queued when a provider is created.
- Admin dashboard now links to Logistics Vendors.

## API and storage

- Public matching API: `/api/logistics`
  - `GET`: list public logistics providers by location/service filters.
  - `POST`: calculate vehicle quotes, match logistics providers and return a default suggested provider.
- Protected admin API: `/api/logistics-providers`
  - `GET`: list/export providers.
  - `POST`: create provider and queue/send onboarding email.
  - `PATCH`: update provider.
  - `DELETE`: remove provider.
- JSON fallback storage added: `data/logistics-providers.json`.
- Prisma schema added: `LogisticsProvider` model.

## Invoice/payment integration

- Price-lock creation can now accept logistics fields:
  - `logisticsPickup`
  - `logisticsDrop`
  - `logisticsProviderId`
  - `logisticsPaymentResponsibility`: `BUYER`, `SELLER`, or `SPLIT`
  - `logisticsScheduleDate`
- If pickup/drop are supplied, the server auto-selects a provider when no provider ID is passed.
- Buyer payable estimate includes buyer-paid logistics cost.
- Invoice and payment pages show logistics cost and buyer logistics payable when present.
- Admin price-lock console shows selected provider, freight and freight payer rule.

## Contract/onboarding note

Before assigning real orders to a logistics vendor, Talmech should collect and approve:

- GST certificate
- PAN
- transport rate card
- vehicle/fleet documents
- driver/KYC process
- insurance responsibility
- damage/liability clause
- loading/unloading responsibility
- detention/waiting charges
- cancellation terms
- payment cycle
- confidentiality clause
- route SLA
- dispute-resolution terms

## Deployment steps

After replacing the project files:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

If `DATABASE_URL` is not configured, the module uses JSON fallback data and seeded default providers.
