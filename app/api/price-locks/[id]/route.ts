import { NextResponse } from 'next/server';
import { findPriceLock } from '@/lib/proDb';
import { publicStorageError } from '@/lib/storageMode';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const lock = await findPriceLock(params.id);
    if (!lock) return NextResponse.json({ok:false,error:'Price lock not found'}, {status:404});
    return NextResponse.json({ok:true, lock, razorpayKeyId: process.env.RAZORPAY_KEY_ID || '', gatewayReady: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)});
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    console.error('PRICE_LOCK_GET_FAILED', error);
    return NextResponse.json({ ok: false, error: 'Unable to load price lock.' }, { status: 500 });
  }
}
