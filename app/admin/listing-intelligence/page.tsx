import type { Metadata } from 'next';
import AdminDataLoadError from '@/components/AdminDataLoadError';
import AdminListingIntelligence from '@/components/AdminListingIntelligence';
import { loadAdminData } from '@/lib/adminSsr';
import { analyzeListings } from '@/lib/listingIntelligence';
import { listListings } from '@/lib/proDb';

export const metadata: Metadata = {
  title: 'Listing Intelligence | Talmech Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminListingIntelligencePage() {
  const { data: listings, error } = await loadAdminData('/admin/listing-intelligence', () => listListings(false), []);
  if (error) return <AdminDataLoadError title="Listing Intelligence" route="/admin/listing-intelligence" error={error} />;
  const summary = analyzeListings(listings);
  const aiConfigured = Boolean(process.env.LISTING_AI_PROVIDER && process.env.LISTING_AI_API_KEY && process.env.LISTING_AI_MODEL);
  return <AdminListingIntelligence summary={summary} aiStatus={aiConfigured ? 'AI advisor hook configured but not active by default' : 'AI advisor not configured'} />;
}
