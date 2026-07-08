import { NextRequest, NextResponse } from 'next/server';
import { createCrmLead, listCrmLeads } from '@/lib/proDb';
import { csv } from '@/lib/marketplaceStore';
import { getStorageMode, publicStorageError } from '@/lib/storageMode';
import {
  isValidEmail,
  isValidIndianMobile,
  normalizeEmail,
  normalizeIndianMobile,
  sanitizeMultiline,
  sanitizeString,
  toFiniteNumber,
} from '@/lib/validation';
export const dynamic = 'force-dynamic';
const headers = ['id','createdAt','sourceLeadId','leadType','stage','company','contact','phone','email','city','state','metal','quantity','frequency','value','nextAction','notes'];
export async function GET(req: NextRequest) {
  const rows = await listCrmLeads();
  if (req.nextUrl.searchParams.get('format') === 'csv') return new NextResponse(csv(rows, headers), {headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="talmech-crm-leads.csv"'}});
  return NextResponse.json({leads:rows, updatedAt:new Date().toISOString(), storage: getStorageMode()});
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.email && !isValidEmail(body.email)) return NextResponse.json({ok:false,error:'Enter a valid email address.'},{status:400});
  if (body.phone && !isValidIndianMobile(body.phone)) return NextResponse.json({ok:false,error:'Enter a valid Indian mobile number.'},{status:400});
  const row = {
    id:`CRM-${Date.now()}`,
    createdAt:new Date().toISOString(),
    sourceLeadId: sanitizeString(body.sourceLeadId, 80),
    leadType: sanitizeString(body.leadType || body.type || 'General', 80),
    stage: sanitizeString(body.stage || 'New', 80),
    company: sanitizeString(body.company || body.companyName, 140),
    contact: sanitizeString(body.contact || body.contactName, 120),
    phone: body.phone ? normalizeIndianMobile(body.phone) : '',
    email: body.email ? normalizeEmail(body.email) : '',
    city: sanitizeString(body.city, 80),
    state: sanitizeString(body.state, 80),
    metal: sanitizeString(body.metal, 80),
    quantity: sanitizeString(body.quantity || body.qty, 80),
    frequency: sanitizeString(body.frequency, 80),
    value: toFiniteNumber(body.value, 0),
    nextAction: sanitizeString(body.nextAction || 'Call and qualify requirement', 180),
    notes: sanitizeMultiline(body.notes || body.technicalDetails, 1600),
    raw: {},
  };
  try {
    const created = await createCrmLead(row);
    return NextResponse.json({ok:true, lead:created});
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to save CRM lead.' }, { status: 500 });
  }
}
