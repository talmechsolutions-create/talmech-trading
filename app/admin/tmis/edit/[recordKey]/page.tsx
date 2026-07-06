import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisAdminRecordByKey, tmisEditableAdminRecords } from '@/data/tmis';
import TmisAdminEditPlaceholder from '@/components/tmis/TmisAdminEditPlaceholder';

export const metadata: Metadata = {
  title: 'TMIS Admin Edit Placeholder',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return tmisEditableAdminRecords.map((record) => ({ recordKey: record.key }));
}

export default function AdminTmisEditPlaceholderPage({ params }: { params: { recordKey: string } }) {
  const record = findTmisAdminRecordByKey(params.recordKey);
  if (!record) notFound();
  return <TmisAdminEditPlaceholder record={record} />;
}
