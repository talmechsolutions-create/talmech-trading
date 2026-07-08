import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { sendClientListingNotification } from '@/lib/clientNotifications';
import { findUser } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';
import { findWhatsappUpload, updateWhatsappUploadListingCreation } from '@/lib/whatsappUploadStore';
import { createWorkspaceListing, listingInputFromWhatsapp } from '@/lib/workspaceListings';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { submissionId: string };
};

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }

  const submission = await findWhatsappUpload(params.submissionId);
  if (!submission) return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const existingIds = submission.listingCreation?.listingIds || [];
  if (existingIds.length && body.allowAnother !== true) {
    return NextResponse.json(
      { ok: false, error: 'A listing is already linked to this submission. Use Create another listing to continue.', listingIds: existingIds },
      { status: 409 }
    );
  }

  const accountId = sanitizeString(body.accountId || submission.accountCreation?.accountId, 80);
  const account = accountId ? await findUser(accountId) : null;
  const input = {
    ...listingInputFromWhatsapp(submission, account),
    ...body,
    accountId: account?.id || accountId,
    ownerUserId: account?.id || accountId,
    ownerEmail: body.ownerEmail || account?.email || submission.email,
    ownerMobile: body.ownerMobile || account?.primaryMobile || submission.mobile,
    firmName: body.firmName || account?.firmName || submission.firmName,
    contactPerson: body.contactPerson || account?.ownerName || submission.fullName,
    whatsappSubmissionId: submission.submissionId,
  };

  if (!sanitizeString(input.metal, 80) || !sanitizeString(input.product, 140)) {
    return NextResponse.json({ ok: false, error: 'Metal and product are required before creating a listing.' }, { status: 400 });
  }

  try {
    const listing = await createWorkspaceListing(input, {
      owner: account || undefined,
      source: 'whatsapp-assisted-admin',
      createdByAdmin: true,
      whatsappSubmissionId: submission.submissionId,
      approved: sanitizeString(body.listingVisibility, 40) !== 'draft',
      prefix: 'LIST-WA',
    });

    const listingIds = [...existingIds, listing.id];
    const now = new Date().toISOString();
    const updatedSubmission = await updateWhatsappUploadListingCreation(submission.submissionId, {
      status: 'Listing Created',
      listingIds,
      accountId: account?.id || accountId,
      lastListingId: listing.id,
      lastListingType: sanitizeString(input.listingType || input.type, 80) || listing.type,
      createdAt: submission.listingCreation?.createdAt || now,
      updatedAt: now,
    }, {
      status: 'Converted',
      note: `Marketplace listing ${listing.id} created from WhatsApp submission.`,
    });

    const email = account ? await sendClientListingNotification({
      user: account,
      listing,
      notificationType: 'client_account_listing_created',
    }) : null;

    return NextResponse.json({
      ok: true,
      listing,
      submission: updatedSubmission,
      email: email ? { status: email.status, provider: email.provider, tracking: email.tracking } : null,
      missingInformation: email?.missingInformation || [],
    });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to create listing.' }, { status: 500 });
  }
}
