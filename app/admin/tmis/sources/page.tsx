import type { Metadata } from 'next';
import { TmisAdminSourcesTable } from '@/components/tmis/TmisAdminTables';

export const metadata: Metadata = {
  title: 'Admin TMIS Sources',
  robots: { index: false, follow: false },
};

export default function AdminTmisSourcesPage() {
  return <TmisAdminSourcesTable />;
}
