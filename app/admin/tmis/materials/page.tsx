import type { Metadata } from 'next';
import { tmisMaterials } from '@/data/tmis';
import { TmisAdminEntityTable } from '@/components/tmis/TmisAdminTables';

export const metadata: Metadata = {
  title: 'Admin TMIS Materials',
  robots: { index: false, follow: false },
};

export default function AdminTmisMaterialsPage() {
  return (
    <TmisAdminEntityTable
      active="materials"
      title="TMIS material records"
      description="Review draft material-family records before any publishing or verification workflow exists."
      rows={tmisMaterials}
    />
  );
}
