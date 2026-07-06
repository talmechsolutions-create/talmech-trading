import type { Metadata } from 'next';
import TmisPlanningWorkspace from '@/components/tmis/TmisPlanningWorkspace';

export const metadata: Metadata = {
  title: 'TMIS Buyer Planning | Draft Buyer Targeting Workspace',
  description:
    'Draft TMIS buyer planning table for industries, metals, product forms, quality expectations, certificates, targeting notes, and priority levels.',
  alternates: { canonical: '/tmis/planning/buyers' },
};

export default function TmisBuyerPlanningPage() {
  return (
    <main className="tmisPlanningShell">
      <TmisPlanningWorkspace view="buyers" />
    </main>
  );
}
