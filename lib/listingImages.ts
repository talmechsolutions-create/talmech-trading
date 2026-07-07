import { createHash, randomBytes } from 'crypto';
import { sanitizeString } from '@/lib/validation';

export type ListingImageSource = 'url' | 'upload' | 'local-dev-upload';

export type ListingImage = {
  imageId: string;
  url: string;
  alt: string;
  position: number;
  source: ListingImageSource;
  uploadedAt: string;
};

export type ListingImageInput = Partial<ListingImage> & {
  imageUrl?: string;
};

export const allowedListingImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const allowedListingImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export function listingImageMaxMb() {
  const configured = Number(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MAX_MB || 3);
  return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 10) : 3;
}

export function listingImageMaxBytes() {
  return listingImageMaxMb() * 1024 * 1024;
}

function extensionFromPath(value: string) {
  const path = value.split('?')[0].split('#')[0].toLowerCase();
  const match = path.match(/\.[a-z0-9]+$/);
  return match?.[0] || '';
}

export function extensionForMime(mime: string) {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '';
}

export function validateListingImageUrl(value: unknown) {
  const url = sanitizeString(value, 900);
  if (!url) return { ok: false, error: 'Image URL is empty.' };

  if (url.startsWith('/uploads/listings/')) {
    const ext = extensionFromPath(url);
    return allowedListingImageExtensions.has(ext)
      ? { ok: true, url }
      : { ok: false, error: 'Only jpg, jpeg, png and webp listing images are allowed.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: 'Enter a valid image URL.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Only http and https image URLs are allowed.' };
  }
  const ext = extensionFromPath(parsed.pathname);
  if (!allowedListingImageExtensions.has(ext)) {
    return { ok: false, error: 'Image URL must end with jpg, jpeg, png or webp.' };
  }

  return { ok: true, url: parsed.toString() };
}

export function validateListingImageFileMetadata(file: { name?: string; type?: string; size?: number }) {
  const mime = sanitizeString(file.type, 80).toLowerCase();
  const size = Number(file.size || 0);
  if (!allowedListingImageMimeTypes.has(mime)) {
    return { ok: false, error: 'Only jpg, jpeg, png and webp files are allowed.' };
  }
  if (size <= 0 || size > listingImageMaxBytes()) {
    return { ok: false, error: `Image must be ${listingImageMaxMb()}MB or smaller.` };
  }
  const originalExt = extensionFromPath(sanitizeString(file.name, 240));
  if (originalExt && !allowedListingImageExtensions.has(originalExt)) {
    return { ok: false, error: 'Only jpg, jpeg, png and webp file names are allowed.' };
  }
  return { ok: true, extension: extensionForMime(mime) || originalExt || '.jpg' };
}

function stableImageId(url: string, position: number) {
  const hash = createHash('sha256').update(`${position}:${url}`).digest('hex').slice(0, 14);
  return `IMG-${hash}`;
}

export function randomListingImageName(extension: string) {
  const ext = allowedListingImageExtensions.has(extension.toLowerCase()) ? extension.toLowerCase() : '.jpg';
  return `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
}

function normalizeOne(input: ListingImageInput, position: number, fallbackAlt: string): ListingImage | null {
  const rawUrl = input.url || input.imageUrl;
  const validation = validateListingImageUrl(rawUrl);
  if (!validation.ok || !validation.url) return null;
  const alt = sanitizeString(input.alt, 140) || fallbackAlt || `Product image ${position}`;
  const source = input.source === 'upload' || input.source === 'local-dev-upload' ? input.source : 'url';
  return {
    imageId: sanitizeString(input.imageId, 80) || stableImageId(validation.url, position),
    url: validation.url,
    alt,
    position,
    source,
    uploadedAt: sanitizeString(input.uploadedAt, 40) || new Date().toISOString(),
  };
}

export function normalizeListingImages(value: unknown, fallbackAlt = ''): ListingImage[] {
  const candidates: ListingImageInput[] = [];
  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item && typeof item === 'object') candidates.push(item as ListingImageInput);
      else if (item) candidates.push({ url: String(item) });
    });
  } else if (value && typeof value === 'object') {
    const row = value as Record<string, any>;
    if (Array.isArray(row.productImages)) candidates.push(...row.productImages);
    ['image1', 'image2', 'image3'].forEach((key) => {
      if (row[key]) candidates.push({ url: row[key], alt: row[`${key}Alt`] });
    });
  }

  const seen = new Set<string>();
  return candidates
    .map((item, index) => normalizeOne(item, index + 1, fallbackAlt))
    .filter((item): item is ListingImage => Boolean(item))
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .slice(0, 3)
    .map((item, index) => ({ ...item, position: index + 1 }));
}

export function productImagesFromListing(listing: any): ListingImage[] {
  const fallbackAlt = [listing?.metal, listing?.product, listing?.grade].filter(Boolean).join(' ');
  return normalizeListingImages(listing?.productImages || listing?.raw?.productImages || listing?.raw || listing, fallbackAlt);
}

export function listingImageUrls(listing: any) {
  return productImagesFromListing(listing).map((image) => image.url);
}

export function hasListingImages(listing: any) {
  return productImagesFromListing(listing).length > 0;
}
