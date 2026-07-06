import type { Metadata } from 'next';
import { findTmisQualityRecord } from '@/lib/tmisData';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const record = findTmisQualityRecord('hardness-testing');

export const metadata: Metadata = {
  title: record?.seoTitle || 'Hardness Testing Intelligence',
  description: record?.metaDescription || 'Draft TMIS hardness testing quality record.',
  alternates: { canonical: '/manufacturing-intelligence/quality/hardness-testing' },
};

export default function HardnessTestingPage() {
  if (!record) return null;
  return (
    <TmisRecordView
      entity={record}
      primaryAction={{ label: 'Open EN24 page', href: '/manufacturing-intelligence/grades/en24' }}
      secondaryAction={{ label: 'Review MTC guide', href: '/manufacturing-intelligence/quality/material-test-certificate' }}
    />
  );
}
