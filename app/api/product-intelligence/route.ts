import { NextResponse } from 'next/server';
import { getProductIntelligence } from '@/lib/productIntelligence';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const product = url.searchParams.get('product') || 'Metal product';
  const metal = url.searchParams.get('metal') || 'steel';
  return NextResponse.json(getProductIntelligence(product, metal));
}
