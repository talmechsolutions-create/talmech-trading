import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminPayout,
  createInvoice,
  findPriceLock,
  listAdminPayouts,
  listInvoices,
  listPayments,
  listPriceLocks,
  updateAdminPayout,
} from '@/lib/proDb';
import { csv } from '@/lib/marketplaceStore';
import { auditAdminAction } from '@/lib/security/auditLog';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

function money(n: any) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v : 0;
}

function paymentStage(lock: any) {
  const paid = money(lock.paymentAmount || lock.priceLockAdvance || 0);
  const total = money(lock.buyerPayableEstimate || lock.fullPaymentAmount || 0);
  const balance = Math.max(0, money(lock.balanceOnDispatch || total - paid));
  const mode = lock.paymentMode === 'FULL_PAYMENT' ? 'FULL_PAYMENT' : 'PARTIAL_PRICE_LOCK';
  const paidOk = Boolean(lock.paymentId || /PAID|VERIFIED|ACTIVE|CAPTURED/i.test(String(lock.status || '')));
  return { mode, paid, total, balance, paidOk, label: mode === 'FULL_PAYMENT' ? 'Full payment' : 'Partial / 25% price-lock' };
}

function summarize(locks: any[], payments: any[], payouts: any[]) {
  const received = payments.reduce((s, p) => s + money(p.amount), 0);
  const pendingBuyerBalance = locks.reduce((s, l) => s + money(l.balanceOnDispatch), 0);
  const logisticsPayable = locks.reduce((s, l) => s + money(l.logisticsCost || l.logisticsSellerPayable), 0);
  const sellerPayable = locks.reduce((s, l) => s + money(l.supplierNetEstimate || (money(l.materialValue) - money(l.sellerServiceFee))), 0);
  const payoutDone = payouts.filter(p => /PAID|COMPLETED/i.test(String(p.status))).reduce((s, p) => s + money(p.netPayable), 0);
  const payoutPending = payouts.filter(p => !/PAID|COMPLETED|CANCELLED/i.test(String(p.status))).reduce((s, p) => s + money(p.netPayable), 0);
  return { received, pendingBuyerBalance, logisticsPayable, sellerPayable, payoutDone, payoutPending, paymentCount: payments.length, payoutCount: payouts.length };
}

export async function GET(req: NextRequest) {
  try {
    const [locks, payments, invoices, payouts] = await Promise.all([
      listPriceLocks(),
      listPayments(),
      listInvoices(),
      listAdminPayouts(),
    ]);

    const rows = locks.map((lock: any) => ({ ...lock, paymentStage: paymentStage(lock) }));

    if (req.nextUrl.searchParams.get('format') === 'csv') {
      const exportRows = rows.map((r: any) => ({
        id: r.id,
        createdAt: r.createdAt,
        buyerName: r.buyerName,
        buyerPhone: r.buyerPhone,
        product: `${r.product || ''} ${r.grade || ''}`.trim(),
        paymentMode: r.paymentStage.label,
        paymentStatus: r.status,
        razorpayPaymentId: r.paymentId,
        amountReceived: r.paymentStage.paid,
        totalBuyerPayable: r.paymentStage.total,
        balancePending: r.paymentStage.balance,
        logisticsProvider: r.logisticsProviderName,
        logisticsCost: r.logisticsCost,
        sellerNetEstimate: r.supplierNetEstimate,
        invoiceId: r.invoiceId,
      }));
      return new NextResponse(csv(exportRows, Object.keys(exportRows[0] || { id: '' })), {
        headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="talmech-payment-tracker.csv"' },
      });
    }

    return NextResponse.json({
      ok: true,
      locks: rows,
      payments,
      invoices,
      payouts,
      summary: summarize(locks, payments, payouts),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    console.error('ADMIN_PAYMENTS_GET_FAILED', error);
    return NextResponse.json({ ok: false, error: 'Unable to load payment tracker.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || 'CREATE_PAYOUT');

  if (action === 'CREATE_PAYOUT') {
    try {
      const lock = body.lockId ? await findPriceLock(String(body.lockId)) : null;
      const payoutType = String(body.payoutType || 'SELLER_SETTLEMENT');
      const isLogistics = payoutType === 'LOGISTICS_VENDOR_PAYMENT';
      const baseAmount = money(body.amount || (isLogistics ? lock?.logisticsCost : lock?.supplierNetEstimate));
      const gstAmount = money(body.gstAmount || 0);
      const tdsAmount = money(body.tdsAmount || 0);
      const deductions = money(body.deductions || 0);
      const payout = await createAdminPayout({
        status: 'READY_FOR_PAYMENT',
        payoutType,
        payableToType: isLogistics ? 'LOGISTICS_VENDOR' : 'SELLER_SUPPLIER',
        payableToName: body.payableToName || (isLogistics ? lock?.logisticsProviderName : lock?.sellerName || lock?.companyName || 'Seller / Supplier'),
        payableToPhone: body.payableToPhone || '',
        payableToEmail: body.payableToEmail || '',
        payableToGst: body.payableToGst || '',
        payableToBank: body.payableToBank || {},
        lockId: body.lockId || '',
        invoiceId: body.invoiceId || lock?.invoiceId || '',
        paymentId: body.paymentId || lock?.paymentId || '',
        logisticsProviderId: lock?.logisticsProviderId || body.logisticsProviderId || '',
        logisticsProviderName: lock?.logisticsProviderName || body.logisticsProviderName || '',
        amount: baseAmount,
        gstAmount,
        tdsAmount,
        deductions,
        netPayable: Math.max(0, baseAmount + gstAmount - tdsAmount - deductions),
        paymentMode: body.paymentMode || 'BANK_TRANSFER',
        notes: body.notes || '',
        raw: { body, lock },
      });

      const invoice = await createInvoice({
        id: payout.payoutInvoiceId,
        status: 'Payout voucher issued',
        lockId: payout.lockId,
        amount: payout.amount,
        gstAmount: payout.gstAmount,
        total: payout.netPayable,
        customer: { name: payout.payableToName, gstNumber: payout.payableToGst, type: payout.payableToType },
        items: [{ description: payout.payoutType === 'LOGISTICS_VENDOR_PAYMENT' ? 'Logistics vendor freight payout' : 'Seller / supplier settlement payout', amount: payout.amount, gstAmount: payout.gstAmount, deductions: payout.deductions, tdsAmount: payout.tdsAmount, netPayable: payout.netPayable }],
        terms: 'Internal payout voucher. Release payment only after verification of supplier invoice, dispatch, delivery proof and bank details.',
        raw: { payout },
      });

      await auditAdminAction({
        action: 'ADMIN_PAYOUT_CREATE',
        entity: 'AdminPayout',
        entityId: payout.id,
        note: `lock:${payout.lockId};invoice:${invoice.id}`,
      });

      return NextResponse.json({ ok: true, payout, invoice });
    } catch (error) {
      const storageError = publicStorageError(error);
      if (storageError) return NextResponse.json(storageError, { status: storageError.status });
      return NextResponse.json({ ok: false, error: 'Unable to create payout.' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: 'Unsupported payment tracker action.' }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ ok: false, error: 'Missing payout id.' }, { status: 400 });
  const patch: any = { ...(body.patch || {}) };
  if (patch.status === 'PAID_COMPLETED' && !patch.paidAt) patch.paidAt = new Date().toISOString();
  try {
    const payout = await updateAdminPayout(id, patch);
    if (payout) {
      await auditAdminAction({
        action: 'ADMIN_PAYOUT_UPDATE',
        entity: 'AdminPayout',
        entityId: id,
        note: `status:${patch.status || ''}`,
      });
    }
    return NextResponse.json({ ok: Boolean(payout), payout });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update payout.' }, { status: 500 });
  }
}
