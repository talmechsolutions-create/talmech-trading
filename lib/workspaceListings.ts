import { createListing } from '@/lib/proDb';
import { WhatsappUploadSubmission } from '@/lib/whatsappUploadTypes';
import { normalizeEmail, normalizeIndianMobile, sanitizeMultiline, sanitizeString } from '@/lib/validation';

type ListingInput = Record<string, any>;

function listingId(prefix = 'LIST') {
  return `${prefix}-${Date.now()}`;
}

export function normalizeListingType(value: unknown) {
  const text = sanitizeString(value, 60).toLowerCase();
  if (text.includes('buy')) return { type: 'BUY', kind: 'Buy requirement' };
  if (text.includes('scrap')) return { type: 'SCRAP', kind: 'Scrap listing' };
  if (text.includes('trader')) return { type: 'SELL', kind: 'Trader deal listing' };
  return { type: 'SELL', kind: 'Sell listing' };
}

function field(input: ListingInput, key: string, fallback = '', max = 160) {
  return sanitizeString(input[key] ?? fallback, max);
}

export function listingInputFromWhatsapp(submission: WhatsappUploadSubmission, account?: any) {
  return {
    accountId: account?.id || submission.accountCreation?.accountId || '',
    ownerUserId: account?.id || submission.accountCreation?.accountId || '',
    ownerEmail: account?.email || submission.email,
    ownerMobile: account?.primaryMobile || submission.mobile,
    firmName: account?.firmName || submission.firmName,
    contactPerson: account?.ownerName || submission.fullName,
    mobile: account?.primaryMobile || submission.mobile,
    email: account?.email || submission.email,
    role: submission.role,
    submissionType: submission.submissionType,
    listingType: submission.role === 'Buyer' || submission.submissionType === 'Buy requirement / RFQ' ? 'Buy requirement' : 'Sell listing',
    metal: submission.finalMetalLabel || submission.selectedMetal || submission.customMetal,
    product: submission.finalProductLabel || submission.selectedProduct || submission.customProduct,
    grade: submission.finalGradeLabel || submission.selectedGrade || submission.customGrade,
    productForm: submission.finalProductFormLabel || submission.selectedProductForm || submission.customProductForm,
    sizeOrSpecification: submission.sizeOrSpecification,
    quantity: submission.quantity,
    quantityUnit: submission.quantityUnit || 'KG',
    price: submission.price,
    priceUnit: submission.priceUnit,
    targetPrice: submission.targetPrice,
    taxStatus: submission.taxStatus,
    stockStatus: submission.stockStatus,
    minimumOrderQuantity: submission.minimumOrderQuantity,
    certificateAvailable: submission.certificateAvailable,
    certificateRequired: submission.certificateRequired,
    photosAvailable: submission.photosAvailable,
    dispatchLocation: submission.dispatchLocation,
    deliveryLocation: submission.deliveryLocation,
    city: submission.city,
    state: submission.state,
    deliveryTimeline: submission.deliveryTimeline,
    applicationOrUse: submission.applicationOrUse,
    remarks: submission.remarks,
    listingVisibility: 'public',
  };
}

export function buildWorkspaceListing(input: ListingInput, options: {
  owner?: any;
  source: string;
  createdByAdmin?: boolean;
  whatsappSubmissionId?: string;
  approved?: boolean;
  prefix?: string;
}) {
  const typeInfo = normalizeListingType(input.listingType || input.type);
  const owner = options.owner || {};
  const now = new Date().toISOString();
  const quantity = field(input, 'quantity', '', 80);
  const unit = field(input, 'quantityUnit', input.unit || 'KG', 40) || 'KG';
  const targetPrice = field(input, 'targetPrice', input.price || '', 120);
  const priceType = [
    targetPrice || 'Quote after verification',
    field(input, 'priceUnit', '', 60),
    field(input, 'taxStatus', '', 60),
  ].filter(Boolean).join(' / ');
  const dispatchReadiness = field(input, 'stockStatus', '', 80).toLowerCase().includes('ready') ? 'READY_STOCK' : 'MAKE_TO_ORDER';
  const approvalStatus = options.approved ? 'approved' : 'Pending Admin Review';
  const visibility = field(input, 'listingVisibility', options.approved ? 'public' : 'draft', 40) || (options.approved ? 'public' : 'draft');
  const technicalSummary = sanitizeMultiline([
    field(input, 'sizeOrSpecification', '', 240),
    field(input, 'productForm', '', 120),
    field(input, 'certificateAvailable', '', 80) ? `Certificate available: ${field(input, 'certificateAvailable', '', 80)}` : '',
    field(input, 'certificateRequired', '', 80) ? `Certificate required: ${field(input, 'certificateRequired', '', 80)}` : '',
    field(input, 'minimumOrderQuantity', '', 80) ? `MOQ: ${field(input, 'minimumOrderQuantity', '', 80)}` : '',
    sanitizeMultiline(input.remarks, 900),
  ].filter(Boolean).join('\n'), 1600);

  return {
    id: listingId(options.prefix),
    createdAt: now,
    updatedAt: now,
    type: typeInfo.type,
    listingKind: typeInfo.kind,
    metal: field(input, 'metal', '', 80),
    product: field(input, 'product', '', 140),
    grade: field(input, 'grade', '', 100),
    productForm: field(input, 'productForm', '', 120),
    quantity,
    unit,
    targetPrice,
    priceType,
    state: field(input, 'state', owner.state || '', 80),
    city: field(input, 'city', owner.city || '', 80),
    area: field(input, 'area', '', 120),
    pincode: field(input, 'pincode', '', 6),
    pickupAddress: sanitizeMultiline(input.dispatchLocation || input.address || owner.fullAddress, 800),
    deliveryLocation: sanitizeMultiline(input.deliveryLocation, 800),
    dispatchReadiness,
    readyDispatchTime: dispatchReadiness === 'READY_STOCK' ? 'Ready after admin confirmation' : '',
    productionLeadTime: dispatchReadiness === 'MAKE_TO_ORDER' ? field(input, 'deliveryTimeline', 'To be confirmed', 120) : '',
    deliveryEta: field(input, 'deliveryTimeline', 'To be confirmed by Talmech', 120),
    technicalSummary,
    mediaCount: 0,
    mediaGallery: [],
    previewImages: [],
    status: options.approved ? 'Open' : 'Pending Admin Review',
    lockStatus: 'Available',
    verified: Boolean(options.approved),
    raw: {
      ...input,
      listingKind: typeInfo.kind,
      ownerUserId: field(input, 'ownerUserId', owner.id || '', 80),
      accountId: field(input, 'accountId', owner.id || '', 80),
      ownerEmail: normalizeEmail(input.ownerEmail || owner.email),
      ownerMobile: normalizeIndianMobile(input.ownerMobile || owner.primaryMobile || owner.mobile),
      firmName: field(input, 'firmName', owner.firmName || '', 160),
      contactPerson: field(input, 'contactPerson', owner.ownerName || '', 120),
      whatsappSubmissionId: field(input, 'whatsappSubmissionId', options.whatsappSubmissionId || '', 80),
      createdByAdmin: Boolean(options.createdByAdmin),
      source: options.source,
      listingVisibility: visibility,
      listingApprovalStatus: approvalStatus,
      profileConfirmationRequired: owner.profileConfirmationRequired !== false,
      createdAt: now,
    },
  };
}

export async function createWorkspaceListing(input: ListingInput, options: {
  owner?: any;
  source: string;
  createdByAdmin?: boolean;
  whatsappSubmissionId?: string;
  approved?: boolean;
  prefix?: string;
}) {
  const listing = buildWorkspaceListing(input, options);
  return createListing(listing);
}
