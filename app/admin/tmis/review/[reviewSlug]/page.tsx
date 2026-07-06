import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisReviewRecord, tmisReviewQueueItems } from '@/data/tmis';
import TmisAdminReviewDetail from '@/components/tmis/TmisAdminReviewDetail';

export const metadata: Metadata = {
  title: 'TMIS Admin Review Detail',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return tmisReviewQueueItems.map((record) => ({ reviewSlug: record.reviewSlug }));
}

export default function AdminTmisReviewDetailPage({ params }: { params: { reviewSlug: string } }) {
  const record = findTmisReviewRecord(params.reviewSlug);
  if (!record) notFound();
  return <TmisAdminReviewDetail record={record} />;
}
