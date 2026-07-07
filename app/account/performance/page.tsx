import type { Metadata } from 'next';
import AccountWorkspace from '@/components/AccountWorkspace';

export const metadata: Metadata = { title: 'Account Performance', robots: { index: false, follow: false } };

export default function AccountPerformancePage() {
  return <AccountWorkspace view="performance" />;
}
