import type { Metadata } from 'next';
import TmisMaterialsIndexPage from '@/components/tmis/TmisMaterialsIndexPage';

export const metadata: Metadata = {
  title: 'TMIS Materials | Draft Manufacturing Intelligence Records',
  description:
    'Draft TMIS material records for Talmech Manufacturing Intelligence System, with review status, confidence labels, source documents, and public procurement links.',
  alternates: { canonical: '/materials' },
};

export default function MaterialsPage() {
  return <TmisMaterialsIndexPage />;
}
