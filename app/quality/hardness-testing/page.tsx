import type { Metadata } from 'next';
import { findTmisQualityRecord } from '@/data/tmis';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const record = findTmisQualityRecord('hardness-testing');

export const metadata: Metadata = {
  title: record?.seoTitle || 'Hardness Testing Intelligence',
  description: record?.metaDescription || 'Draft TMIS hardness testing quality record.',
  alternates: { canonical: '/quality/hardness-testing' },
};

export default function HardnessTestingPage() {
  if (!record) return null;
  return (
    <TmisRecordView
      entity={record}
      primaryAction={{ label: 'Open EN24 page', href: '/grades/en24' }}
      secondaryAction={{ label: 'Review MTC guide', href: '/quality/material-test-certificate' }}
    />
  );
}
