# Talmech Trading Platform - Public Marketplace + Admin Portal

This merged project combines the public Talmech Trading marketplace and the locked admin/internal system into one professional Next.js platform.

## Main routes

Public:
- `/`
- `/public-marketplace`
- `/post-requirement`
- `/sell`
- `/signin`
- `/metals`
- `/metal-products`
- `/products/[product]`

Admin/protected:
- `/dashboard`
- `/admin`
- `/admin-leads`
- `/admin-users`
- `/crm`
- `/logistics`
- `/supplier-search`
- `/industry-search`
- `/strategy`
- `/knowledge`
- `/invoices`

## Admin login

The public website does not show an Admin button. Open the protected routes directly:

```txt
http://localhost:3000/dashboard
```

Default credentials are in `.env.example`:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change_this_admin_password"
```

## Database architecture

The project now includes Prisma and a production-ready PostgreSQL schema:

```txt
prisma/schema.prisma
```

Core tables:
- `UserRegistration`
- `PublicLead`
- `MarketplaceListing`
- `PriceLock`
- `CrmLead`
- `Invoice`
- `Payment`
- `EmailOutbox`
- `AdminAction`

If `DATABASE_URL` is blank, the platform continues using local JSON fallback in `data/` so you can test without paying for database hosting.

For production, use Supabase or Neon PostgreSQL and set:

```env
DATABASE_URL="postgresql://..."
```

Then run:

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

## Shared data flow

```txt
Public website registration/posting
→ API route
→ PostgreSQL database / JSON fallback
→ Locked admin portal
→ CRM import / approval / listing control
```

The public site and admin now share the same data layer. Do not maintain separate public/admin project data folders in production.

## Images and uploads

Current MVP supports inline image previews and JSON fallback. For production, connect Cloudinary or Supabase Storage and store only file URLs in the database.

Recommended production storage fields:
- `image_url`
- `document_url`
- `uploaded_by_user_id`
- `listing_id`

## Price-lock and commission

The platform includes:
- 5% service-fee calculation
- 25% price-lock advance calculation
- price-lock record creation
- invoice/proforma workflow foundation

Real payment collection should be connected to Razorpay/Cashfree before accepting money.

## Marketing/admin tools included

- User approval console
- Website leads console
- Marketplace listing management
- CSV export
- CRM import
- Supplier finder
- Buyer finder
- Logistics planner
- AI strategy pages
- Knowledge hub
