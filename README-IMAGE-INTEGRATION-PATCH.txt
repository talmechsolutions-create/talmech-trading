Talmech Trading — Generated Image Integration Patch

Copy the folders in this ZIP into your existing project root and replace files when asked.

Included generated images:
public/images/metal-categories/steel.webp
public/images/metal-categories/copper.webp
public/images/metal-categories/aluminum.webp
public/images/metal-categories/brass.webp
public/images/metal-categories/iron.webp
public/images/metal-categories/zinc.webp
public/images/metal-categories/nickel.webp
public/images/metal-categories/lead.webp
public/images/metal-categories/forging-components.webp
public/images/metal-categories/aerospace-precision-components.webp

Image format:
- 1200 x 800 px
- WebP
- Optimized for website category cards, metal pages, product detail pages and marketplace fallback images.

Code files included:
components/PublicMarketplace.tsx
app/metal-products/page.tsx
app/metals/page.tsx
app/metals/[metal]/page.tsx
app/products/[product]/page.tsx
app/globals.css

After copying:
npm run dev

Then check:
http://localhost:3000/metal-products
http://localhost:3000/metals
http://localhost:3000/metals/steel
http://localhost:3000/public-marketplace

Notes:
- User-uploaded images still take first priority in marketplace listing cards.
- If a listing has no uploaded image, the correct generated category image is used automatically.
- Admin portal remains unchanged.
