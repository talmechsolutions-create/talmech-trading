import type { Metadata } from 'next';
import { findTmisMarketplaceListing } from '@/data/tmis';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const listing = findTmisMarketplaceListing('en24-round-bar');

export const metadata: Metadata = {
  title: listing?.seoTitle || 'EN24 Round Bar Marketplace Draft',
  description: listing?.metaDescription || 'Draft TMIS marketplace record for EN24 Round Bar.',
  alternates: { canonical: '/marketplace/en24-round-bar' },
};

export default function En24MarketplacePage() {
  if (!listing) return null;
  return (
    <TmisRecordView
      entity={listing}
      primaryAction={{ label: 'Create RFQ checklist', href: '/rfq/en24-round-bar' }}
      secondaryAction={{ label: 'Open public marketplace', href: '/public-marketplace?product=EN24%20Round%20Bar&metal=steel' }}
    />
  );
}
