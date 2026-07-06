import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisAdminRecordByAreaSlug } from '@/data/tmis';
import TmisAdminRecordDetail from '@/components/tmis/TmisAdminRecordDetail';

export const metadata: Metadata = {
  title: 'TMIS Admin Hardness Testing Review',
  robots: { index: false, follow: false },
};

export default function AdminTmisHardnessTestingPage() {
  const record = findTmisAdminRecordByAreaSlug('quality', 'hardness-testing');
  if (!record) notFound();
  return <TmisAdminRecordDetail record={record} />;
}
