import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { getClientSessionUser } from '@/lib/clientAuth';
import {
  randomListingImageName,
  validateListingImageFileMetadata,
} from '@/lib/listingImages';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function hasUploadSession(req: NextRequest) {
  if (verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) return true;
  return Boolean(await getClientSessionUser(req));
}

function providerMode() {
  return (process.env.IMAGE_UPLOAD_PROVIDER || '').trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  if (!(await hasUploadSession(req))) {
    return NextResponse.json({ ok: false, error: 'Admin or client sign-in required.' }, { status: 401 });
  }

  const provider = providerMode();
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const position = Number(form?.get('position') || 1);
  const alt = sanitizeString(form?.get('alt'), 140);

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Image file is required.' }, { status: 400 });
  }

  const validation = validateListingImageFileMetadata({ name: file.name, type: file.type, size: file.size });
  if (!validation.ok || !validation.extension) {
    return NextResponse.json({ ok: false, error: validation.error || 'Invalid image.' }, { status: 400 });
  }

  if (provider && provider !== 'local-dev') {
    return NextResponse.json({
      ok: false,
      error: 'Configured image provider hook is not implemented yet. Use safe image URL fields or connect Cloudinary, Supabase Storage, R2, or Vercel Blob.',
      provider,
    }, { status: 501 });
  }

  if (process.env.NODE_ENV === 'production' && provider !== 'local-dev') {
    return NextResponse.json({
      ok: false,
      error: 'Persistent image upload provider is not configured. Paste a hosted jpg, jpeg, png or webp URL for now.',
    }, { status: 409 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'listings');
  const workspaceRoot = process.cwd();
  if (!uploadDir.startsWith(workspaceRoot)) {
    return NextResponse.json({ ok: false, error: 'Unsafe upload path.' }, { status: 500 });
  }

  await fs.mkdir(uploadDir, { recursive: true });
  const name = randomListingImageName(validation.extension);
  const target = path.join(uploadDir, name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(target, buffer);

  const now = new Date().toISOString();
  return NextResponse.json({
    ok: true,
    image: {
      imageId: `IMG-${name.replace(/\.[^.]+$/, '')}`,
      url: `/uploads/listings/${name}`,
      alt: alt || `Product image ${position}`,
      position: Number.isFinite(position) && position > 0 ? Math.min(position, 3) : 1,
      source: 'local-dev-upload',
      uploadedAt: now,
    },
    provider: 'local-dev',
  });
}
