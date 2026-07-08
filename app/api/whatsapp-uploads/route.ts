import { NextRequest, NextResponse } from 'next/server';
import { CUSTOM_OPTION } from '@/data/whatsappUploadOptions';
import { createWhatsappUpload, listWhatsappUploads, toWhatsappUploadAdminRow } from '@/lib/whatsappUploadStore';
import { getStorageMode, publicStorageError } from '@/lib/storageMode';
import {
  WHATSAPP_ROLE_OPTIONS,
  WHATSAPP_SUBMISSION_TYPE_OPTIONS,
  WhatsappUploadInput,
} from '@/lib/whatsappUploadTypes';
import {
  isValidEmail,
  isValidGst,
  isValidIndianMobile,
  jsonSizeBytes,
  normalizeIndianMobile,
  sanitizeString,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';

function hasHeavyMedia(value: unknown): boolean {
  if (typeof value === 'string') return /data:(image|application)\//i.test(value) || /;base64,/i.test(value);
  if (Array.isArray(value)) return value.some(hasHeavyMedia);
  if (value && typeof value === 'object') return Object.values(value).some(hasHeavyMedia);
  return false;
}

function isBuyerFlow(body: Partial<WhatsappUploadInput>) {
  return body.role === 'Buyer' || body.submissionType === 'Buy requirement / RFQ';
}

function finalLabel(selected: unknown, custom: unknown) {
  const selectedText = sanitizeString(selected, 140);
  return selectedText === CUSTOM_OPTION ? sanitizeString(custom, 140) : selectedText;
}

function validateSubmission(body: Partial<WhatsappUploadInput>) {
  const issues: { field: string; message: string }[] = [];
  const role = sanitizeString(body.role, 80);
  const submissionType = sanitizeString(body.submissionType, 120);
  const finalMetal = finalLabel(body.selectedMetal, body.customMetal);
  const finalProduct = finalLabel(body.selectedProduct, body.customProduct);
  const finalGrade = finalLabel(body.selectedGrade, body.customGrade);
  const finalForm = finalLabel(body.selectedProductForm, body.customProductForm);
  const quantity = sanitizeString(body.quantity, 80);
  const location = isBuyerFlow(body)
    ? sanitizeString(body.deliveryLocation || `${body.city || ''} ${body.state || ''}`, 220)
    : sanitizeString(body.dispatchLocation || `${body.city || ''} ${body.state || ''}`, 220);

  if (!WHATSAPP_ROLE_OPTIONS.includes(role as any)) issues.push({ field: 'role', message: 'Select your role.' });
  if (!WHATSAPP_SUBMISSION_TYPE_OPTIONS.includes(submissionType as any)) issues.push({ field: 'submissionType', message: 'Select what you want to submit.' });
  if (!body.mobile || !isValidIndianMobile(body.mobile)) issues.push({ field: 'mobile', message: 'Enter a valid Indian mobile number.' });
  if (body.email && !isValidEmail(body.email)) issues.push({ field: 'email', message: 'Enter a valid email address.' });
  if (body.gstNumber && !isValidGst(body.gstNumber)) issues.push({ field: 'gstNumber', message: 'Enter a valid GST number or leave it blank.' });
  if (!finalMetal) issues.push({ field: 'selectedMetal', message: 'Select metal/material or enter a custom material.' });
  if (!finalProduct) issues.push({ field: 'selectedProduct', message: 'Select product/type or enter a custom product.' });
  if (body.selectedMetal === CUSTOM_OPTION && !sanitizeString(body.customMetal, 100)) issues.push({ field: 'customMetal', message: 'Enter custom metal/material name.' });
  if (body.selectedProduct === CUSTOM_OPTION && !sanitizeString(body.customProduct, 140)) issues.push({ field: 'customProduct', message: 'Enter custom product name.' });
  if (body.selectedGrade === CUSTOM_OPTION && !sanitizeString(body.customGrade, 120)) issues.push({ field: 'customGrade', message: 'Enter custom grade/specification.' });
  if (body.selectedProductForm === CUSTOM_OPTION && !sanitizeString(body.customProductForm, 120)) issues.push({ field: 'customProductForm', message: 'Enter custom product form.' });
  if (['Sell product / stock available', 'Buy requirement / RFQ', 'Trader deal', 'Price update'].includes(submissionType) && !quantity) {
    issues.push({ field: 'quantity', message: 'Enter quantity for product, stock, price update, or RFQ.' });
  }
  if (!location) issues.push({ field: isBuyerFlow(body) ? 'deliveryLocation' : 'dispatchLocation', message: 'Enter dispatch or delivery location.' });
  if (hasHeavyMedia(body)) issues.push({ field: 'media', message: 'Do not upload base64 media here. Attach photos/documents directly in WhatsApp chat.' });

  return {
    issues,
    finalLabels: {
      finalMetalLabel: finalMetal,
      finalProductLabel: finalProduct,
      finalGradeLabel: finalGrade,
      finalProductFormLabel: finalForm,
    },
  };
}

export async function GET() {
  const submissions = await listWhatsappUploads();
  return NextResponse.json({
    ok: true,
    submissions,
    rows: submissions.map(toWhatsappUploadAdminRow),
    updatedAt: new Date().toISOString(),
    storage: getStorageMode(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (jsonSizeBytes(body) > 120_000) {
    return NextResponse.json({ ok: false, error: 'Submission is too large. Attach photos/documents inside WhatsApp chat instead.' }, { status: 413 });
  }

  const { issues, finalLabels } = validateSubmission(body);
  if (issues.length) return NextResponse.json({ ok: false, error: issues[0].message, issues }, { status: 400 });

  try {
    const submission = await createWhatsappUpload({
      ...body,
      ...finalLabels,
      mobile: normalizeIndianMobile(body.mobile),
      alternateMobile: body.alternateMobile ? normalizeIndianMobile(body.alternateMobile) : '',
    });

    return NextResponse.json({ ok: true, submission, status: submission.status });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to save WhatsApp upload.' }, { status: 500 });
  }
}
