import type { Metadata } from 'next';
import { findTmisMaterial } from '@/data/tmis';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const steel = findTmisMaterial('steel');

export const metadata: Metadata = {
  title: steel?.seoTitle || 'Steel Material Intelligence',
  description: steel?.metaDescription || 'Draft TMIS steel material record.',
  alternates: { canonical: '/materials/steel' },
};

export default function SteelMaterialPage() {
  if (!steel) return null;
  return (
    <TmisRecordView
      entity={steel}
      primaryAction={{ label: 'Review EN24 grade', href: '/grades/en24' }}
      secondaryAction={{ label: 'Open materials index', href: '/materials' }}
    />
  );
}
