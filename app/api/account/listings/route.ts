import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionUser } from '@/lib/clientAuth';
import { listListings } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';
import { createWorkspaceListing } from '@/lib/workspaceListings';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function ownsListing(listing: any, user: any) {
  const raw = listing?.raw || {};
  return raw.ownerUserId === user.id || raw.accountId === user.id || raw.ownerEmail === user.email || raw.ownerMobile === user.primaryMobile;
}

export async function GET(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  try {
    const listings = (await listListings(false)).filter((listing: any) => ownsListing(listing, user));
    return NextResponse.json({ ok: true, listings, updatedAt: new Date().toISOString() });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    console.error('ACCOUNT_LISTINGS_GET_FAILED', error);
    return NextResponse.json({ ok: false, error: 'Unable to load account listings.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!sanitizeString(body.metal, 80) || !sanitizeString(body.product, 140)) {
    return NextResponse.json({ ok: false, error: 'Metal and product are required.' }, { status: 400 });
  }
  try {
    const listing = await createWorkspaceListing({
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
      source: 'client-workspace',
      createdByAdmin: false,
      approved: false,
      prefix: 'LIST-CL',
    });
    return NextResponse.json({ ok: true, listing });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to create listing.' }, { status: 500 });
  }
}
