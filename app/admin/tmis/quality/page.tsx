import type { Metadata } from 'next';
import { tmisQualityRecords } from '@/data/tmis';
import { TmisAdminEntityTable } from '@/components/tmis/TmisAdminTables';

export const metadata: Metadata = {
  title: 'Admin TMIS Quality',
  robots: { index: false, follow: false },
};

export default function AdminTmisQualityPage() {
  return (
    <TmisAdminEntityTable
      active="quality"
      title="TMIS quality records"
      description="Review draft quality-test and certificate records before using them in procurement or inspection decisions."
      rows={tmisQualityRecords}
    />
  );
}
