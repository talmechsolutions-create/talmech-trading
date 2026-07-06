#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dataDir = path.join(root, 'data');
const forceProduction = process.argv.includes('--force-production');
const dryRun = process.argv.includes('--dry-run');

const files = [
  'public-leads.json',
  'public-requirements.json',
  'marketplace-listings.json',
  'price-locks.json',
  'crm-leads.json',
  'user-buyers.json',
  'user-sellers.json',
  'user-traders.json',
  'payments.json',
  'invoices.json',
  'admin-payouts.json',
  'email-outbox.json',
];

if (process.env.NODE_ENV === 'production' && !forceProduction) {
  console.error('Refusing to clean local JSON data while NODE_ENV=production. Use --force-production only for a controlled local reset.');
  process.exit(1);
}

fs.mkdirSync(dataDir, { recursive: true });

for (const fileName of files) {
  const filePath = path.join(dataDir, fileName);
  const relative = path.relative(root, filePath);

  if (dryRun) {
    console.log(`[dry-run] would reset ${relative}`);
    continue;
  }

  fs.writeFileSync(filePath, '[]\n', 'utf8');
  console.log(`reset ${relative}`);
}

console.log(dryRun ? 'Dry run complete.' : 'Local JSON fallback data reset complete.');
