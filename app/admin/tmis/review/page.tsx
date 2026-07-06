import type { Metadata } from 'next';
import { TmisAdminReviewQueue } from '@/components/tmis/TmisAdminTables';

export const metadata: Metadata = {
  title: 'Admin TMIS Review Queue',
  robots: { index: false, follow: false },
};

export default function AdminTmisReviewPage() {
  return <TmisAdminReviewQueue />;
}
