import type { Metadata } from 'next';
import TmisHomePage from '@/components/tmis/TmisHomePage';

export const metadata: Metadata = {
  title: 'TMIS Metal Intelligence | Draft Materials, Buyers, Sellers and Marketplace Planning',
  description:
    'Talmech Manufacturing Intelligence System with draft metal intelligence, material records, buyer planning, seller planning, quality checks, RFQs, and marketplace opportunities marked needs review.',
  alternates: { canonical: '/tmis' },
};

export default function TmisPage() {
  return <TmisHomePage />;
}
