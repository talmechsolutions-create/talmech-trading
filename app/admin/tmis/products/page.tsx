import type { Metadata } from 'next';
import { tmisProducts } from '@/data/tmis';
import { TmisAdminEntityTable } from '@/components/tmis/TmisAdminTables';

export const metadata: Metadata = {
  title: 'Admin TMIS Products',
  robots: { index: false, follow: false },
};

export default function AdminTmisProductsPage() {
  return (
    <TmisAdminEntityTable
      active="products"
      title="TMIS product records"
      description="Review draft product records, buyer specification fields, supplier capability notes, and marketplace linking."
      rows={tmisProducts}
    />
  );
}
