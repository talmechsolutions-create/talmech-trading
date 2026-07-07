import type { Metadata } from 'next';
import AdminListingsConsole from '@/components/AdminListingsConsole';
import { generateListingStrategy } from '@/lib/listingIntelligence';
import { listListings } from '@/lib/proDb';

export const metadata: Metadata = {
  title: 'Admin Marketplace Listings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminListingsPage() {
  const listings = await listListings(false);
  const strategies = Object.fromEntries(listings.map((listing: any) => [listing.id, generateListingStrategy(listing)]));
  return <AdminListingsConsole initialListings={listings} initialStrategies={strategies} />;
}
