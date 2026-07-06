import { NextResponse } from 'next/server';
import { metals } from '@/lib/data';

export const dynamic = 'force-dynamic';

type RateStatus = 'LIVE' | 'FALLBACK_ESTIMATE' | 'MANUAL_QUOTE_REQUIRED';

type RateRow = {
  slug: string;
  metal: string;
  name: string;
  price: number;
  unit: string;
  status: RateStatus;
  source: string;
  provider: string;
  change: string;
  changePercent: number;
  city: string;
  state: string;
  grade: string;
  checkedAt: string;
  sourceUpdatedAt: string;
  warning: string;
  isLive: boolean;
  isFallback: boolean;
  isManualQuoteRequired: boolean;
  confidence: 'high' | 'medium' | 'low';
  note: string;
};

const liveCapableMetals = new Set(['copper', 'aluminum', 'zinc', 'nickel', 'lead', 'gold', 'silver']);

function baseRows(checkedAt: string): RateRow[] {
  return metals.map((metal) => {
    const liveCapable = liveCapableMetals.has(metal.slug);
    const manual = !liveCapable;
    return {
      slug: metal.slug,
      metal: metal.name,
      name: metal.name,
      price: metal.price,
      unit: metal.unit,
      status: manual ? 'MANUAL_QUOTE_REQUIRED' : 'FALLBACK_ESTIMATE',
      source: manual
        ? 'Manual supplier quote required before trading'
        : 'Static fallback estimate; provider API can replace this row when configured',
      provider: 'static-seed',
      change: `${metal.change >= 0 ? '+' : ''}${metal.change}%`,
      changePercent: metal.change,
      city: metal.city,
      state: metal.state,
      grade: metal.grade,
      checkedAt,
      sourceUpdatedAt: metal.updatedAt || checkedAt,
      warning: manual
        ? 'This metal needs supplier/admin confirmation. Do not treat it as a live tradable market rate.'
        : 'Fallback estimate only. Add provider keys and regional premium review before using in commercial quotes.',
      isLive: false,
      isFallback: liveCapable,
      isManualQuoteRequired: manual,
      confidence: manual ? 'low' : 'medium',
      note: manual
        ? 'Local product-wise rates require supplier verification.'
        : 'Base-metal estimate needs regional premium and supplier quote confirmation.',
    };
  });
}

function pick(rates: unknown, names: string[]) {
  if (!rates || typeof rates !== 'object') return null;
  const lower: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rates)) lower[key.toLowerCase()] = value;
  for (const name of names) {
    const value = lower[name.toLowerCase()];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  for (const [key, value] of Object.entries(lower)) {
    if (names.some((name) => key.includes(name.toLowerCase())) && typeof value === 'number') {
      return value;
    }
  }
  return null;
}

function mt(value: unknown) {
  return Math.round(Number(value) * 1000);
}

function kg(value: unknown) {
  return Math.round(Number(value));
}

function tenG(value: unknown) {
  return Math.round(Number(value) / 100);
}

async function metalsDevPrices(key: string, checkedAt: string) {
  const url = `https://api.metals.dev/v1/latest?api_key=${encodeURIComponent(key)}&currency=INR&unit=kg`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Metals.dev ${res.status}`);
  const data = await res.json();
  const rates = data.metals || data.rates || data.data || data;
  const rows = baseRows(checkedAt);
  const sourceUpdatedAt = data.timestamp
    ? new Date(Number(data.timestamp) * 1000).toISOString()
    : data.updated_at || checkedAt;
  const map: Record<string, { names: string[]; convert: (value: unknown) => number; unit: string }> = {
    copper: { names: ['copper', 'xcu', 'cu'], convert: mt, unit: 'MT' },
    aluminum: { names: ['aluminum', 'aluminium', 'xal', 'alu'], convert: mt, unit: 'MT' },
    zinc: { names: ['zinc', 'xzn', 'zn'], convert: mt, unit: 'MT' },
    nickel: { names: ['nickel', 'xni', 'ni'], convert: mt, unit: 'MT' },
    lead: { names: ['lead', 'xpb', 'pb'], convert: mt, unit: 'MT' },
    gold: { names: ['gold', 'xau', 'au'], convert: tenG, unit: '10G' },
    silver: { names: ['silver', 'xag', 'ag'], convert: kg, unit: 'KG' },
  };

  return rows.map((row) => {
    const spec = map[row.slug];
    if (!spec) return row;
    const value = pick(rates, spec.names);
    if (!value) return row;
    return {
      ...row,
      price: spec.convert(value),
      unit: spec.unit,
      status: 'LIVE' as RateStatus,
      source: 'Metals.dev provider rate; regional premium still needs supplier review',
      provider: 'Metals.dev',
      sourceUpdatedAt,
      warning:
        'Provider-backed base rate. Regional premium, grade, quantity, GST, freight and supplier confirmation are still required.',
      isLive: true,
      isFallback: false,
      isManualQuoteRequired: false,
      confidence: 'high' as const,
      note: 'API-backed base price. Use as reference, not final order price.',
    };
  });
}

async function metalPriceApiPrices(key: string, checkedAt: string) {
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${encodeURIComponent(key)}&base=INR`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`MetalpriceAPI ${res.status}`);
  const data = await res.json();
  const sourceUpdatedAt = data.timestamp ? new Date(Number(data.timestamp) * 1000).toISOString() : checkedAt;

  return baseRows(checkedAt).map((row) =>
    row.status === 'MANUAL_QUOTE_REQUIRED'
      ? row
      : {
          ...row,
          provider: 'MetalpriceAPI',
          source: 'MetalpriceAPI configured; symbol conversion requires production verification',
          sourceUpdatedAt,
          warning:
            'Provider configured, but this row remains a fallback estimate until symbol conversion is validated for production.',
        }
  );
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const errors: string[] = [];
  let prices = baseRows(checkedAt);

  if (process.env.METALS_DEV_API_KEY) {
    try {
      prices = await metalsDevPrices(process.env.METALS_DEV_API_KEY, checkedAt);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Metals.dev unavailable');
    }
  } else if (process.env.METALPRICE_API_KEY) {
    try {
      prices = await metalPriceApiPrices(process.env.METALPRICE_API_KEY, checkedAt);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'MetalpriceAPI unavailable');
    }
  }

  const liveCount = prices.filter((row) => row.status === 'LIVE').length;
  const nextRefreshAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return NextResponse.json({
    checkedAt,
    requestedAt: checkedAt,
    serverUpdatedAt: checkedAt,
    nextRefreshAt,
    refreshSeconds: 300,
    source: liveCount
      ? `${liveCount} provider-backed live base rates; remaining rows need fallback/manual review`
      : 'No provider-backed live rates. Showing fallback estimates and manual quote rows.',
    prices,
    errors,
    note:
      'Only rows marked LIVE are provider-backed base rates. Product-wise, steel, brass, iron, scrap and local supplier prices need manual quote verification.',
  });
}
