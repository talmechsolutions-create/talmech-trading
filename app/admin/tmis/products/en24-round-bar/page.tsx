import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisAdminRecordByAreaSlug } from '@/data/tmis';
import TmisAdminRecordDetail from '@/components/tmis/TmisAdminRecordDetail';

export const metadata: Metadata = {
  title: 'TMIS Admin EN24 Round Bar Review',
  robots: { index: false, follow: false },
};

export default function AdminTmisEn24RoundBarPage() {
  const record = findTmisAdminRecordByAreaSlug('products', 'en24-round-bar');
  if (!record) notFound();
  return <TmisAdminRecordDetail record={record} />;
}
