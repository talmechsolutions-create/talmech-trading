import type { Metadata } from 'next';
import AdminListingsConsole from '@/components/AdminListingsConsole';
import { listListings } from '@/lib/proDb';

export const metadata: Metadata = {
  title: 'Admin Marketplace Listings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminListingsPage() {
  const listings = await listListings(false);
  return <AdminListingsConsole initialListings={listings} />;
}
