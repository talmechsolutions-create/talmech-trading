import type { Metadata } from 'next';
import { findTmisQualityRecord } from '@/data/tmis';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const record = findTmisQualityRecord('material-test-certificate');

export const metadata: Metadata = {
  title: record?.seoTitle || 'Material Test Certificate Intelligence',
  description: record?.metaDescription || 'Draft TMIS Material Test Certificate quality record.',
  alternates: { canonical: '/quality/material-test-certificate' },
};

export default function MaterialTestCertificatePage() {
  if (!record) return null;
  return (
    <TmisRecordView
      entity={record}
      primaryAction={{ label: 'Build EN24 RFQ', href: '/rfq/en24-round-bar' }}
      secondaryAction={{ label: 'Open EN24 Round Bar', href: '/products/en24-round-bar' }}
    />
  );
}
