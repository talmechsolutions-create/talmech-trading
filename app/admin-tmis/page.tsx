import type { Metadata } from 'next';
import TmisAdminDashboard from '@/components/tmis/TmisAdminDashboard';

export const metadata: Metadata = {
  title: 'Admin TMIS Review Dashboard',
  robots: { index: false, follow: false },
};

export default function AdminTmisPage() {
  return <TmisAdminDashboard />;
}
