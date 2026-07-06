import type { Metadata } from 'next';
import TmisPlanningWorkspace from '@/components/tmis/TmisPlanningWorkspace';

export const metadata: Metadata = {
  title: 'TMIS Buyer & Seller Planning Workspace',
  description:
    'Draft TMIS Phase 3A planning workspace for buyer categories, seller onboarding, metal-product opportunities, quality needs, certificates, and RFQ priorities.',
  alternates: { canonical: '/tmis/planning' },
};

export default function TmisPlanningPage() {
  return (
    <main className="tmisPlanningShell">
      <TmisPlanningWorkspace view="overview" />
    </main>
  );
}
