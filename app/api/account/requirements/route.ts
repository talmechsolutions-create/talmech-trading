import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionUser } from '@/lib/clientAuth';
import { createLead, listLeads } from '@/lib/proDb';
import { isValidIndianMobile, normalizeEmail, normalizeIndianMobile, normalizePincode, sanitizeMultiline, sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function ownsLead(lead: any, user: any) {
  const raw = lead?.raw || {};
  const nested = raw.raw || {};
  return lead.ownerUserId === user.id || raw.ownerUserId === user.id || nested.ownerUserId === user.id || raw.accountId === user.id || raw.ownerEmail === user.email || raw.ownerMobile === user.primaryMobile;
}

export async function GET(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  const requirements = (await listLeads()).filter((lead: any) => ownsLead(lead, user));
  return NextResponse.json({ ok: true, requirements, updatedAt: new Date().toISOString() });
}

export async function POST(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const phone = normalizeIndianMobile(body.phone || user.primaryMobile);
  if (!sanitizeString(body.metal, 80) || !sanitizeString(body.product, 140) || !sanitizeString(body.quantity, 80)) {
    return NextResponse.json({ ok: false, error: 'Metal, product and quantity are required.' }, { status: 400 });
  }
  if (!isValidIndianMobile(phone)) return NextResponse.json({ ok: false, error: 'A valid mobile number is required.' }, { status: 400 });

  const now = new Date().toISOString();
  const lead = {
    id: `REQ-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    status: 'New client requirement',
    source: 'Client workspace',
    intent: 'BUY',
    companyName: sanitizeString(body.companyName || user.firmName, 160),
    contactName: sanitizeString(body.contactName || user.ownerName, 120),
    phone,
    email: normalizeEmail(body.email || user.email),
    metal: sanitizeString(body.metal, 80),
    product: sanitizeString(body.product, 140),
    grade: sanitizeString(body.grade, 100),
    quantity: sanitizeString(body.quantity, 80),
    unit: sanitizeString(body.unit || body.quantityUnit || 'KG', 40),
    targetPrice: sanitizeString(body.targetPrice, 120),
    state: sanitizeString(body.state || user.state, 80),
    city: sanitizeString(body.city || user.city, 80),
    area: sanitizeString(body.area, 120),
    pincode: normalizePincode(body.pincode),
    pickupAddress: sanitizeMultiline(body.deliveryLocation || body.address || user.fullAddress, 800),
    address: sanitizeMultiline(body.deliveryLocation || body.address || user.fullAddress, 800),
    dispatchReadiness: sanitizeString(body.dispatchReadiness, 80),
    readyDispatchTime: sanitizeString(body.readyDispatchTime, 80),
    productionLeadTime: sanitizeString(body.productionLeadTime, 80),
    deliveryEta: sanitizeString(body.deliveryTimeline || body.deliveryEta, 120),
    technicalDetails: sanitizeMultiline(body.technicalDetails || body.remarks, 1600),
    mediaLinks: [],
    mediaGallery: [],
    createMarketplaceListing: false,
    ownerUserId: user.id,
    accountId: user.id,
    ownerEmail: user.email,
    ownerMobile: user.primaryMobile,
    raw: {
      ownerUserId: user.id,
      accountId: user.id,
      ownerEmail: user.email,
      ownerMobile: user.primaryMobile,
      source: 'client-workspace',
    },
  };
  const requirement = await createLead(lead);
  return NextResponse.json({ ok: true, requirement });
}
