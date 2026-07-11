import { productImagesFromListing } from '@/lib/listingImages';

export type MissingInformationItem = {
  key: string;
  label: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
};

function pick(...values: unknown[]) {
  return values.map((value) => String(value || '').trim()).find(Boolean) || '';
}

function raw(value: any) {
  return value?.raw && typeof value.raw === 'object' ? value.raw : {};
}

function hasPositiveText(value: unknown) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return false;
  return !['no', 'none', 'not sure', 'unknown', 'n/a', '-'].includes(text);
}

export function detectMissingInformation(input: { account?: any; listing?: any; submission?: any }) {
  const account = input.account || {};
  const listing = input.listing || {};
  const submission = input.submission || {};
  const listingRaw = raw(listing);
  const accountRaw = raw(account);
  const source = { ...submission, ...accountRaw, ...account, ...listingRaw, ...listing };
  const images = productImagesFromListing(source);
  const items: MissingInformationItem[] = [];

  if (images.length < 3) {
    items.push({
      key: 'productImages',
      label: '3 product images required',
      message: `Ask client to share ${3 - images.length} more clear product photo${3 - images.length === 1 ? '' : 's'} for verification.`,
      severity: images.length ? 'warning' : 'critical',
    });
  }

  if (!pick(source.gstNumber, source.gst, source.taxRegistration)) {
    items.push({
      key: 'gstNumber',
      label: 'GST number missing',
      message: 'GST number is missing or not verified.',
      severity: 'warning',
    });
  }

  if (!hasPositiveText(pick(
    source.certificateAvailable,
    source.certificateRequired,
    source.certificateDetails,
    source.materialTestCertificate,
    source.testCertificate,
    source.mtc,
    source.invoiceAvailable,
    source.documentSupport
  ))) {
    items.push({
      key: 'certificateDetails',
      label: 'Certificate details pending',
      message: 'Certificate, invoice, MTC, or test report status needs confirmation.',
      severity: 'warning',
    });
  }

  if (!pick(source.dispatchLocation, source.pickupAddress, source.pickupLocation, source.sourceLocation)) {
    items.push({
      key: 'dispatchLocation',
      label: 'Dispatch location missing',
      message: 'Dispatch, pickup, or stock location needs confirmation before outreach.',
      severity: 'warning',
    });
  }

  if (!pick(source.deliveryLocation, source.deliveryAddress, source.destinationLocation, source.buyerLocation)) {
    items.push({
      key: 'deliveryLocation',
      label: 'Delivery location missing',
      message: 'Delivery destination or serviceable location needs confirmation.',
      severity: 'warning',
    });
  }

  if (!pick(source.targetPrice, source.price, source.priceType) || /request|negotiable|not sure/i.test(pick(source.priceType, source.priceUnit, source.targetPrice))) {
    items.push({
      key: 'priceConfirmation',
      label: 'Price confirmation pending',
      message: 'Price, price basis, or price-on-request approval needs confirmation.',
      severity: 'warning',
    });
  }

  if (!hasPositiveText(pick(source.stockStatus, source.dispatchReadiness, source.readyDispatchTime, source.stockProof))) {
    items.push({
      key: 'stockProof',
      label: 'Stock proof pending',
      message: 'Stock availability, dispatch readiness, or proof needs confirmation.',
      severity: 'warning',
    });
  }

  if (!pick(source.grade, source.selectedGrade, source.finalGradeLabel, source.customGrade)) {
    items.push({
      key: 'grade',
      label: 'Grade missing',
      message: 'Material grade or quality specification needs confirmation.',
      severity: 'warning',
    });
  }

  if (!pick(source.productForm, source.selectedProductForm, source.finalProductFormLabel, source.customProductForm)) {
    items.push({
      key: 'productForm',
      label: 'Product form missing',
      message: 'Product form such as bar, sheet, plate, coil, scrap, casting, or finished component needs confirmation.',
      severity: 'warning',
    });
  }

  if (!hasPositiveText(pick(source.stockProof, source.stockPhoto, source.stockPhotos, source.loadingPhoto, source.lotPhoto)) && images.length === 0) {
    items.push({
      key: 'stockProofPhoto',
      label: 'Stock proof/photo missing',
      message: 'Ask client for stock proof, lot photo, loading photo, or product photo for verification.',
      severity: 'warning',
    });
  }

  if (!pick(source.quantity, source.minimumOrderQuantity)) {
    items.push({
      key: 'quantity',
      label: 'Quantity missing',
      message: 'Quantity or MOQ needs confirmation.',
      severity: 'critical',
    });
  }

  return items;
}

export function missingInformationLabels(input: { account?: any; listing?: any; submission?: any }) {
  return detectMissingInformation(input).map((item) => item.label);
}

export function clientFollowUpRequired(input: { account?: any; listing?: any; submission?: any }) {
  return detectMissingInformation(input).length > 0;
}
