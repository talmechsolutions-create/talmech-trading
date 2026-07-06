import type { Metadata } from 'next';
import TmisPlanningWorkspace from '@/components/tmis/TmisPlanningWorkspace';

export const metadata: Metadata = {
  title: 'TMIS Seller Planning | Draft Supplier Onboarding Workspace',
  description:
    'Draft TMIS seller planning table for supplier categories, metals supported, product forms, capabilities, documents, onboarding questions, and priority levels.',
  alternates: { canonical: '/tmis/planning/sellers' },
};

export default function TmisSellerPlanningPage() {
  return (
    <main className="tmisPlanningShell">
      <TmisPlanningWorkspace view="sellers" />
    </main>
  );
}
