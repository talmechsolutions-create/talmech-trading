import type { Metadata } from 'next';
import { findTmisMaterial } from '@/lib/tmisData';
import TmisRecordView from '@/components/tmis/TmisRecordView';

const steel = findTmisMaterial('steel');

export const metadata: Metadata = {
  title: steel?.seoTitle || 'Steel Material Intelligence',
  description: steel?.metaDescription || 'Draft TMIS steel material record.',
  alternates: { canonical: '/manufacturing-intelligence/materials/steel' },
};

export default function SteelMaterialPage() {
  if (!steel) return null;
  return (
    <TmisRecordView
      entity={steel}
      primaryAction={{ label: 'Review EN24 grade', href: '/manufacturing-intelligence/grades/en24' }}
      secondaryAction={{ label: 'Open materials index', href: '/manufacturing-intelligence/materials' }}
    />
  );
}
