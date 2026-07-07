import type { Metadata } from 'next';
import AccountWorkspace from '@/components/AccountWorkspace';

export const metadata: Metadata = { title: 'Client Workspace', robots: { index: false, follow: false } };

export default function AccountPage() {
  return <AccountWorkspace view="dashboard" />;
}
