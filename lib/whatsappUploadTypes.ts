export const WHATSAPP_ROLE_OPTIONS = [
  'Seller',
  'Trader',
  'Buyer',
  'Supplier',
  'Manufacturer',
] as const;

export const WHATSAPP_SUBMISSION_TYPE_OPTIONS = [
  'Sell product / stock available',
  'Buy requirement / RFQ',
  'Trader deal',
  'Price update',
  'Product photos and documents',
  'Need help onboarding',
] as const;

export const WHATSAPP_LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
] as const;

export const WHATSAPP_STATUS_OPTIONS = [
  'Pending Review',
  'Contacted',
  'Needs More Details',
  'Ready to Upload',
  'Converted',
  'Rejected',
] as const;

export const WHATSAPP_QUANTITY_UNITS = ['kg', 'ton', 'piece', 'meter', 'bundle', 'lot'] as const;
export const WHATSAPP_PRICE_UNITS = ['per kg', 'per ton', 'per piece', 'total lot', 'negotiable'] as const;
export const WHATSAPP_TAX_STATUS_OPTIONS = ['GST extra', 'GST included', 'not sure'] as const;
export const WHATSAPP_STOCK_STATUS_OPTIONS = ['ready stock', 'make to order', 'limited stock'] as const;
export const WHATSAPP_CERTIFICATE_OPTIONS = ['MTC', 'test certificate', 'invoice', 'none', 'not sure'] as const;
export const WHATSAPP_PHOTOS_AVAILABLE_OPTIONS = ['yes', 'no'] as const;

export type WhatsappUploadRole = (typeof WHATSAPP_ROLE_OPTIONS)[number] | '';
export type WhatsappUploadSubmissionType = (typeof WHATSAPP_SUBMISSION_TYPE_OPTIONS)[number] | '';
export type WhatsappUploadLanguageCode = (typeof WHATSAPP_LANGUAGE_OPTIONS)[number]['code'];
export type WhatsappUploadStatus = (typeof WHATSAPP_STATUS_OPTIONS)[number];

export type WhatsappStatusTimelineItem = {
  status: WhatsappUploadStatus;
  note?: string;
  at: string;
  by: 'system' | 'admin';
};

export type WhatsappUploadInput = {
  role: string;
  submissionType: string;
  language: WhatsappUploadLanguageCode;
  fullName: string;
  firmName: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  gstNumber: string;
  city: string;
  state: string;
  dispatchLocation: string;
  deliveryLocation: string;
  selectedMetal: string;
  customMetal: string;
  selectedProduct: string;
  customProduct: string;
  selectedGrade: string;
  customGrade: string;
  selectedProductForm: string;
  customProductForm: string;
  finalMetalLabel: string;
  finalProductLabel: string;
  finalGradeLabel: string;
  finalProductFormLabel: string;
  sizeOrSpecification: string;
  quantity: string;
  quantityUnit: string;
  price: string;
  priceUnit: string;
  targetPrice: string;
  taxStatus: string;
  stockStatus: string;
  minimumOrderQuantity: string;
  deliveryTimeline: string;
  certificateAvailable: string;
  certificateRequired: string;
  photosAvailable: string;
  applicationOrUse: string;
  remarks: string;
};

export type WhatsappUploadSubmission = WhatsappUploadInput & {
  submissionId: string;
  createdAt: string;
  updatedAt: string;
  status: WhatsappUploadStatus;
  internalAdminNotes: string;
  statusTimeline: WhatsappStatusTimelineItem[];
  source: 'whatsapp-assisted-upload';
};

export type WhatsappUploadAdminPatch = {
  status?: WhatsappUploadStatus;
  internalAdminNotes?: string;
  note?: string;
};
