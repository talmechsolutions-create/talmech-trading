import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { leadsFile, listingsFile, readJsonArray, writeJsonArray } from '@/lib/marketplaceStore';

const g = globalThis as unknown as { prisma?: PrismaClient };
const prisma = g.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;

const dataDir = path.join(process.cwd(), 'data');
const usersFiles = {
  buyer: path.join(dataDir, 'user-buyers.json'),
  seller: path.join(dataDir, 'user-sellers.json'),
  trader: path.join(dataDir, 'user-traders.json'),
};
const priceLocksFile = path.join(dataDir, 'price-locks.json');
const crmFile = path.join(dataDir, 'crm-leads.json');
const invoicesFile = path.join(dataDir, 'invoices.json');
const paymentsFile = path.join(dataDir, 'payments.json');
const payoutsFile = path.join(dataDir, 'admin-payouts.json');
const logisticsProvidersFile = path.join(dataDir, 'logistics-providers.json');

export const useDatabase = () => Boolean(process.env.DATABASE_URL);

/*
  Production readiness:
  - DATABASE_URL should be configured for deployed environments.
  - The JSON files in /data are local development fallbacks only and are ignored by git.
  - Keep writes funneled through these helpers so Prisma and JSON fallback behavior stay aligned.
*/
function clean<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([,v]) => v !== undefined)) as T;
}

async function withDb<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (!useDatabase()) return fallback();
  try { return await fn(); } catch (err) { console.error('[Talmech DB fallback]', err); return fallback(); }
}

function objectOrEmpty(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function withUserRawFields(row: any) {
  if (!row) return row;
  const raw = objectOrEmpty(row.raw);
  return { ...raw, ...row, raw: row.raw };
}

const userRegistrationColumns = new Set([
  'status',
  'accountType',
  'roleCategory',
  'firmName',
  'ownerName',
  'businessRole',
  'directorName',
  'gstNumber',
  'primaryMobile',
  'alternateMobile',
  'email',
  'state',
  'city',
  'area',
  'pincode',
  'fullAddress',
  'liveLocation',
  'locationPermission',
  'tradingProducts',
  'monthlyTradingVolume',
  'monthlyTradingVolumeUnit',
  'tradeScope',
  'annualTurnoverAmount',
  'annualTurnoverUnit',
  'tradingExperienceYears',
  'buyerSellerMix',
  'majorMarkets',
  'importExportCode',
  'paymentCycle',
  'warehouseDetails',
  'subscriptionRequired',
  'subscriptionPlan',
  'rejectionReason',
  'shopImages',
  'documents',
]);

const marketplaceListingColumns = new Set([
  'leadId',
  'type',
  'metal',
  'product',
  'grade',
  'quantity',
  'unit',
  'targetPrice',
  'priceType',
  'state',
  'city',
  'area',
  'pincode',
  'pickupAddress',
  'pickupLat',
  'pickupLng',
  'pickupMapUrl',
  'dispatchReadiness',
  'readyDispatchTime',
  'productionLeadTime',
  'deliveryEta',
  'technicalSummary',
  'mediaCount',
  'mediaGallery',
  'previewImages',
  'status',
  'lockStatus',
  'verified',
]);

export async function listLeads() {
  return withDb(
    async () => (await prisma.publicLead.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates),
    async () => readJsonArray(leadsFile)
  );
}

export async function createLead(lead: any) {
  return withDb(async () => {
    const row = await prisma.publicLead.create({ data: clean({
      id: lead.id,
      createdAt: new Date(lead.createdAt || Date.now()),
      status: lead.status || 'New website lead',
      source: lead.source,
      intent: String(lead.intent || 'BUY'),
      companyName: lead.companyName,
      contactName: lead.contactName,
      phone: lead.phone,
      email: lead.email,
      metal: lead.metal,
      product: lead.product,
      grade: lead.grade,
      quantity: String(lead.quantity || ''),
      unit: lead.unit,
      targetPrice: lead.targetPrice,
      state: lead.state,
      city: lead.city,
      area: lead.area,
      pincode: lead.pincode,
      dispatchReadiness: lead.dispatchReadiness,
      readyDispatchTime: lead.readyDispatchTime,
      productionLeadTime: lead.productionLeadTime,
      deliveryEta: lead.deliveryEta,
      technicalDetails: lead.technicalDetails,
      mediaLinks: lead.mediaLinks,
      mediaGallery: lead.mediaGallery,
      raw: lead
    })});
    return fromDbDates(row);
  }, async () => {
    const rows = await readJsonArray(leadsFile); rows.unshift(lead); await writeJsonArray(leadsFile, rows); return lead;
  });
}

export async function clearLeads() {
  return withDb(async () => { await prisma.publicLead.deleteMany({}); return true; }, async () => { await writeJsonArray(leadsFile, []); return true; });
}

export async function listListings(includeDemo = false, demoRows: any[] = []) {
  return withDb(async () => {
    const rows = (await prisma.marketplaceListing.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates);
    return includeDemo ? [...rows, ...demoRows] : rows;
  }, async () => {
    const rows = await readJsonArray(listingsFile);
    return includeDemo ? [...rows, ...demoRows] : rows;
  });
}

export async function createListing(listing: any) {
  return withDb(async () => {
    const row = await prisma.marketplaceListing.create({ data: clean({
      id: listing.id,
      leadId: listing.leadId,
      createdAt: new Date(listing.createdAt || Date.now()),
      type: String(listing.type || 'SELL'),
      metal: listing.metal,
      product: listing.product,
      grade: listing.grade,
      quantity: String(listing.quantity || ''),
      unit: listing.unit,
      targetPrice: listing.targetPrice,
      priceType: listing.priceType,
      state: listing.state,
      city: listing.city,
      area: listing.area,
      pincode: listing.pincode,
      pickupAddress: listing.pickupAddress || listing.address,
      pickupLat: listing.pickupLat ? Number(listing.pickupLat) : undefined,
      pickupLng: listing.pickupLng ? Number(listing.pickupLng) : undefined,
      pickupMapUrl: listing.pickupMapUrl,
      dispatchReadiness: listing.dispatchReadiness,
      readyDispatchTime: listing.readyDispatchTime,
      productionLeadTime: listing.productionLeadTime,
      deliveryEta: listing.deliveryEta,
      technicalSummary: listing.technicalSummary,
      mediaCount: Number(listing.mediaCount || 0),
      mediaGallery: listing.mediaGallery,
      previewImages: listing.previewImages,
      status: listing.status || 'Open',
      lockStatus: listing.lockStatus || 'Available',
      verified: Boolean(listing.verified),
      raw: listing.raw || listing
    })});
    return fromDbDates(row);
  }, async () => {
    const rows = await readJsonArray(listingsFile); rows.unshift(listing); await writeJsonArray(listingsFile, rows); return listing;
  });
}

export async function findListing(id: string) {
  const rows = await listListings(false);
  return rows.find((row: any) => row.id === id) || null;
}

export async function updateListing(id: string, patch: any) {
  return withDb(async () => {
    const existing = await prisma.marketplaceListing.findUnique({ where: { id } });
    if (!existing) return null;
    const data: Record<string, any> = {};
    Object.entries(patch || {}).forEach(([key, value]) => {
      if (marketplaceListingColumns.has(key)) data[key] = value;
    });
    const row = await prisma.marketplaceListing.update({ where: { id }, data: clean({ ...data, updatedAt: new Date(), raw: { ...objectOrEmpty((existing as any).raw), ...(patch.raw || patch) } }) });
    return fromDbDates(row);
  }, async () => {
    const rows = await readJsonArray(listingsFile); const idx = rows.findIndex((r:any)=>r.id===id); if (idx < 0) return null; rows[idx] = {...rows[idx], ...patch, updatedAt: new Date().toISOString()}; await writeJsonArray(listingsFile, rows); return rows[idx];
  });
}

export async function deleteListingById(id: string) {
  return withDb(async () => { await prisma.marketplaceListing.delete({ where: { id } }); return true; }, async () => { const rows = await readJsonArray(listingsFile); await writeJsonArray(listingsFile, rows.filter((r:any)=>r.id!==id)); return true; });
}

function userFileFor(accountType: string) {
  const lower = accountType.toLowerCase();
  if (lower.includes('trader')) return usersFiles.trader;
  if (lower.includes('seller') || lower.includes('supplier') || lower.includes('manufacturer') || lower.includes('scrap')) return usersFiles.seller;
  return usersFiles.buyer;
}

export async function listUsers() {
  return withDb(async () => (await prisma.userRegistration.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates).map(withUserRawFields), async () => {
    const [buyers, sellers, traders] = await Promise.all([readJsonArray(usersFiles.buyer), readJsonArray(usersFiles.seller), readJsonArray(usersFiles.trader)]);
    return [...buyers.map((x:any)=>({...x,table:'buyers'})),...sellers.map((x:any)=>({...x,table:'sellers'})),...traders.map((x:any)=>({...x,table:'traders'}))].sort((a:any,b:any)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  });
}

export async function findUser(key: string) {
  const users = await listUsers();
  return users.find((x:any)=>x.id===key || x.primaryMobile===key || x.email===key) || null;
}

export async function createUserRegistration(user: any) {
  return withDb(async () => {
    const existing = await prisma.userRegistration.findFirst({ where: { OR: [{primaryMobile:user.primaryMobile||'__none__'}, {email:user.email||'__none__'}, {gstNumber:user.gstNumber||'__none__'}] }});
    if (existing) return { duplicate: withUserRawFields(fromDbDates(existing)) };
    const row = await prisma.userRegistration.create({ data: clean({
      id: user.id,
      createdAt: new Date(user.createdAt || Date.now()),
      status: user.status || 'PENDING_REVIEW',
      accountType: user.accountType || 'Buyer',
      roleCategory: user.roleCategory,
      firmName: user.firmName,
      ownerName: user.ownerName,
      businessRole: user.businessRole,
      directorName: user.directorName,
      gstNumber: user.gstNumber,
      primaryMobile: user.primaryMobile,
      alternateMobile: user.alternateMobile,
      email: user.email,
      state: user.state,
      city: user.city,
      area: user.area,
      pincode: user.pincode,
      fullAddress: user.fullAddress,
      liveLocation: user.liveLocation,
      locationPermission: Boolean(user.locationPermission),
      tradingProducts: user.tradingProducts,
      monthlyTradingVolume: user.monthlyTradingVolume,
      monthlyTradingVolumeUnit: user.monthlyTradingVolumeUnit,
      tradeScope: user.tradeScope,
      annualTurnoverAmount: user.annualTurnoverAmount,
      annualTurnoverUnit: user.annualTurnoverUnit,
      tradingExperienceYears: user.tradingExperienceYears,
      buyerSellerMix: user.buyerSellerMix,
      majorMarkets: user.majorMarkets,
      importExportCode: user.importExportCode,
      paymentCycle: user.paymentCycle,
      warehouseDetails: user.warehouseDetails,
      subscriptionRequired: Boolean(user.subscriptionRequired),
      subscriptionPlan: user.subscriptionPlan,
      shopImages: user.shopImages,
      documents: user.documents,
      raw: user
    })});
    return { user: withUserRawFields(fromDbDates(row)) };
  }, async () => {
    const file = userFileFor(user.accountType || 'Buyer');
    const rows = await readJsonArray(file);
    const duplicate = rows.find((r:any)=>r.primaryMobile===user.primaryMobile || (user.email && r.email===user.email) || (user.gstNumber && r.gstNumber===user.gstNumber));
    if (duplicate) return { duplicate };
    rows.unshift(user); await writeJsonArray(file, rows); return { user };
  });
}

export async function updateUserRegistrationRecord(id: string, patch: any) {
  return withDb(async () => {
    const existing = await prisma.userRegistration.findUnique({ where: { id } });
    if (!existing) return null;
    const data: Record<string, any> = {};
    Object.entries(patch || {}).forEach(([key, value]) => {
      if (userRegistrationColumns.has(key)) data[key] = value;
    });
    const raw = { ...objectOrEmpty((existing as any).raw), ...(patch || {}) };
    const row = await prisma.userRegistration.update({
      where: { id },
      data: clean({ ...data, raw }),
    });
    return withUserRawFields(fromDbDates(row));
  }, async () => {
    for (const file of Object.values(usersFiles)) {
      const rows = await readJsonArray(file);
      const idx = rows.findIndex((r:any)=>r.id===id);
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], ...(patch || {}), updatedAt: new Date().toISOString() };
        await writeJsonArray(file, rows);
        return rows[idx];
      }
    }
    return null;
  });
}

export async function updateUserRegistrationStatus(id: string, status: string, reason?: string) {
  return withDb(async () => {
    const row = await prisma.userRegistration.update({ where: { id }, data: clean({ status, rejectionReason: reason, updatedAt: new Date() }) });
    await logAdminAction('system', `USER_${status}`, 'UserRegistration', id, reason);
    return fromDbDates(row);
  }, async () => {
    for (const file of Object.values(usersFiles)) { const rows = await readJsonArray(file); const idx = rows.findIndex((r:any)=>r.id===id); if (idx >= 0) { rows[idx] = {...rows[idx], status, rejectionReason: reason, updatedAt:new Date().toISOString()}; await writeJsonArray(file, rows); return rows[idx]; } }
    return null;
  });
}

export async function listPriceLocks() {
  return withDb(async () => (await prisma.priceLock.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates), async () => readJsonArray(priceLocksFile));
}

export async function createPriceLock(row: any) {
  return withDb(async () => {
    const created = await prisma.priceLock.create({ data: clean({
      id: row.id,
      createdAt: new Date(row.createdAt || Date.now()),
      status: row.status,
      listingId: row.listingId && !String(row.listingId).startsWith('DEMO') ? row.listingId : undefined,
      buyerName: row.buyerName,
      buyerPhone: row.buyerPhone,
      buyerEmail: row.buyerEmail,
      metal: row.metal,
      product: row.product,
      grade: row.grade,
      quantity: String(row.quantity || ''),
      unit: row.unit,
      offeredQuantity: String(row.offeredQuantity || ''),
      offeredUnit: row.offeredUnit,
      paymentMode: row.paymentMode,
      requestedQuantity: Number(row.requestedQuantity || row.quantity || 0),
      requestedUnit: row.requestedUnit || row.unit,
      rate: String(row.rate || ''),
      materialValue: Number(row.materialValue || 0),
      gstRate: Number(row.gstRate || 0),
      gstHsn: row.gstHsn,
      materialGst: Number(row.materialGst || 0),
      buyerServiceFee: Number(row.buyerServiceFee || 0),
      buyerServiceGst: Number(row.buyerServiceGst || 0),
      sellerServiceFee: Number(row.sellerServiceFee || 0),
      buyerPayableEstimate: Number(row.buyerPayableEstimate || 0),
      priceLockAdvance: Number(row.priceLockAdvance || 0),
      fullPaymentAmount: Number(row.fullPaymentAmount || 0),
      paymentAmount: Number(row.paymentAmount || row.payableNow || row.priceLockAdvance || 0),
      supplierNetEstimate: Number(row.supplierNetEstimate || 0),
      balanceOnDispatch: Number(row.balanceOnDispatch || 0),
      buyerRemarks: row.buyerRemarks,
      sellerRemarks: row.sellerRemarks,
      rateBasis: row.rateBasis,
      paymentOrderId: row.paymentOrderId,
      paymentId: row.paymentId,
      paidAt: row.paidAt ? new Date(row.paidAt) : undefined,
      invoiceId: row.invoiceId,
      terms: row.terms,
      logisticsRequired: Boolean(row.logisticsRequired),
      logisticsProviderId: row.logisticsProviderId,
      logisticsProviderName: row.logisticsProviderName,
      logisticsVehicleId: row.logisticsVehicleId,
      logisticsVehicleName: row.logisticsVehicleName,
      logisticsDistanceKm: Number(row.logisticsDistanceKm || 0),
      logisticsEtaLabel: row.logisticsEtaLabel,
      logisticsEtaBy: row.logisticsEtaBy,
      logisticsTransitMinutes: Number(row.logisticsTransitMinutes || 0),
      logisticsCost: Number(row.logisticsCost || 0),
      logisticsBuyerPayable: Number(row.logisticsBuyerPayable || 0),
      logisticsSellerPayable: Number(row.logisticsSellerPayable || 0),
      logisticsPaymentResponsibility: row.logisticsPaymentResponsibility,
      logisticsPickup: row.logisticsPickup,
      logisticsDrop: row.logisticsDrop,
      logisticsScheduleDate: row.logisticsScheduleDate,
      logisticsPickupLat: row.logisticsPickupLat ? Number(row.logisticsPickupLat) : undefined,
      logisticsPickupLng: row.logisticsPickupLng ? Number(row.logisticsPickupLng) : undefined,
      logisticsDropLat: row.logisticsDropLat ? Number(row.logisticsDropLat) : undefined,
      logisticsDropLng: row.logisticsDropLng ? Number(row.logisticsDropLng) : undefined,
      buyerDeliveryAddress: row.buyerDeliveryAddress,
      raw: row
    })});
    return fromDbDates(created);
  }, async () => { const rows = await readJsonArray(priceLocksFile); rows.unshift(row); await writeJsonArray(priceLocksFile, rows); return row; });
}


export async function findPriceLock(id: string) {
  return withDb(async () => {
    const row = await prisma.priceLock.findUnique({ where: { id } });
    return fromDbDates(row);
  }, async () => {
    const rows = await readJsonArray(priceLocksFile);
    return rows.find((r:any)=>r.id===id) || null;
  });
}

export async function updatePriceLock(id: string, patch: any) {
  return withDb(async () => {
    const row = await prisma.priceLock.update({ where: { id }, data: clean({ ...patch, paidAt: patch.paidAt ? new Date(patch.paidAt) : undefined, updatedAt: new Date(), raw: patch.raw || patch }) });
    return fromDbDates(row);
  }, async () => {
    const rows = await readJsonArray(priceLocksFile);
    const idx = rows.findIndex((r:any)=>r.id===id);
    if (idx < 0) return null;
    rows[idx] = {...rows[idx], ...patch, updatedAt:new Date().toISOString()};
    await writeJsonArray(priceLocksFile, rows);
    return rows[idx];
  });
}

export async function listInvoices() {
  return withDb(async () => (await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates), async () => readJsonArray(invoicesFile));
}

export async function findInvoice(id: string) {
  const rows = await listInvoices();
  return rows.find((r:any)=>r.id===id) || null;
}

export async function createInvoice(row: any) {
  return withDb(async () => {
    const created = await prisma.invoice.create({ data: clean({
      id: row.id,
      createdAt: new Date(row.createdAt || Date.now()),
      status: row.status || 'Issued',
      leadId: row.leadId,
      lockId: row.lockId,
      amount: Number(row.amount || 0),
      gstAmount: Number(row.gstAmount || 0),
      total: Number(row.total || 0),
      customer: row.customer,
      items: row.items,
      terms: row.terms,
      logisticsRequired: Boolean(row.logisticsRequired),
      logisticsProviderId: row.logisticsProviderId,
      logisticsProviderName: row.logisticsProviderName,
      logisticsVehicleId: row.logisticsVehicleId,
      logisticsVehicleName: row.logisticsVehicleName,
      logisticsDistanceKm: Number(row.logisticsDistanceKm || 0),
      logisticsEtaLabel: row.logisticsEtaLabel,
      logisticsEtaBy: row.logisticsEtaBy,
      logisticsTransitMinutes: Number(row.logisticsTransitMinutes || 0),
      logisticsCost: Number(row.logisticsCost || 0),
      logisticsBuyerPayable: Number(row.logisticsBuyerPayable || 0),
      logisticsSellerPayable: Number(row.logisticsSellerPayable || 0),
      logisticsPaymentResponsibility: row.logisticsPaymentResponsibility,
      logisticsPickup: row.logisticsPickup,
      logisticsDrop: row.logisticsDrop,
      logisticsScheduleDate: row.logisticsScheduleDate,
      logisticsPickupLat: row.logisticsPickupLat ? Number(row.logisticsPickupLat) : undefined,
      logisticsPickupLng: row.logisticsPickupLng ? Number(row.logisticsPickupLng) : undefined,
      logisticsDropLat: row.logisticsDropLat ? Number(row.logisticsDropLat) : undefined,
      logisticsDropLng: row.logisticsDropLng ? Number(row.logisticsDropLng) : undefined,
      buyerDeliveryAddress: row.buyerDeliveryAddress,
      raw: row
    })});
    return fromDbDates(created);
  }, async () => { const rows = await readJsonArray(invoicesFile); rows.unshift(row); await writeJsonArray(invoicesFile, rows); return row; });
}

export async function listPayments() {
  return withDb(
    async () => (await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates),
    async () => readJsonArray(paymentsFile)
  );
}

export async function createPayment(row: any) {
  const normalized = {
    id: row.id || `PAY-${Date.now()}`,
    createdAt: row.createdAt || new Date().toISOString(),
    status: row.status || 'RECORDED',
    provider: row.provider || 'razorpay',
    providerOrderId: row.providerOrderId || row.razorpayOrderId || row.orderId,
    providerPaymentId: row.providerPaymentId || row.razorpayPaymentId || row.paymentId,
    method: row.method,
    paymentType: row.paymentType,
    amount: Number(row.amount || 0),
    currency: row.currency || 'INR',
    lockId: row.lockId || row.priceLockId,
    invoiceId: row.invoiceId,
    buyerName: row.buyerName,
    buyerPhone: row.buyerPhone,
    buyerEmail: row.buyerEmail,
    paymentMode: row.paymentMode,
    raw: row.raw || row,
  };

  return withDb(async () => {
    if (normalized.providerPaymentId) {
      const existing = await prisma.payment.findFirst({
        where: { providerPaymentId: normalized.providerPaymentId },
      });
      if (existing) return fromDbDates(existing);
    }
    const created = await prisma.payment.create({ data: clean(normalized) });
    return fromDbDates(created);
  }, async () => {
    const rows = await readJsonArray(paymentsFile);
    if (normalized.providerPaymentId && rows.some((r:any)=>r.providerPaymentId===normalized.providerPaymentId)) return rows.find((r:any)=>r.providerPaymentId===normalized.providerPaymentId);
    rows.unshift(normalized);
    await writeJsonArray(paymentsFile, rows);
    return normalized;
  });
}

export async function listAdminPayouts() {
  return withDb(
    async () => (await prisma.adminPayout.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates),
    async () => readJsonArray(payoutsFile)
  );
}

export async function createAdminPayout(row: any) {
  const amount = Number(row.amount || 0);
  const gstAmount = Number(row.gstAmount || 0);
  const tdsAmount = Number(row.tdsAmount || 0);
  const deductions = Number(row.deductions || 0);
  const normalized = {
    id: row.id || `POUT-${Date.now()}`,
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: row.status || 'DRAFT',
    payoutType: row.payoutType || 'SELLER_SETTLEMENT',
    payableToType: row.payableToType || 'SELLER',
    payableToName: row.payableToName || '',
    payableToPhone: row.payableToPhone || '',
    payableToEmail: row.payableToEmail || '',
    payableToGst: row.payableToGst || '',
    payableToBank: row.payableToBank || {},
    lockId: row.lockId || '',
    invoiceId: row.invoiceId || '',
    paymentId: row.paymentId || '',
    logisticsProviderId: row.logisticsProviderId || '',
    logisticsProviderName: row.logisticsProviderName || '',
    amount,
    gstAmount,
    tdsAmount,
    deductions,
    netPayable: Number(row.netPayable ?? Math.max(0, amount + gstAmount - tdsAmount - deductions)),
    currency: row.currency || 'INR',
    paymentMode: row.paymentMode || 'BANK_TRANSFER',
    adminReference: row.adminReference || '',
    payoutInvoiceId: row.payoutInvoiceId || `PINV-${Date.now()}`,
    paidAt: row.paidAt || null,
    notes: row.notes || '',
    raw: row.raw || row,
  };

  return withDb(async () => {
    const created = await prisma.adminPayout.create({ data: clean({ ...normalized, paidAt: normalized.paidAt ? new Date(normalized.paidAt) : undefined }) });
    return fromDbDates(created);
  }, async () => {
    const rows = await readJsonArray(payoutsFile);
    rows.unshift(normalized);
    await writeJsonArray(payoutsFile, rows);
    return normalized;
  });
}

export async function updateAdminPayout(id: string, patch: any) {
  return withDb(async () => {
    const row = await prisma.adminPayout.update({ where: { id }, data: clean({ ...patch, updatedAt: new Date(), paidAt: patch.paidAt ? new Date(patch.paidAt) : undefined, raw: patch.raw || patch }) });
    return fromDbDates(row);
  }, async () => {
    const rows = await readJsonArray(payoutsFile);
    const idx = rows.findIndex((r:any)=>r.id===id);
    if (idx < 0) return null;
    rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() };
    await writeJsonArray(payoutsFile, rows);
    return rows[idx];
  });
}

export async function listCrmLeads() {
  return withDb(async () => (await prisma.crmLead.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates), async () => readJsonArray(crmFile));
}

export async function createCrmLead(row: any) {
  return withDb(async () => {
    const created = await prisma.crmLead.create({ data: clean({
      id: row.id,
      sourceLeadId: row.sourceLeadId,
      leadType: row.leadType,
      stage: row.stage || 'New',
      company: row.company,
      contact: row.contact,
      phone: row.phone,
      email: row.email,
      city: row.city,
      state: row.state,
      metal: row.metal,
      quantity: row.quantity,
      frequency: row.frequency,
      value: Number(row.value || 0),
      nextAction: row.nextAction,
      notes: row.notes,
      raw: row
    })}); return fromDbDates(created);
  }, async () => { const rows = await readJsonArray(crmFile); rows.unshift(row); await writeJsonArray(crmFile, rows); return row; });
}

export async function logAdminAction(actor: string, action: string, entity?: string, entityId?: string, note?: string) {
  if (!useDatabase()) return null;
  try { return await prisma.adminAction.create({ data: { id:`ACT-${Date.now()}`, actor, action, entity, entityId, note } }); } catch { return null; }
}

function fromDbDates(row: any) {
  if (!row) return row;
  return Object.fromEntries(Object.entries(row).map(([k,v]) => [k, v instanceof Date ? v.toISOString() : v]));
}


export async function listLogisticsProviders() {
  return withDb(async () => (await prisma.logisticsProvider.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates), async () => {
    const rows = await readJsonArray(logisticsProvidersFile);
    if (rows.length) return rows;
    const { defaultLogisticsProviders } = await import('@/lib/logistics');
    return defaultLogisticsProviders;
  });
}
export async function createLogisticsProvider(row: any) {
  return withDb(async () => { const created = await prisma.logisticsProvider.create({ data: clean({ id: row.id, createdAt: new Date(row.createdAt || Date.now()), status: row.status || 'PENDING_CONTRACT', companyName: row.companyName, contactName: row.contactName, phone: row.phone, email: row.email, website: row.website, gstNumber: row.gstNumber, panNumber: row.panNumber, address: row.address, country: row.country || 'India', state: row.state, city: row.city, nearbyCities: row.nearbyCities || [], serviceableCountries: row.serviceableCountries || ['India'], serviceableStates: row.serviceableStates || [], serviceableCities: row.serviceableCities || [], serviceTypes: row.serviceTypes || [], specializations: row.specializations || [], deliveryType: row.deliveryType, speed: row.speed, capacityMt: Number(row.capacityMt || 0), fleetSize: Number(row.fleetSize || 0), availabilityDates: row.availabilityDates || [], unavailableDates: row.unavailableDates || [], baseRate: Number(row.baseRate || 0), ratePerKm: Number(row.ratePerKm || 0), ratePerMt: Number(row.ratePerMt || 0), minimumCharge: Number(row.minimumCharge || 0), loadingCharge: Number(row.loadingCharge || 0), insurancePercent: Number(row.insurancePercent || 0), fuelSurchargePercent: Number(row.fuelSurchargePercent || 0), gstPercent: Number(row.gstPercent || 0.18), contractStatus: row.contractStatus || 'NOT_SENT', contractNotes: row.contractNotes, paymentResponsibilityDefault: row.paymentResponsibilityDefault || 'BUYER', adminNotes: row.adminNotes, adminPricingLocked: row.adminPricingLocked !== false, raw: row })}); return fromDbDates(created); }, async () => { const rows = await readJsonArray(logisticsProvidersFile); rows.unshift(row); await writeJsonArray(logisticsProvidersFile, rows); return row; });
}
export async function updateLogisticsProvider(id: string, patch: any) {
  return withDb(async () => { const row = await prisma.logisticsProvider.update({ where: { id }, data: clean({ ...patch, updatedAt: new Date(), raw: patch }) }); return fromDbDates(row); }, async () => { const rows = await readJsonArray(logisticsProvidersFile); const idx = rows.findIndex((r:any)=>r.id===id); if (idx < 0) return null; rows[idx] = {...rows[idx], ...patch, updatedAt: new Date().toISOString()}; await writeJsonArray(logisticsProvidersFile, rows); return rows[idx]; });
}
export async function deleteLogisticsProvider(id: string) {
  return withDb(async () => { await prisma.logisticsProvider.delete({ where: { id } }); return true; }, async () => { const rows = await readJsonArray(logisticsProvidersFile); await writeJsonArray(logisticsProvidersFile, rows.filter((r:any)=>r.id!==id)); return true; });
}
