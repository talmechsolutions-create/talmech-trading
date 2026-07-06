import type { Metadata } from 'next';
import { findTmisProcurementChecklist } from '@/lib/tmisData';
import TmisRfqChecklistView from '@/components/tmis/TmisRfqChecklistView';

const checklist = findTmisProcurementChecklist('en24-round-bar');

export const metadata: Metadata = {
  title: checklist?.seoTitle || 'EN24 Round Bar RFQ Checklist',
  description: checklist?.metaDescription || 'Draft TMIS EN24 Round Bar RFQ checklist.',
  alternates: { canonical: '/manufacturing-intelligence/rfq/en24-round-bar' },
};

export default function En24RfqPage() {
  if (!checklist) return null;
  return <TmisRfqChecklistView checklist={checklist} />;
}
