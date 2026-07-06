# Talmech Trader Account Approval Patch

This build adds professional trader registration and admin approval workflow.

## Added/updated

- Public login/onboarding form now supports `Trader - buyer and seller access`.
- Trader applicants must submit commercial profile details:
  - traded metals/products
  - monthly trading volume and unit
  - domestic/international/both trade scope
  - turnover amount with Lakh/Cr unit
  - trading experience in years
  - buyer/seller/broker activity
  - GST, authorised person, address, pincode, live location
  - major markets/routes, IEC, payment cycle, warehouse/stockyard details
  - verification images/documents
- Admin user approval console now has trader filtering, CSV export and trader-specific review panel.
- Admin can approve, reject/cancel or suspend trader accounts.
- Approved trader accounts get dual marketplace mode switching between Buyer and Seller.
- Public header now shows `Trader` instead of owner name for approved trader profile.
- Role gate now links users to trader registration.
- Prisma `UserRegistration` model now stores trader approval fields.
- JSON fallback storage continues to use `data/user-traders.json` for trader registrations.

## Required after deploying

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

## Notes

- Trader access is not automatic. Admin approval is required.
- SEO routes, sitemap and robots files are preserved.
- Header/nav is still semantic and uses normal Next.js links.
- Mobile responsive CSS for trader registration, admin review and trader mode switch is included in `app/globals.css`.
