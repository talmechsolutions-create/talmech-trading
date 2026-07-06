import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisAdminRecordByAreaSlug } from '@/data/tmis';
import TmisAdminRecordDetail from '@/components/tmis/TmisAdminRecordDetail';

export const metadata: Metadata = {
  title: 'TMIS Admin Material Test Certificate Review',
  robots: { index: false, follow: false },
};

export default function AdminTmisMaterialTestCertificatePage() {
  const record = findTmisAdminRecordByAreaSlug('quality', 'material-test-certificate');
  if (!record) notFound();
  return <TmisAdminRecordDetail record={record} />;
}
