import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionUser, safeClientUser } from '@/lib/clientAuth';
import { updateUserRegistrationRecord } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';
import { isValidEmail, isValidGst, isValidIndianMobile, normalizeEmail, normalizeGst, normalizeIndianMobile, sanitizeMultiline, sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  return NextResponse.json({ ok: true, user: safeClientUser(user) });
}

export async function PATCH(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const email = body.email !== undefined ? normalizeEmail(body.email) : user.email;
  const primaryMobile = body.primaryMobile !== undefined ? normalizeIndianMobile(body.primaryMobile) : user.primaryMobile;
  const alternateMobile = body.alternateMobile !== undefined ? normalizeIndianMobile(body.alternateMobile) : user.alternateMobile;
  const gstNumber = body.gstNumber !== undefined ? normalizeGst(body.gstNumber) : user.gstNumber;

  if (email && !isValidEmail(email)) return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  if (primaryMobile && !isValidIndianMobile(primaryMobile)) return NextResponse.json({ ok: false, error: 'Enter a valid mobile number.' }, { status: 400 });
  if (alternateMobile && !isValidIndianMobile(alternateMobile)) return NextResponse.json({ ok: false, error: 'Enter a valid alternate mobile number.' }, { status: 400 });
  if (gstNumber && !isValidGst(gstNumber)) return NextResponse.json({ ok: false, error: 'Enter a valid GST number or leave it blank.' }, { status: 400 });

  const sensitiveChanged = email !== user.email || primaryMobile !== user.primaryMobile || gstNumber !== user.gstNumber;
  let updated;
  try {
    updated = await updateUserRegistrationRecord(user.id, {
      ownerName: sanitizeString(body.ownerName ?? user.ownerName, 120),
      firmName: sanitizeString(body.firmName ?? user.firmName, 160),
      email,
      primaryMobile,
      alternateMobile,
      gstNumber,
      city: sanitizeString(body.city ?? user.city, 80),
      state: sanitizeString(body.state ?? user.state, 80),
      fullAddress: sanitizeMultiline(body.fullAddress ?? user.fullAddress, 900),
      businessRole: sanitizeString(body.businessRole ?? user.businessRole, 100),
      tradingProducts: sanitizeMultiline(body.tradingProducts ?? user.tradingProducts, 1200),
      documents: sanitizeMultiline(body.documents ?? user.documents, 1600),
      profileConfirmationRequired: sensitiveChanged ? true : user.profileConfirmationRequired !== false,
      verificationStatus: sensitiveChanged ? 'Pending Profile Confirmation' : user.verificationStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update profile.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user: safeClientUser(updated) });
}
