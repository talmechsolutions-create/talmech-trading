import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisAdminRecordByAreaSlug } from '@/data/tmis';
import TmisAdminRecordDetail from '@/components/tmis/TmisAdminRecordDetail';

export const metadata: Metadata = {
  title: 'TMIS Admin Steel Review',
  robots: { index: false, follow: false },
};

export default function AdminTmisSteelPage() {
  const record = findTmisAdminRecordByAreaSlug('materials', 'steel');
  if (!record) notFound();
  return <TmisAdminRecordDetail record={record} />;
}
