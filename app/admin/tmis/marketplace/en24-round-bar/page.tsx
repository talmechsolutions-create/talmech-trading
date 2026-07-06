import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisMarketplaceAdminRecord } from '@/data/tmis';
import TmisAdminRecordDetail from '@/components/tmis/TmisAdminRecordDetail';

export const metadata: Metadata = {
  title: 'TMIS Admin EN24 Round Bar Marketplace Review',
  robots: { index: false, follow: false },
};

export default function AdminTmisMarketplaceEn24RoundBarPage() {
  const record = findTmisMarketplaceAdminRecord('en24-round-bar');
  if (!record) notFound();
  return <TmisAdminRecordDetail record={record} />;
}
