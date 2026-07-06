import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisAdminSourceRecord, tmisSourceAdminRecords } from '@/data/tmis';
import TmisAdminRecordDetail from '@/components/tmis/TmisAdminRecordDetail';

export const metadata: Metadata = {
  title: 'TMIS Admin Source Review',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return tmisSourceAdminRecords.map((record) => ({ sourceId: record.slug }));
}

export default function AdminTmisSourceDetailPage({ params }: { params: { sourceId: string } }) {
  const record = findTmisAdminSourceRecord(params.sourceId);
  if (!record) notFound();
  return <TmisAdminRecordDetail record={record} />;
}
