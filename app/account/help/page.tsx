import type { Metadata } from 'next';
import AccountWorkspace from '@/components/AccountWorkspace';

export const metadata: Metadata = { title: 'Account Help', robots: { index: false, follow: false } };

export default function AccountHelpPage() {
  return <AccountWorkspace view="help" />;
}
