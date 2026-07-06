# Talmech Trading SEO, UI and Admin Security Fixes

## What changed

### Public UI/UX
- Rebuilt the homepage into a content-rich, trust-oriented marketplace landing page.
- Added professional contact page at `/contact`.
- Connected product-level images from `public/images/products` and category images from `public/images/metal-categories`.
- Improved metal detail pages and product guide pages so every product card uses the correct product image where available.
- Added stronger buyer/seller/logistics messaging without making the site look like a generic AI-generated template.

### SEO foundation
- Added stronger global metadata, Open Graph and Twitter card metadata.
- Added `WebSite`, `Organization`, and `ContactPage` JSON-LD structured data.
- Added `/contact` into sitemap and public routing.
- Expanded sitemap to include all product pages, not only first few products.
- Robots blocks admin, APIs and internal CRM/admin pages.
- Added better page titles/descriptions for homepage, contact, metal pages and product pages.

SEO note: no developer can honestly guarantee 100% SEO or top Google ranking. This version implements the technical foundation. Ranking will also depend on domain authority, backlinks, page speed, content depth, Core Web Vitals, real user engagement and ongoing content updates.

### Admin security
- Added private `/admin-login` page.
- Admin routes now redirect to `/admin-login` if there is no valid admin session.
- Added HttpOnly admin session cookie via `/api/admin-session`.
- Protected admin-only API operations behind admin session checks.
- Admin routes remain hidden from public header/footer and blocked from indexing.
- Security headers added in middleware.

## Required environment variables

Add these to `.env.local`:

```env
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change_this_admin_password"
ADMIN_SESSION_SECRET="replace_this_with_a_long_random_secret_before_production"
DATABASE_URL=""
```

For production, use a real PostgreSQL database such as Supabase or Neon and set `DATABASE_URL`.

## Admin routes

Open admin through:

```text
/admin-login
/dashboard
/admin-leads
/admin-users
/admin-price-locks
/crm
```

## Run

```bash
npm install
npm run dev
```

For database production setup:

```bash
npm run db:generate
npm run db:push
```
