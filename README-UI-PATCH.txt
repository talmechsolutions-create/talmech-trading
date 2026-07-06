Talmech Trading UI/Product Hub Patch
===================================

Copy these folders into your current project root and replace existing files:

1) app/metal-products/page.tsx
   - Rebuilds the Metal Products page into a clean product knowledge hub.
   - Removes long plain text cards.
   - Adds visual category cards, product chips, buyer/grade/quality summaries.

2) components/PublicMarketplace.tsx
   - Removes the right-side hero card you marked as NOT NEEDED.
   - Keeps one clean hero section with buyer/seller view, support, and primary action buttons.
   - Improves professional wording.

3) app/globals.css
   - Adds updated responsive UI/CSS for the marketplace hero and product hub.

Image upload locations
----------------------
Create this folder in your project:

public/images/metal-categories/

Upload these images there. Use WebP format where possible. Recommended size: 1200 x 800 px, landscape, less than 250 KB each.

Required image list:
1. steel.webp                  - TMT bars, steel rods, MS channels, structural steel stock
2. copper.webp                 - copper coils, copper rods, copper wire bundles
3. aluminum.webp               - aluminum extrusion profiles, billets or sheets
4. brass.webp                  - brass rods, fittings, turned components
5. iron.webp                   - cast iron, pig iron, foundry or sponge iron visual
6. zinc.webp                   - zinc ingots, galvanizing line, zinc die casting raw stock
7. nickel.webp                 - nickel cathode plates or alloy metal sheets
8. lead.webp                   - lead ingots / battery-grade lead stock
9. forging-components.webp     - forged shafts, gears, flanges, machined forgings
10. aerospace-precision-components.webp - CNC precision components, machined aerospace parts

Optional extra marketplace listing images:
- These are uploaded by users through the Post Requirement/Sell form.
- The current MVP stores image previews in browser/base64-backed JSON for local testing.
- For production, replace this with S3 / Cloudinary / Supabase Storage.

Image prompt examples for generating images
-------------------------------------------
Use realistic industrial product photography, not cartoon style:

steel.webp:
"realistic industrial photo of bundled TMT steel bars and MS structural sections in a warehouse, clean lighting, professional B2B marketplace product image, no text, no logo"

copper.webp:
"realistic industrial product photo of copper rods, copper coils and copper wire bundles, clean warehouse background, professional marketplace image, no text"

aluminum.webp:
"realistic industrial photo of aluminum extrusion profiles and aluminum billets stacked neatly, clean lighting, no text, B2B product marketplace style"

brass.webp:
"realistic close-up industrial photo of brass rods, brass fittings and CNC brass components, clean background, no text"

forging-components.webp:
"realistic industrial photo of forged shafts, gear blanks, flanges and machined forging components on a metal workshop table, no text"

How to apply
------------
1. Extract this patch ZIP.
2. Copy app, components, and public folders into your project root.
3. Replace files when asked.
4. Add your images into public/images/metal-categories/ using the exact filenames above.
5. Run:
   npm run dev

Checked
-------
TypeScript check passed with npx tsc --noEmit.
