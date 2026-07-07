import type { Metadata } from 'next';
import AccountWorkspace from '@/components/AccountWorkspace';

export const metadata: Metadata = { title: 'Create Listing', robots: { index: false, follow: false } };

export default function NewAccountListingPage() {
  return <AccountWorkspace view="new-listing" />;
}
