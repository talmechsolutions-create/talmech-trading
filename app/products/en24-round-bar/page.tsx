import type { Metadata } from 'next';
import { findTmisProduct } from '@/data/tmis';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const product = findTmisProduct('en24-round-bar');

export const metadata: Metadata = {
  title: product?.seoTitle || 'EN24 Round Bar Intelligence',
  description: product?.metaDescription || 'Draft TMIS EN24 Round Bar product record.',
  alternates: { canonical: '/products/en24-round-bar' },
};

export default function En24RoundBarPage() {
  if (!product) return null;
  return (
    <TmisRecordView
      entity={product}
      primaryAction={{ label: 'Build RFQ checklist', href: '/rfq/en24-round-bar' }}
      secondaryAction={{ label: 'Open marketplace draft', href: '/marketplace/en24-round-bar' }}
    />
  );
}
