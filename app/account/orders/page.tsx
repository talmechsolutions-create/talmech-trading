import type { Metadata } from 'next';
import AccountWorkspace from '@/components/AccountWorkspace';

export const metadata: Metadata = { title: 'Account Orders', robots: { index: false, follow: false } };

export default function AccountOrdersPage() {
  return <AccountWorkspace view="orders" />;
}
