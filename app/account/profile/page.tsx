import type { Metadata } from 'next';
import AccountWorkspace from '@/components/AccountWorkspace';

export const metadata: Metadata = { title: 'Account Profile', robots: { index: false, follow: false } };

export default function AccountProfilePage() {
  return <AccountWorkspace view="profile" />;
}
