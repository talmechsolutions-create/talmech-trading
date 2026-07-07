import type { Metadata } from 'next';
import AccountWorkspace from '@/components/AccountWorkspace';

export const metadata: Metadata = { title: 'My Requirements', robots: { index: false, follow: false } };

export default function AccountRequirementsPage() {
  return <AccountWorkspace view="requirements" />;
}
