import { promises as fs } from 'fs';
import path from 'path';
import { canUseJsonFileStorage, getStorageMode, requireJsonFileStorage } from '@/lib/storageMode';

const dataDir = path.join(process.cwd(), 'data');
export const leadsFile = path.join(dataDir, 'public-leads.json');
export const listingsFile = path.join(dataDir, 'marketplace-listings.json');

async function ensureFile(file: string) {
  if (!canUseJsonFileStorage()) return;
  await fs.mkdir(path.dirname(file), { recursive: true });
  try { await fs.access(file); } catch { await fs.writeFile(file, '[]'); }
}

export async function readJsonArray(file: string) {
  if (!canUseJsonFileStorage()) return [];
  await ensureFile(file);
  try { return JSON.parse(((await fs.readFile(file, 'utf8')) || '[]').replace(/^\uFEFF/, '')); } catch { return []; }
}

export async function writeJsonArray(file: string, rows: any[]) {
  requireJsonFileStorage();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2));
}

export { getStorageMode };

export function csv(rows: any[], headers: string[]) {
  const escape = (v:any) => `"${String(v ?? '').replaceAll('"','""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(Array.isArray(r[h]) ? JSON.stringify(r[h]) : r[h])).join(','))].join('\n');
}

export function safePublicListing(lead: any) {
  const mediaGallery = Array.isArray(lead.mediaGallery) ? lead.mediaGallery.slice(0, 6) : [];
  const previewImages = mediaGallery.filter((x:any) => String(x?.type || '').startsWith('image/') && x?.dataUrl).map((x:any) => x.dataUrl);
  return {
    id: `LIST-${Date.now()}`,
    leadId: lead.id,
    createdAt: lead.createdAt,
    updatedAt: new Date().toISOString(),
    type: lead.intent,
    metal: lead.metal,
    product: lead.product,
    grade: lead.grade,
    quantity: lead.quantity,
    unit: lead.unit,
    targetPrice: lead.targetPrice || '',
    priceType: lead.targetPrice ? 'Indicative rate shared' : 'Quote after verification',
    state: lead.state,
    city: lead.city,
    area: lead.area,
    pincode: lead.pincode,
    pickupAddress: lead.pickupAddress || lead.address || '',
    pickupLat: lead.pickupLat ? Number(lead.pickupLat) : undefined,
    pickupLng: lead.pickupLng ? Number(lead.pickupLng) : undefined,
    pickupMapUrl: lead.pickupMapUrl || '',
    dispatchReadiness: lead.dispatchReadiness,
    readyDispatchTime: lead.readyDispatchTime,
    productionLeadTime: lead.productionLeadTime,
    deliveryEta: lead.deliveryEta,
    technicalSummary: lead.technicalDetails,
    mediaCount: Array.isArray(lead.mediaLinks) ? lead.mediaLinks.length : 0,
    mediaGallery,
    previewImages,
    status: 'Open',
    lockStatus: 'Available',
    verified: false
  };
}
