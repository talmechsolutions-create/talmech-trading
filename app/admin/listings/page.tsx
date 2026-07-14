import type { Metadata } from 'next';
import AdminDataLoadError from '@/components/AdminDataLoadError';
import AdminListingsConsole from '@/components/AdminListingsConsole';
import { loadAdminData } from '@/lib/adminSsr';
import { generateListingStrategy } from '@/lib/listingIntelligence';
import { listListings } from '@/lib/proDb';

export const metadata: Metadata = {
  title: 'Admin Marketplace Listings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminListingsPage() {
  const { data: listings, error } = await loadAdminData('/admin/listings', () => listListings(false), []);
  if (error) return <AdminDataLoadError title="Admin marketplace listings" route="/admin/listings" error={error} />;
  const strategies = Object.fromEntries(listings.map((listing: any) => [listing.id, generateListingStrategy(listing)]));
  return <AdminListingsConsole initialListings={listings} initialStrategies={strategies} />;
}
