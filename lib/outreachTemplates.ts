import { sanitizeString } from '@/lib/validation';

export const outreachBusinessTypes = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'trader', label: 'Trader' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'forging', label: 'Forging / Foundry' },
  { value: 'fabrication', label: 'Fabrication' },
  { value: 'foundry', label: 'Foundry' },
  { value: 'recycler', label: 'Recycler / Scrap Dealer' },
  { value: 'manpower-prospect', label: 'Manpower Prospect' },
  { value: 'logistics-prospect', label: 'Logistics Prospect' },
  { value: 'inspection-prospect', label: 'NDT / Inspection Prospect' },
  { value: 'other', label: 'Other' },
] as const;

export const outreachIndustryTags = [
  'steel',
  'aluminium',
  'copper',
  'brass',
  'stainless',
  'scrap',
  'forging',
  'casting',
  'machining',
  'manpower',
  'ndt',
  'inspection',
  'logistics',
] as const;

export const outreachSources = [
  'Google search',
  'IndiaMART',
  'LinkedIn',
  'referral',
  'trade directory',
  'existing contact',
  'manual entry',
  'other',
] as const;

export const outreachConsentStatuses = [
  'unknown',
  'business-public-contact',
  'opted-in',
  'do-not-contact',
  'unsubscribed',
] as const;

export const outreachStatuses = [
  'draft',
  'ready',
  'email-sent',
  'whatsapp-prepared',
  'replied',
  'follow-up-needed',
  'not-interested',
  'converted',
  'do-not-contact',
] as const;

export type OutreachBusinessType = (typeof outreachBusinessTypes)[number]['value'];
export type OutreachConsentStatus = (typeof outreachConsentStatuses)[number];
export type OutreachStatus = (typeof outreachStatuses)[number];

export type OutreachProspectLike = {
  companyName?: string;
  contactPerson?: string;
  designation?: string;
  email?: string;
  mobile?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  businessType?: string;
  industryTags?: string[];
  source?: string;
  consentStatus?: string;
  outreachStatus?: string;
  assignedTemplate?: string;
  notes?: string;
};

type OutreachTemplate = {
  id: string;
  label: string;
  subject: string;
  purpose: string;
  pagePath: string;
  followUpDays: number;
  emailIntro: string;
  emailBody: string[];
  whatsappBody: string;
};

const stopLine = `If this is not relevant, reply 'STOP' and we will not contact again.`;

export const outreachTemplates: OutreachTemplate[] = [
  {
    id: 'buyer-outreach',
    label: 'Buyer outreach',
    subject: 'Verified metal sourcing support for your manufacturing requirements',
    purpose: 'Invite buyers and manufacturers to use Talmech for verified sourcing, RFQ support, price lock, logistics, and supplier discovery.',
    pagePath: '/post-requirement',
    followUpDays: 4,
    emailIntro: 'I found your business details through a business source and wanted to introduce Talmech Trading for material sourcing support.',
    emailBody: [
      'Talmech helps manufacturing and metal-buying teams share RFQs, discover verified suppliers, coordinate price lock discussions, and arrange logistics or buyer support where needed.',
      'We work around steel, copper, aluminium, brass, stainless, scrap, forging, casting, machining, inspection, NDT, manpower, and dispatch support requirements.',
      'If you have a current or upcoming material requirement, you can reply with the grade, quantity, delivery city, and target timeline. There is no pressure if this is not relevant for your team.',
    ],
    whatsappBody: 'We support manufacturing and metal businesses with verified sourcing, RFQ support, supplier discovery, logistics, inspection and manpower coordination.',
  },
  {
    id: 'seller-outreach',
    label: 'Seller / supplier outreach',
    subject: 'Talmech Trading support for seller listings and buyer requirements',
    purpose: 'Invite suppliers, stockists, scrap dealers, traders, and manufacturers to list products and receive buyer requirements.',
    pagePath: '/whatsapp-upload',
    followUpDays: 4,
    emailIntro: 'I found your business details through a business source and wanted to check whether Talmech can support your seller listings or buyer inquiries.',
    emailBody: [
      'Talmech helps suppliers, stockists, scrap dealers, traders, and manufacturers list available stock with product photos, grade, quantity, location, and dispatch details.',
      'Our admin-assisted workflow can help you upload by WhatsApp, create a dashboard account, and keep product or buyer-requirement details organized for follow-up.',
      'If you want to list available material, you can reply with product details or share photos through the WhatsApp upload flow. No pressure if this is not useful.',
    ],
    whatsappBody: 'We help suppliers, stockists, traders and scrap dealers list available material, product photos, location and dispatch details for buyer discovery.',
  },
  {
    id: 'trader-outreach',
    label: 'Trader outreach',
    subject: 'Talmech Trading support for stock, buyer requirements and regional inquiries',
    purpose: 'Invite traders to manage stock, buyer requirements, regional inquiries, and buyer-seller matching.',
    pagePath: '/crm',
    followUpDays: 4,
    emailIntro: 'I found your trading business details and wanted to introduce Talmech Trading as a practical support layer for metal trade workflows.',
    emailBody: [
      'Talmech can help organize stock availability, buyer RFQs, regional inquiries, seller discovery, and matching conversations across steel, non-ferrous, scrap, and industrial materials.',
      'The goal is simple: keep real requirements, available stock, logistics, and follow-up actions in one professional workflow.',
      'If you handle regular buying or selling requirements, you can reply with the material category and city you focus on. If this is not relevant, no problem.',
    ],
    whatsappBody: 'Talmech supports metal traders with stock listing, buyer requirements, regional inquiries, seller discovery, logistics and follow-up coordination.',
  },
  {
    id: 'manufacturer-outreach',
    label: 'Manufacturer / forging / foundry outreach',
    subject: 'Talmech Trading support for raw material, inspection, manpower and logistics needs',
    purpose: 'Explain Talmech support for raw material sourcing, inspection, manpower, logistics, and manufacturing intelligence.',
    pagePath: '/manufacturing-intelligence',
    followUpDays: 5,
    emailIntro: 'I found your manufacturing business details and wanted to introduce Talmech Trading for industrial support requirements.',
    emailBody: [
      'Talmech supports manufacturers, forging shops, fabrication units, foundries, and machining businesses with raw material sourcing, supplier discovery, RFQ follow-up, inspection, NDT, logistics, and manpower coordination.',
      'We also maintain TMIS and manufacturing intelligence content to keep material, process, quality, and buyer-seller conversations structured.',
      'If any sourcing, inspection, dispatch, or manpower requirement is active, you can reply with a short requirement. If not, there is no pressure.',
    ],
    whatsappBody: 'Talmech supports manufacturers, forging shops, foundries and fabrication units with raw material sourcing, inspection, NDT, manpower and logistics coordination.',
  },
  {
    id: 'manpower-services',
    label: 'Manpower services outreach',
    subject: 'Skilled manpower, NDT, inspection and fabrication support for industrial work',
    purpose: 'For companies needing skilled manpower, inspection, finishing, fabrication, dispatch, warehouse, or maintenance support.',
    pagePath: '/manpower-services',
    followUpDays: 5,
    emailIntro: 'I found your business details and wanted to check whether Talmech can support any skilled industrial manpower or inspection requirement.',
    emailBody: [
      'Talmech can coordinate NDT support, metal inspection, quality inspection, grinding and finishing manpower, fabrication support, loading or dispatch supervision, plant maintenance support, and warehouse or inventory support.',
      'We keep the conversation requirement-led: scope, location, duration, skills needed, shift timing, and site safety expectations are checked before any commitment.',
      'If you have a current manpower or inspection requirement, you can reply with the location and work scope. If this is not relevant, no problem.',
    ],
    whatsappBody: 'Talmech can support NDT, metal inspection, quality checks, grinding and finishing manpower, fabrication support, dispatch supervision and plant maintenance coordination.',
  },
  {
    id: 'logistics-outreach',
    label: 'Logistics outreach',
    subject: 'Material dispatch and logistics support with Talmech Trading',
    purpose: 'For transport/logistics providers and businesses needing material dispatch support.',
    pagePath: '/logistics',
    followUpDays: 5,
    emailIntro: 'I found your business details and wanted to check whether Talmech can support material dispatch or logistics coordination.',
    emailBody: [
      'Talmech works with industrial material movements where pickup, drop, load type, vehicle requirement, dispatch supervision, and commercial responsibility need to be clear before movement.',
      'For logistics providers, Talmech can record service areas, vehicle types, pricing rules, and contract status for future industrial dispatch opportunities.',
      'If logistics support or onboarding is relevant, you can reply with your service city, vehicle type, and contact details. If not, no problem.',
    ],
    whatsappBody: 'Talmech coordinates material dispatch support and logistics provider onboarding for industrial material movement, service areas, vehicles and pricing rules.',
  },
  {
    id: 'follow-up',
    label: 'Follow-up',
    subject: 'Following up on Talmech Trading support',
    purpose: 'Professional follow-up after 3 to 5 days.',
    pagePath: '/contact',
    followUpDays: 5,
    emailIntro: 'I am following up once on my earlier note about Talmech Trading.',
    emailBody: [
      'If any sourcing, listing, RFQ, logistics, inspection, manpower, or manufacturing-support requirement is active, I would be happy to understand it and guide the next step.',
      'If this is not relevant for your business right now, no problem at all.',
    ],
    whatsappBody: 'Following up once on my earlier Talmech message. If you need sourcing, listing, RFQ, logistics, inspection or manpower support, I can help with the next step.',
  },
  {
    id: 'opt-out-confirmation',
    label: 'Opt-out confirmation',
    subject: 'Talmech Trading contact preference updated',
    purpose: 'Confirm that a contact has been marked do-not-contact.',
    pagePath: '/contact',
    followUpDays: 0,
    emailIntro: 'Thank you for letting us know.',
    emailBody: [
      'I have marked your contact as do-not-contact for Talmech Trading outreach.',
      'You should not receive further prospect outreach from us unless you contact us again or request support directly.',
    ],
    whatsappBody: 'Thank you for letting us know. I have marked your contact as do-not-contact for Talmech Trading outreach.',
  },
];

export function normalizeBusinessType(value: unknown): OutreachBusinessType {
  const clean = sanitizeString(value, 80).toLowerCase();
  const direct = outreachBusinessTypes.find((item) => item.value === clean);
  if (direct) return direct.value;
  if (clean.includes('buyer')) return 'buyer';
  if (clean.includes('seller') || clean.includes('supplier') || clean.includes('stockist')) return 'seller';
  if (clean.includes('trader')) return 'trader';
  if (clean.includes('foundry')) return 'foundry';
  if (clean.includes('forging') || clean.includes('forge')) return 'forging';
  if (clean.includes('fabrication') || clean.includes('fabricator')) return 'fabrication';
  if (clean.includes('scrap') || clean.includes('recycl')) return 'recycler';
  if (clean.includes('manpower') || clean.includes('labour') || clean.includes('labor')) return 'manpower-prospect';
  if (clean.includes('logistics') || clean.includes('transport')) return 'logistics-prospect';
  if (clean.includes('inspection') || clean.includes('ndt') || clean.includes('quality')) return 'inspection-prospect';
  if (clean.includes('manufacturer') || clean.includes('manufacturing')) return 'manufacturer';
  return 'other';
}

export function normalizeConsentStatus(value: unknown): OutreachConsentStatus {
  const clean = sanitizeString(value, 80).toLowerCase();
  return outreachConsentStatuses.includes(clean as OutreachConsentStatus)
    ? (clean as OutreachConsentStatus)
    : 'unknown';
}

export function normalizeOutreachStatus(value: unknown): OutreachStatus {
  const clean = sanitizeString(value, 80).toLowerCase();
  return outreachStatuses.includes(clean as OutreachStatus) ? (clean as OutreachStatus) : 'draft';
}

export function normalizeTemplateId(value: unknown, fallbackBusinessType: unknown = 'other') {
  const clean = sanitizeString(value, 120);
  if (outreachTemplates.some((template) => template.id === clean)) return clean;
  return defaultTemplateForBusinessType(fallbackBusinessType);
}

export function defaultTemplateForBusinessType(value: unknown) {
  const businessType = normalizeBusinessType(value);
  if (businessType === 'buyer') return 'buyer-outreach';
  if (businessType === 'seller' || businessType === 'recycler') return 'seller-outreach';
  if (businessType === 'trader') return 'trader-outreach';
  if (['manufacturer', 'forging', 'fabrication', 'foundry', 'inspection-prospect'].includes(businessType)) return 'manufacturer-outreach';
  if (businessType === 'manpower-prospect') return 'manpower-services';
  if (businessType === 'logistics-prospect') return 'logistics-outreach';
  return 'buyer-outreach';
}

export function templateById(templateId: unknown, businessType: unknown = 'other') {
  const normalized = normalizeTemplateId(templateId, businessType);
  return outreachTemplates.find((template) => template.id === normalized) || outreachTemplates[0];
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function prospectName(prospect: OutreachProspectLike) {
  return prospect.contactPerson || prospect.companyName || 'there';
}

function siteUrl(pathname: string) {
  const root = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://talmechtrading.in';
  return `${root}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function suggestedPageLinks(businessType: unknown) {
  const template = templateById(defaultTemplateForBusinessType(businessType), businessType);
  const links = [
    { label: template.label, href: template.pagePath },
    { label: 'Public marketplace', href: '/public-marketplace' },
  ];
  if (['manufacturer', 'forging', 'fabrication', 'foundry', 'inspection-prospect'].includes(normalizeBusinessType(businessType))) {
    links.push({ label: 'Manufacturing intelligence', href: '/manufacturing-intelligence' });
  }
  if (normalizeBusinessType(businessType) === 'manpower-prospect') links.push({ label: 'Manpower services', href: '/manpower-services' });
  if (normalizeBusinessType(businessType) === 'logistics-prospect') links.push({ label: 'Logistics', href: '/logistics' });
  return links.slice(0, 3);
}

export function followUpStrategy(businessType: unknown) {
  const template = templateById(defaultTemplateForBusinessType(businessType), businessType);
  return {
    templateId: template.id,
    days: template.followUpDays,
    label: template.followUpDays ? `Follow up after ${template.followUpDays} days if there is no reply.` : 'No follow-up after opt-out.',
  };
}

export function renderOutreachEmail(prospect: OutreachProspectLike, templateId?: string) {
  const template = templateById(templateId || prospect.assignedTemplate, prospect.businessType);
  const link = siteUrl(template.pagePath);
  const salutation = prospect.contactPerson ? `Dear ${prospect.contactPerson},` : 'Hello,';
  const identity = 'Raghavendra from Talmech Trading';
  const textLines = [
    salutation,
    '',
    `This is ${identity}. ${template.emailIntro}`,
    '',
    ...template.emailBody,
    '',
    `You can also review the relevant Talmech page here: ${link}`,
    '',
    stopLine,
    '',
    'Regards,',
    'Raghavendra Tiwari',
    'Talmech Trading',
    'WhatsApp / Support: +91 7389642874',
  ];
  const text = textLines.join('\n');
  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
    <p>${escapeHtml(salutation)}</p>
    <p>This is ${escapeHtml(identity)}. ${escapeHtml(template.emailIntro)}</p>
    ${template.emailBody.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    <p>You can also review the relevant Talmech page here: <a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
    <p>${escapeHtml(stopLine)}</p>
    <p>Regards,<br/>Raghavendra Tiwari<br/><b>Talmech Trading</b><br/>WhatsApp / Support: +91 7389642874</p>
  </div>`;

  return {
    templateId: template.id,
    subject: template.subject,
    text,
    html,
    purpose: template.purpose,
    pageLink: link,
    followUp: followUpStrategy(prospect.businessType),
  };
}

export function normalizeWhatsappNumber(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`;
  return digits.slice(0, 15);
}

export function renderWhatsAppMessage(prospect: OutreachProspectLike, templateId?: string) {
  const template = templateById(templateId || prospect.assignedTemplate, prospect.businessType);
  const sourceLine = prospect.source ? `I found your business details through ${prospect.source}.` : 'I found your business details publicly.';
  return [
    `Hello ${prospectName(prospect)}, this is Raghavendra from Talmech Trading.`,
    template.whatsappBody,
    sourceLine,
    `If Talmech can support your material requirements, listings, logistics, inspection or manpower needs, please reply here.`,
    stopLine,
  ].join(' ');
}

export function whatsappClickToChat(number: unknown, message: string) {
  const normalized = normalizeWhatsappNumber(number);
  if (!normalized) return '';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
