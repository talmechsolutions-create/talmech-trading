import { NextRequest, NextResponse } from 'next/server';
import { csv } from '@/lib/marketplaceStore';
import { marketplaceDemoListings } from '@/lib/marketplaceData';
import { deleteListingById, listListings, updateListing } from '@/lib/proDb';
import { sanitizeMultiline, sanitizeString } from '@/lib/validation';
export const dynamic = 'force-dynamic';
function publicDemo() {
  return marketplaceDemoListings.map((x:any, i) => ({id:`DEMO-${i+1}`,type:x.type,metal:x.metal,product:x.product,grade:x.grade,quantity:String(x.qty||'').split(' ')[0]||'',unit:String(x.qty||'').split(' ').slice(1).join(' ')||'',priceType:x.price,state:x.location?.split(', ').pop()||'',city:x.location?.split(', ')[0]||'',area:'',pincode:x.pincode,dispatchReadiness:x.dispatch==='Ready'||String(x.dispatch).includes('day')?'READY_STOCK':'MAKE_TO_ORDER',deliveryEta:x.dispatch,status:'Open',lockStatus:'Available',verified:x.verified,createdAt:new Date().toISOString(),demo:true}));
}
function isPublicListing(row:any) {
  const raw = row?.raw || {};
  const visibility = String(raw.listingVisibility || row.listingVisibility || 'public').toLowerCase();
  const approval = String(raw.listingApprovalStatus || row.listingApprovalStatus || 'approved').toLowerCase();
  return visibility === 'public' && !['pending', 'pending admin review', 'draft', 'private'].includes(approval);
}
function safePublicRow(row:any) {
  const raw = row?.raw && typeof row.raw === 'object' ? { ...row.raw } : {};
  [
    'ownerUserId','accountId','ownerEmail','ownerMobile','contactPerson','email','mobile','alternateMobile',
    'adminNote','whatsappSubmissionId','createdByAdmin','profileConfirmationRequired'
  ].forEach((key) => delete raw[key]);
  return { ...row, raw };
}
export async function GET(req: NextRequest) {
  const rows = await listListings(false);
  const publicRows = rows.filter(isPublicListing).map(safePublicRow);
  const listings = [...publicRows, ...publicDemo()];
  if (req.nextUrl.searchParams.get('format') === 'csv') {
    const headers = ['id','leadId','createdAt','type','metal','product','grade','quantity','unit','priceType','state','city','area','pincode','dispatchReadiness','readyDispatchTime','productionLeadTime','deliveryEta','status','lockStatus','verified'];
    return new NextResponse(csv(rows, headers), {headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="talmech-marketplace-listings.csv"'}});
  }
  return NextResponse.json({ listings, updatedAt: new Date().toISOString(), storage: process.env.DATABASE_URL ? 'database' : 'json-fallback' });
}
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = sanitizeString(body.id, 80);
  if (!id) return NextResponse.json({ok:false, error:'Listing id required'}, {status:400});
  if (id.startsWith('DEMO')) return NextResponse.json({ok:false,error:'Demo listings cannot be edited through the API.'}, {status:400});
  const patchSource = body.patch && typeof body.patch === 'object' ? body.patch : body;
  const patch = {
    type: sanitizeString(patchSource.type, 20) || undefined,
    metal: sanitizeString(patchSource.metal, 80) || undefined,
    product: sanitizeString(patchSource.product, 120) || undefined,
    grade: sanitizeString(patchSource.grade, 80) || undefined,
    quantity: sanitizeString(patchSource.quantity, 80) || undefined,
    unit: sanitizeString(patchSource.unit, 40) || undefined,
    priceType: sanitizeString(patchSource.priceType, 120) || undefined,
    state: sanitizeString(patchSource.state, 80) || undefined,
    city: sanitizeString(patchSource.city, 80) || undefined,
    area: sanitizeString(patchSource.area, 120) || undefined,
    pincode: sanitizeString(patchSource.pincode, 6) || undefined,
    dispatchReadiness: sanitizeString(patchSource.dispatchReadiness, 80) || undefined,
    readyDispatchTime: sanitizeString(patchSource.readyDispatchTime, 80) || undefined,
    productionLeadTime: sanitizeString(patchSource.productionLeadTime, 80) || undefined,
    deliveryEta: sanitizeString(patchSource.deliveryEta, 120) || undefined,
    status: sanitizeString(patchSource.status, 80) || undefined,
    lockStatus: sanitizeString(patchSource.lockStatus, 80) || undefined,
    technicalSummary: sanitizeMultiline(patchSource.technicalSummary, 1200) || undefined,
  };
  const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  const listing = await updateListing(id, cleanPatch);
  if (listing) return NextResponse.json({ok:true, listing});
  return NextResponse.json({ok:false, error:'Listing not found'}, {status:404});
}
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ok:false,error:'Listing id required'}, {status:400});
  if (id.startsWith('DEMO')) return NextResponse.json({ok:false,error:'Demo listings cannot be deleted. Remove them from marketplaceData if needed.'}, {status:400});
  await deleteListingById(id);
  return NextResponse.json({ok:true});
}
