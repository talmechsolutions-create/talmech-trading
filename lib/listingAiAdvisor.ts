import { generateListingStrategy } from '@/lib/listingIntelligence';

function redactListingForAdvisor(listing: any) {
  const raw = listing?.raw && typeof listing.raw === 'object' ? { ...listing.raw } : {};
  [
    'ownerEmail',
    'ownerMobile',
    'email',
    'mobile',
    'alternateMobile',
    'gstNumber',
    'contactPerson',
    'accountId',
    'ownerUserId',
  ].forEach((key) => delete raw[key]);

  return {
    id: listing?.id,
    type: listing?.type,
    metal: listing?.metal,
    product: listing?.product,
    grade: listing?.grade,
    productForm: listing?.productForm || raw.productForm,
    quantity: listing?.quantity,
    unit: listing?.unit,
    city: listing?.city,
    state: listing?.state,
    status: listing?.status,
    raw,
  };
}

export async function adviseListingStrategy(listing: any) {
  const provider = process.env.LISTING_AI_PROVIDER || '';
  const apiKey = process.env.LISTING_AI_API_KEY || '';
  const model = process.env.LISTING_AI_MODEL || '';

  if (!provider || !apiKey || !model) {
    return {
      mode: 'rules-based',
      configured: false,
      status: 'AI advisor not configured',
      strategy: generateListingStrategy(listing),
    };
  }

  return {
    mode: 'rules-based',
    configured: true,
    status: 'AI provider hook configured but external calls are disabled until reviewed.',
    redactedPayload: redactListingForAdvisor(listing),
    strategy: generateListingStrategy(listing),
  };
}
