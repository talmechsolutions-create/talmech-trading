import { NextRequest, NextResponse } from 'next/server';
import { findWhatsappUpload, updateWhatsappUpload } from '@/lib/whatsappUploadStore';
import { WHATSAPP_STATUS_OPTIONS } from '@/lib/whatsappUploadTypes';
import { publicStorageError } from '@/lib/storageMode';
import { sanitizeMultiline, sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { submissionId: string };
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const submission = await findWhatsappUpload(params.submissionId);
  if (!submission) return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, submission });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const body = await req.json().catch(() => ({}));
  const status = sanitizeString(body.status, 80);
  let submission;
  try {
    submission = await updateWhatsappUpload(params.submissionId, {
      status: WHATSAPP_STATUS_OPTIONS.includes(status as any) ? (status as any) : undefined,
      internalAdminNotes: body.internalAdminNotes === undefined ? undefined : sanitizeMultiline(body.internalAdminNotes, 2500),
      note: sanitizeMultiline(body.note, 500),
    });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update submission.' }, { status: 500 });
  }

  if (!submission) return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, submission });
}
