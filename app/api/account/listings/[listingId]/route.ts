import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionUser } from '@/lib/clientAuth';
import { findListing, updateListing } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';
import { buildWorkspaceListing } from '@/lib/workspaceListings';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function ownsListing(listing: any, user: any) {
  const raw = listing?.raw || {};
  return raw.ownerUserId === user.id || raw.accountId === user.id || raw.ownerEmail === user.email || raw.ownerMobile === user.primaryMobile;
}

export async function PATCH(req: NextRequest, { params }: { params: { listingId: string } }) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  const existing = await findListing(params.listingId);
  if (!existing || !ownsListing(existing, user)) return NextResponse.json({ ok: false, error: 'Listing not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const rebuilt = buildWorkspaceListing({
    ...(existing.raw || {}),
    ...body,
    accountId: user.id,
    ownerUserId: user.id,
    ownerEmail: user.email,
    ownerMobile: user.primaryMobile,
    firmName: user.firmName,
    contactPerson: user.ownerName,
    listingVisibility: 'draft',
  }, {
    owner: user,
    source: existing.raw?.source || 'client-workspace',
    createdByAdmin: Boolean(existing.raw?.createdByAdmin),
    approved: false,
    prefix: 'LIST-CL',
  });

  const patch = {
    type: rebuilt.type,
    metal: rebuilt.metal,
    product: rebuilt.product,
    grade: rebuilt.grade,
    quantity: rebuilt.quantity,
    unit: rebuilt.unit,
    targetPrice: rebuilt.targetPrice,
    priceType: rebuilt.priceType,
    state: rebuilt.state,
    city: rebuilt.city,
    area: rebuilt.area,
    pincode: rebuilt.pincode,
    pickupAddress: rebuilt.pickupAddress,
    dispatchReadiness: rebuilt.dispatchReadiness,
    readyDispatchTime: rebuilt.readyDispatchTime,
    productionLeadTime: rebuilt.productionLeadTime,
    deliveryEta: rebuilt.deliveryEta,
    technicalSummary: rebuilt.technicalSummary,
    status: sanitizeString(body.status, 80) || 'Pending Admin Review',
    lockStatus: existing.lockStatus || 'Available',
    raw: { ...(existing.raw || {}), ...rebuilt.raw, listingApprovalStatus: 'Pending Admin Review', listingVisibility: 'draft' },
  };
  try {
    const listing = await updateListing(existing.id, patch);
    return NextResponse.json({ ok: true, listing });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update listing.' }, { status: 500 });
  }
}
