import type { Metadata } from 'next';
import AccountWorkspace from '@/components/AccountWorkspace';

export const metadata: Metadata = { title: 'My Listings', robots: { index: false, follow: false } };

export default function AccountListingsPage() {
  return <AccountWorkspace view="listings" />;
}
