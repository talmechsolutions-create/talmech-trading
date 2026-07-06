import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisAdminRecordByAreaSlug } from '@/data/tmis';
import TmisAdminRecordDetail from '@/components/tmis/TmisAdminRecordDetail';

export const metadata: Metadata = {
  title: 'TMIS Admin Mild Steel Round Bar Review',
  robots: { index: false, follow: false },
};

export default function AdminTmisMildSteelRoundBarPage() {
  const record = findTmisAdminRecordByAreaSlug('products', 'mild-steel-round-bar');
  if (!record) notFound();
  return <TmisAdminRecordDetail record={record} />;
}
