import type { Metadata } from 'next';
import { findTmisProduct } from '@/lib/tmisData';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const product = findTmisProduct('en24-round-bar');

export const metadata: Metadata = {
  title: product?.seoTitle || 'EN24 Round Bar Intelligence',
  description: product?.metaDescription || 'Draft TMIS EN24 Round Bar product record.',
  alternates: { canonical: '/manufacturing-intelligence/products/en24-round-bar' },
};

export default function En24RoundBarPage() {
  if (!product) return null;
  return (
    <TmisRecordView
      entity={product}
      primaryAction={{ label: 'Build RFQ checklist', href: '/manufacturing-intelligence/rfq/en24-round-bar' }}
      secondaryAction={{ label: 'Search public marketplace', href: '/public-marketplace?product=EN24%20Round%20Bar&metal=steel' }}
    />
  );
}
