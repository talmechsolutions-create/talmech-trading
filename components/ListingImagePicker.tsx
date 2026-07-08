'use client';

import { useMemo, useState } from 'react';
import type { ListingImage } from '@/lib/listingImages';

type Props = {
  images: ListingImage[];
  onChange: (images: ListingImage[]) => void;
  label?: string;
  helpText?: string;
};

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

function emptyImage(position: number): ListingImage {
  return {
    imageId: `IMG-local-${position}-${Date.now()}`,
    url: '',
    alt: '',
    position,
    source: 'url',
    uploadedAt: new Date().toISOString(),
  };
}

function urlLooksSafe(url: string) {
  return /^(https?:\/\/|\/uploads\/listings\/).+\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url);
}

export default function ListingImagePicker({ images, onChange, label = 'Product images', helpText }: Props) {
  const [message, setMessage] = useState('');
  const maxMb = Number(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MAX_MB || 3) || 3;
  const slots = useMemo(() => [0, 1, 2].map((index) => images[index] || emptyImage(index + 1)), [images]);

  function updateSlot(index: number, patch: Partial<ListingImage>) {
    const next = [...slots];
    next[index] = { ...next[index], ...patch, position: index + 1, uploadedAt: next[index].uploadedAt || new Date().toISOString() };
    onChange(next.filter((image) => image.url).slice(0, 3));
  }

  function removeSlot(index: number) {
    const next = slots.filter((_, slotIndex) => slotIndex !== index).filter((image) => image.url);
    onChange(next.map((image, slotIndex) => ({ ...image, position: slotIndex + 1 })));
    setMessage('');
  }

  async function upload(index: number, file?: File) {
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setMessage('Only jpg, jpeg, png and webp product images are allowed.');
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setMessage(`Each image must be ${maxMb}MB or smaller.`);
      return;
    }
    const form = new FormData();
    form.append('file', file);
    form.append('position', String(index + 1));
    form.append('alt', slots[index].alt || file.name.replace(/\.[^.]+$/, ''));
    setMessage('Uploading image...');
    const res = await fetch('/api/listing-images/upload', { method: 'POST', body: form })
      .then((response) => response.json())
      .catch(() => ({ ok: false, error: 'Unable to upload image.' }));
    if (!res.ok) {
      setMessage(res.error || 'Production image upload provider is not configured. Paste hosted image URL or configure Cloudinary/Vercel Blob/Supabase/R2.');
      return;
    }
    updateSlot(index, res.image);
    setMessage('Image added.');
  }

  return (
    <div className="listingImagePicker span2">
      <div>
        <b>{label}</b>
        <p className="muted">{helpText || 'Optional. Add up to 3 jpg, jpeg, png or webp product images. Image URL works immediately; production file upload needs Cloudinary/Vercel Blob/Supabase/R2.'}</p>
      </div>
      <div className="listingImageGrid">
        {slots.map((image, index) => (
          <article className="listingImageSlot" key={index}>
            <div className="listingImagePreview">
              {image.url && urlLooksSafe(image.url)
                ? <img src={image.url} alt={image.alt || `Product image ${index + 1}`} />
                : <span>Image {index + 1}</span>}
            </div>
            <label>Image URL<input className="input" value={image.url || ''} onChange={(event) => updateSlot(index, { url: event.target.value, source: 'url', imageId: image.imageId || `IMG-url-${index + 1}-${Date.now()}` })} placeholder="https://example.com/product.webp" /></label>
            <label>Alt text<input className="input" value={image.alt || ''} onChange={(event) => updateSlot(index, { alt: event.target.value })} placeholder="Metal product photo" /></label>
            <label>Upload file<input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(index, event.target.files?.[0])} /></label>
            {image.url && <button className="btn secondary" type="button" onClick={() => removeSlot(index)}>Remove</button>}
          </article>
        ))}
      </div>
      {message && <p className="notice slimNotice">{message}</p>}
    </div>
  );
}
