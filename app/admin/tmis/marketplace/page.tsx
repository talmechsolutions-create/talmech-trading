import type { Metadata } from 'next';
import { tmisMarketplaceListings } from '@/data/tmis';
import { TmisAdminEntityTable } from '@/components/tmis/TmisAdminTables';

export const metadata: Metadata = {
  title: 'Admin TMIS Marketplace',
  robots: { index: false, follow: false },
};

export default function AdminTmisMarketplacePage() {
  return (
    <TmisAdminEntityTable
      active="marketplace"
      title="TMIS marketplace drafts"
      description="Review draft RFQ-led marketplace listings without enabling publish, verify, or destructive delete actions."
      rows={tmisMarketplaceListings}
    />
  );
}
