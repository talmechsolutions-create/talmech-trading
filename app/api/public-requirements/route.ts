import { NextRequest, NextResponse } from 'next/server';
import { csv, safePublicListing } from '@/lib/marketplaceStore';
import { leadEmailHtml, sendOrQueueEmail } from '@/lib/email';
import { clearLeads, createLead, createListing, listLeads } from '@/lib/proDb';
import {
  collectMissing,
  isValidEmail,
  isValidIndianMobile,
  isValidPincode,
  jsonSizeBytes,
  normalizeEmail,
  normalizeIndianMobile,
  normalizePincode,
  sanitizeMultiline,
  sanitizeString,
  sanitizeStringArray,
} from '@/lib/validation';
export const dynamic = 'force-dynamic';
const leadHeaders = ['id','createdAt','intent','companyName','contactName','phone','email','metal','product','grade','quantity','unit','state','city','area','pincode','targetPrice','dispatchReadiness','readyDispatchTime','productionLeadTime','deliveryEta','technicalDetails','mediaLinks','status','source'];
export async function GET(req: NextRequest) {
  const leads = await listLeads();
  if (req.nextUrl.searchParams.get('format') === 'csv') return new NextResponse(csv(leads, leadHeaders), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="talmech-admin-leads.csv"' } });
  return NextResponse.json({ leads, updatedAt: new Date().toISOString(), storage: process.env.DATABASE_URL ? 'database' : 'json-fallback' });
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (jsonSizeBytes(body) > 1_500_000) {
    return NextResponse.json({ ok: false, error: 'Requirement payload is too large.' }, { status: 413 });
  }

  const missing = collectMissing(body, ['companyName', 'contactName', 'phone', 'metal', 'product', 'quantity']);
  if (missing.length) {
    return NextResponse.json({ ok: false, error: missing[0].message, issues: missing }, { status: 400 });
  }

  if (!isValidIndianMobile(body.phone)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid Indian mobile number.' }, { status: 400 });
  }

  if (body.email && !isValidEmail(body.email)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (body.pincode && !isValidPincode(body.pincode)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid 6 digit PIN code.' }, { status: 400 });
  }

  const intent = sanitizeString(body.intent || 'BUY', 20).toUpperCase();
  const safeIntent = ['BUY', 'SELL', 'SCRAP', 'LOGISTICS'].includes(intent) ? intent : 'BUY';
  const lead = {
    id: `TL-${Date.now()}`,
    listingId: sanitizeString(body.listingId, 80),
    createdAt: new Date().toISOString(),
    status: 'New website lead',
    source: sanitizeString(body.source || 'Talmech public marketplace', 120),
    intent: safeIntent,
    companyName: sanitizeString(body.companyName, 140),
    contactName: sanitizeString(body.contactName, 120),
    phone: normalizeIndianMobile(body.phone),
    email: normalizeEmail(body.email),
    metal: sanitizeString(body.metal, 80),
    product: sanitizeString(body.product, 120),
    grade: sanitizeString(body.grade, 80),
    quantity: sanitizeString(body.quantity, 80),
    unit: sanitizeString(body.unit || 'KG', 40),
    targetPrice: sanitizeString(body.targetPrice, 120),
    state: sanitizeString(body.state, 80),
    city: sanitizeString(body.city, 80),
    area: sanitizeString(body.area, 120),
    pincode: normalizePincode(body.pincode),
    pickupAddress: sanitizeMultiline(body.pickupAddress || body.address, 700),
    address: sanitizeMultiline(body.address || body.pickupAddress, 700),
    dispatchReadiness: sanitizeString(body.dispatchReadiness, 80),
    readyDispatchTime: sanitizeString(body.readyDispatchTime, 80),
    productionLeadTime: sanitizeString(body.productionLeadTime, 80),
    deliveryEta: sanitizeString(body.deliveryEta, 120),
    technicalDetails: sanitizeMultiline(body.technicalDetails, 1600),
    mediaLinks: sanitizeStringArray(body.mediaLinks, 12, 500),
    mediaGallery: Array.isArray(body.mediaGallery) ? body.mediaGallery.slice(0, 6) : [],
    createMarketplaceListing: body.createMarketplaceListing !== false,
  };
  const savedLead = await createLead(lead);
  let listing = null;
  if (['SELL','BUY','SCRAP'].includes(String(lead.intent)) && !lead.listingId && lead.createMarketplaceListing !== false && lead.source !== 'Public marketplace CTA') { listing = await createListing(safePublicListing(savedLead)); }
  const html = leadEmailHtml(savedLead);
  const customerEmail = await sendOrQueueEmail({to: savedLead.email, subject: `Talmech Trading confirmation ${savedLead.id}`, html, leadId: savedLead.id});
  const adminEmail = await sendOrQueueEmail({to: process.env.ADMIN_NOTIFICATION_EMAIL, subject: `New Talmech website lead ${savedLead.id} - ${savedLead.intent} ${savedLead.metal}`, html, leadId: savedLead.id});
  return NextResponse.json({ ok: true, lead: savedLead, listing, email: { customerEmail, adminEmail } });
}
export async function DELETE() { await clearLeads(); return NextResponse.json({ ok: true }); }
