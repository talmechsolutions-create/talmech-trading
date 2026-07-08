import { NextResponse } from 'next/server';
import { createCrmLead } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';
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
export async function POST(req:Request){
  const body=await req.json().catch(()=>({}));
  if (body.email && !isValidEmail(body.email)) return NextResponse.json({success:false,error:'Enter a valid email address.'},{status:400});
  if (body.phone && !isValidIndianMobile(body.phone)) return NextResponse.json({success:false,error:'Enter a valid Indian mobile number.'},{status:400});
  try {
    const lead = await createCrmLead({
    id:`CRM-${Date.now()}`,
    createdAt:new Date().toISOString(),
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
    value: toFiniteNumber(body.value, 0),
    nextAction: sanitizeString(body.nextAction || 'Call and qualify', 160),
    notes: sanitizeMultiline(body.notes || body.technicalDetails, 1600),
    raw: {}
    });
    return NextResponse.json({success:true,leadId:lead.id,lead});
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json({ success: false, ...storageError }, { status: storageError.status });
    return NextResponse.json({ success: false, error: 'Unable to save lead.' }, { status: 500 });
  }
}
