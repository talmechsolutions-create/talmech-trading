import type { Metadata } from 'next';
import { findTmisGrade } from '@/data/tmis';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const en24 = findTmisGrade('en24');

export const metadata: Metadata = {
  title: en24?.seoTitle || 'EN24 Grade Intelligence',
  description: en24?.metaDescription || 'Draft TMIS EN24 material grade record.',
  alternates: { canonical: '/grades/en24' },
};

export default function En24GradePage() {
  if (!en24) return null;
  return (
    <TmisRecordView
      entity={en24}
      primaryAction={{ label: 'Open EN24 Round Bar', href: '/products/en24-round-bar' }}
      secondaryAction={{ label: 'Prepare EN24 RFQ', href: '/rfq/en24-round-bar' }}
    />
  );
}
