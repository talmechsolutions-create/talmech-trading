import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  WhatsappUploadAdminPatch,
  WhatsappUploadInput,
  WhatsappUploadStatus,
  WhatsappUploadSubmission,
  WHATSAPP_STATUS_OPTIONS,
} from '@/lib/whatsappUploadTypes';
import { maskMobile, sanitizeMultiline, sanitizeString } from '@/lib/validation';

export const whatsappUploadsFile = path.join(process.cwd(), 'data', 'whatsapp-uploads.json');

const statusSet = new Set<string>(WHATSAPP_STATUS_OPTIONS);

function compactDate() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function createSubmissionId() {
  return `WU-${compactDate()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function readJsonArray<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    console.error('[WhatsApp upload store] Unable to read JSON fallback', error);
    return [];
  }
}

async function writeJsonArray<T>(file: string, rows: T[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
}

function cleanInput(input: Partial<WhatsappUploadInput>): WhatsappUploadInput {
  return {
    role: sanitizeString(input.role, 60),
    submissionType: sanitizeString(input.submissionType, 100),
    language: (sanitizeString(input.language, 8) || 'en') as WhatsappUploadInput['language'],
    fullName: sanitizeString(input.fullName, 120),
    firmName: sanitizeString(input.firmName, 160),
    mobile: sanitizeString(input.mobile, 20),
    alternateMobile: sanitizeString(input.alternateMobile, 20),
    email: sanitizeString(input.email, 254).toLowerCase(),
    gstNumber: sanitizeString(input.gstNumber, 15).toUpperCase(),
    city: sanitizeString(input.city, 80),
    state: sanitizeString(input.state, 80),
    dispatchLocation: sanitizeString(input.dispatchLocation, 180),
    deliveryLocation: sanitizeString(input.deliveryLocation, 180),
    selectedMetal: sanitizeString(input.selectedMetal, 80),
    customMetal: sanitizeString(input.customMetal, 100),
    selectedProduct: sanitizeString(input.selectedProduct, 140),
    customProduct: sanitizeString(input.customProduct, 140),
    selectedGrade: sanitizeString(input.selectedGrade, 100),
    customGrade: sanitizeString(input.customGrade, 120),
    selectedProductForm: sanitizeString(input.selectedProductForm, 100),
    customProductForm: sanitizeString(input.customProductForm, 120),
    finalMetalLabel: sanitizeString(input.finalMetalLabel, 120),
    finalProductLabel: sanitizeString(input.finalProductLabel, 140),
    finalGradeLabel: sanitizeString(input.finalGradeLabel, 120),
    finalProductFormLabel: sanitizeString(input.finalProductFormLabel, 120),
    sizeOrSpecification: sanitizeString(input.sizeOrSpecification, 200),
    quantity: sanitizeString(input.quantity, 80),
    quantityUnit: sanitizeString(input.quantityUnit, 40),
    price: sanitizeString(input.price, 80),
    priceUnit: sanitizeString(input.priceUnit, 60),
    targetPrice: sanitizeString(input.targetPrice, 80),
    taxStatus: sanitizeString(input.taxStatus, 60),
    stockStatus: sanitizeString(input.stockStatus, 60),
    minimumOrderQuantity: sanitizeString(input.minimumOrderQuantity, 80),
    deliveryTimeline: sanitizeString(input.deliveryTimeline, 100),
    certificateAvailable: sanitizeString(input.certificateAvailable, 80),
    certificateRequired: sanitizeString(input.certificateRequired, 80),
    photosAvailable: sanitizeString(input.photosAvailable, 20),
    applicationOrUse: sanitizeString(input.applicationOrUse, 180),
    remarks: sanitizeMultiline(input.remarks, 1600),
  };
}

function normalizeSubmission(row: Partial<WhatsappUploadSubmission>): WhatsappUploadSubmission {
  const cleaned = cleanInput(row);
  const createdAt = sanitizeString(row.createdAt, 40) || new Date().toISOString();
  const status = statusSet.has(String(row.status)) ? (row.status as WhatsappUploadStatus) : 'Pending Review';
  return {
    ...cleaned,
    submissionId: sanitizeString(row.submissionId, 60) || createSubmissionId(),
    createdAt,
    updatedAt: sanitizeString(row.updatedAt, 40) || createdAt,
    status,
    internalAdminNotes: sanitizeMultiline(row.internalAdminNotes, 2500),
    statusTimeline: Array.isArray(row.statusTimeline)
      ? row.statusTimeline
          .map((item: any) => ({
            status: statusSet.has(String(item?.status)) ? item.status : 'Pending Review',
            note: sanitizeMultiline(item?.note, 500),
            at: sanitizeString(item?.at, 40) || createdAt,
            by: (item?.by === 'admin' ? 'admin' : 'system') as 'admin' | 'system',
          }))
          .slice(0, 50)
      : [{ status: 'Pending Review', note: 'Submission received from public WhatsApp upload form.', at: createdAt, by: 'system' }],
    source: 'whatsapp-assisted-upload',
  };
}

export async function listWhatsappUploads() {
  const rows = await readJsonArray<WhatsappUploadSubmission>(whatsappUploadsFile);
  return rows.map(normalizeSubmission).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findWhatsappUpload(submissionId: string) {
  const cleanId = sanitizeString(submissionId, 80);
  const rows = await listWhatsappUploads();
  return rows.find((row) => row.submissionId === cleanId) || null;
}

export async function createWhatsappUpload(input: Partial<WhatsappUploadInput>) {
  const now = new Date().toISOString();
  const submission = normalizeSubmission({
    ...cleanInput(input),
    submissionId: createSubmissionId(),
    createdAt: now,
    updatedAt: now,
    status: 'Pending Review',
    internalAdminNotes: '',
    statusTimeline: [{ status: 'Pending Review', note: 'Saved for admin-assisted review. No auto-publishing.', at: now, by: 'system' }],
  });

  const rows = await listWhatsappUploads();
  rows.unshift(submission);
  await writeJsonArray(whatsappUploadsFile, rows);
  return submission;
}

export async function updateWhatsappUpload(submissionId: string, patch: WhatsappUploadAdminPatch) {
  const cleanId = sanitizeString(submissionId, 80);
  const rows = await listWhatsappUploads();
  const index = rows.findIndex((row) => row.submissionId === cleanId);
  if (index < 0) return null;

  const current = rows[index];
  const nextStatus = patch.status && statusSet.has(patch.status) ? patch.status : current.status;
  const now = new Date().toISOString();
  const note = sanitizeMultiline(patch.note, 500);
  const timeline =
    nextStatus !== current.status || note
      ? [...current.statusTimeline, { status: nextStatus, note, at: now, by: 'admin' as const }]
      : current.statusTimeline;

  rows[index] = normalizeSubmission({
    ...current,
    status: nextStatus,
    internalAdminNotes: patch.internalAdminNotes === undefined ? current.internalAdminNotes : sanitizeMultiline(patch.internalAdminNotes, 2500),
    updatedAt: now,
    statusTimeline: timeline,
  });

  await writeJsonArray(whatsappUploadsFile, rows);
  return rows[index];
}

export function toWhatsappUploadAdminRow(row: WhatsappUploadSubmission) {
  return {
    submissionId: row.submissionId,
    date: row.createdAt,
    role: row.role,
    submissionType: row.submissionType,
    firmName: row.firmName,
    contactPerson: row.fullName,
    maskedMobile: maskMobile(row.mobile),
    city: row.city,
    state: row.state,
    productOrRequirementName: row.finalProductLabel || row.selectedProduct || row.customProduct,
    finalMetalLabel: row.finalMetalLabel || row.selectedMetal || row.customMetal,
    finalProductLabel: row.finalProductLabel || row.selectedProduct || row.customProduct,
    finalGradeLabel: row.finalGradeLabel || row.selectedGrade || row.customGrade,
    finalProductFormLabel: row.finalProductFormLabel || row.selectedProductForm || row.customProductForm,
    quantity: [row.quantity, row.quantityUnit].filter(Boolean).join(' '),
    price: row.price || row.targetPrice || 'Not shared',
    status: row.status,
  };
}
