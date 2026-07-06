import type { Metadata } from 'next';
import TmisAdminShell from '@/components/tmis/TmisAdminShell';
import TmisPlanningWorkspace from '@/components/tmis/TmisPlanningWorkspace';

export const metadata: Metadata = {
  title: 'Admin TMIS Buyer Seller Planning',
  robots: { index: false, follow: false },
};

export default function AdminTmisPlanningPage() {
  return (
    <TmisAdminShell
      active="planning"
      title="Buyer & seller planning"
      description="Phase 3A planning workspace for target buyers, sellers, metals, grades, product forms, quality needs, certificates, and RFQ priority. No database writes are enabled."
    >
      <TmisPlanningWorkspace view="overview" surface="admin" />
    </TmisAdminShell>
  );
}
