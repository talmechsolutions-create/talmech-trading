import type { Metadata } from 'next';
import TmisPlanningWorkspace from '@/components/tmis/TmisPlanningWorkspace';

export const metadata: Metadata = {
  title: 'TMIS Opportunity Map | Draft Buyer Seller Marketplace Planning',
  description:
    'Draft TMIS opportunity map connecting metals, grades, product forms, target buyers, target sellers, quality focus, RFQ priority, and business reason.',
  alternates: { canonical: '/tmis/planning/opportunities' },
};

export default function TmisPlanningOpportunitiesPage() {
  return (
    <main className="tmisPlanningShell">
      <TmisPlanningWorkspace view="opportunities" />
    </main>
  );
}
