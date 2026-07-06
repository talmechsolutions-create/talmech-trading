import type { Metadata } from 'next';
import TmisMetalsIndexPage from '@/components/tmis/TmisMetalsIndexPage';

export const metadata: Metadata = {
  title: 'TMIS Metal Intelligence Workspace | Steel, Copper, Aluminium, Stainless Steel and Brass',
  description:
    'Draft TMIS metal intelligence workspace for understanding metals, buyer categories, seller planning, quality checks, RFQs, and marketplace opportunities.',
  alternates: { canonical: '/tmis/metals' },
};

export default function TmisMetalsPage() {
  return <TmisMetalsIndexPage />;
}
