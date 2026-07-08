import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { hashAdminAssistedPassword } from '@/lib/adminAssistedAccounts';
import { sendClientListingNotification } from '@/lib/clientNotifications';
import { findListing, findUser, updateUserRegistrationRecord } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

function temporaryPassword() {
  return `${randomBytes(9).toString('base64url')}T7!`;
}

function ownerKey(listing: any) {
  const raw = listing?.raw || {};
  return raw.accountId || raw.ownerUserId || raw.ownerEmail || raw.ownerMobile || '';
}

export async function POST(req: NextRequest, { params }: { params: { listingId: string } }) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const listing = await findListing(params.listingId);
    if (!listing) return NextResponse.json({ ok: false, error: 'Listing not found.' }, { status: 404 });

    const user = await findUser(ownerKey(listing));
    if (!user) return NextResponse.json({ ok: false, error: 'Linked client account was not found.' }, { status: 404 });

    let password = '';
    if (user.adminCreated && user.mustChangePassword) {
      password = temporaryPassword();
      await updateUserRegistrationRecord(user.id, {
        ...hashAdminAssistedPassword(password),
        temporaryPasswordIssuedAt: new Date().toISOString(),
        activationStatus: 'activated',
        mustChangePassword: true,
      });
    }

    const email = await sendClientListingNotification({
      user,
      listing,
      temporaryPassword: password,
      notificationType: password ? 'client_account_listing_created' : 'client_follow_up_required',
    });

    return NextResponse.json({
      ok: true,
      email: {
        status: email.status,
        provider: email.provider,
        tracking: email.tracking,
      },
      missingInformation: email.missingInformation || [],
      manualCopy: email.status !== 'sent' ? {
        temporaryPassword: password,
        instructions: email.text,
      } : undefined,
    });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to resend client email.' }, { status: 500 });
  }
}
