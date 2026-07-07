import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  WhatsappAccountCreation,
  WhatsappListingCreation,
  WhatsappUploadAdminPatch,
  WhatsappUploadInput,
  WhatsappUploadStatus,
  WhatsappUploadSubmission,
  WHATSAPP_STATUS_OPTIONS,
} from '@/lib/whatsappUploadTypes';
import { maskMobile, sanitizeMultiline, sanitizeString } from '@/lib/validation';

export const whatsappUploadsFile = path.join(process.cwd(), 'data', 'whatsapp-uploads.json');

const statusSet = new Set<string>(WHATSAPP_STATUS_OPTIONS);
const accountStatusSet = new Set(['Not Created', 'Account Created', 'Email Sent', 'Needs Follow-up']);

function compactDate() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function createSubmissionId() {
  return `WU-${compactDate()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function readJsonArray<T>(file: string): Promise<T[]> {
  try {
    const raw = (await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, '');
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

function normalizeAccountCreation(row: any): WhatsappAccountCreation | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const status = accountStatusSet.has(String(row.status)) ? row.status : 'Not Created';
  return {
    status,
    accountId: sanitizeString(row.accountId, 80),
    accountType: sanitizeString(row.accountType, 100),
    roleCategory: sanitizeString(row.roleCategory, 60),
    adminCreated: row.adminCreated === undefined ? undefined : Boolean(row.adminCreated),
    onboardingSource: row.onboardingSource === 'whatsapp-assisted' ? 'whatsapp-assisted' : undefined,
    verificationStatus:
      row.verificationStatus === 'Admin Created' || row.verificationStatus === 'Pending Profile Confirmation'
        ? row.verificationStatus
        : undefined,
    profileConfirmationRequired:
      row.profileConfirmationRequired === undefined ? undefined : Boolean(row.profileConfirmationRequired),
    emailOtpRequired: row.emailOtpRequired === undefined ? undefined : Boolean(row.emailOtpRequired),
    mobileOtpRequired: row.mobileOtpRequired === undefined ? undefined : Boolean(row.mobileOtpRequired),
    activationStatus: row.activationStatus === 'activated' ? 'activated' : row.activationStatus === 'pending' ? 'pending' : undefined,
    activationTokenExpiresAt: sanitizeString(row.activationTokenExpiresAt, 40),
    createdAt: sanitizeString(row.createdAt, 40),
    credentialsSentAt: sanitizeString(row.credentialsSentAt, 40),
    emailLastAttemptAt: sanitizeString(row.emailLastAttemptAt, 40),
    emailStatus: sanitizeString(row.emailStatus, 80),
    emailProvider: sanitizeString(row.emailProvider, 80),
    emailPreviewAvailable: row.emailPreviewAvailable === undefined ? undefined : Boolean(row.emailPreviewAvailable),
    lastEmailError: sanitizeMultiline(row.lastEmailError, 500),
    adminNote: sanitizeMultiline(row.adminNote, 800),
  };
}

function normalizeListingCreation(row: any): WhatsappListingCreation | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const listingIds = Array.isArray(row.listingIds)
    ? row.listingIds.map((id: unknown) => sanitizeString(id, 80)).filter(Boolean).slice(0, 25)
    : [];
  return {
    status: row.status === 'Listing Created' || listingIds.length ? 'Listing Created' : 'Not Created',
    listingIds,
    accountId: sanitizeString(row.accountId, 80),
    lastListingId: sanitizeString(row.lastListingId, 80),
    lastListingType: sanitizeString(row.lastListingType, 80),
    createdAt: sanitizeString(row.createdAt, 40),
    updatedAt: sanitizeString(row.updatedAt, 40),
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
    accountCreation: normalizeAccountCreation(row.accountCreation),
    listingCreation: normalizeListingCreation(row.listingCreation),
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

export async function updateWhatsappUploadAccountCreation(
  submissionId: string,
  accountCreation: WhatsappAccountCreation,
  options: { note?: string; status?: WhatsappUploadStatus } = {}
) {
  const cleanId = sanitizeString(submissionId, 80);
  const rows = await listWhatsappUploads();
  const index = rows.findIndex((row) => row.submissionId === cleanId);
  if (index < 0) return null;

  const current = rows[index];
  const now = new Date().toISOString();
  const nextStatus = options.status && statusSet.has(options.status) ? options.status : current.status;
  const note = sanitizeMultiline(options.note, 500);
  const timeline =
    nextStatus !== current.status || note
      ? [...current.statusTimeline, { status: nextStatus, note, at: now, by: 'admin' as const }]
      : current.statusTimeline;

  rows[index] = normalizeSubmission({
    ...current,
    status: nextStatus,
    updatedAt: now,
    statusTimeline: timeline,
    accountCreation: normalizeAccountCreation(accountCreation),
  });

  await writeJsonArray(whatsappUploadsFile, rows);
  return rows[index];
}

export async function updateWhatsappUploadListingCreation(
  submissionId: string,
  listingCreation: WhatsappListingCreation,
  options: { note?: string; status?: WhatsappUploadStatus } = {}
) {
  const cleanId = sanitizeString(submissionId, 80);
  const rows = await listWhatsappUploads();
  const index = rows.findIndex((row) => row.submissionId === cleanId);
  if (index < 0) return null;

  const current = rows[index];
  const now = new Date().toISOString();
  const nextStatus = options.status && statusSet.has(options.status) ? options.status : current.status;
  const note = sanitizeMultiline(options.note, 500);
  const timeline =
    nextStatus !== current.status || note
      ? [...current.statusTimeline, { status: nextStatus, note, at: now, by: 'admin' as const }]
      : current.statusTimeline;

  rows[index] = normalizeSubmission({
    ...current,
    status: nextStatus,
    updatedAt: now,
    statusTimeline: timeline,
    listingCreation: normalizeListingCreation(listingCreation),
  });

  await writeJsonArray(whatsappUploadsFile, rows);
  return rows[index];
}

export function toWhatsappUploadAdminRow(row: WhatsappUploadSubmission) {
  const account = row.accountCreation;
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
    accountStatus: account?.status || 'Not Created',
    accountId: account?.accountId || '',
    accountType: account?.accountType || '',
    credentialsSentAt: account?.credentialsSentAt || '',
    emailDeliveryStatus: account?.emailStatus || '',
    listingStatus: row.listingCreation?.status || 'Not Created',
    listingId: row.listingCreation?.lastListingId || row.listingCreation?.listingIds?.[0] || '',
  };
}
