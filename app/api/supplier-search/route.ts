import {NextRequest, NextResponse} from 'next/server';
import {buildSupplierQueries, supplierSegments} from '@/lib/supplierKnowledge';
import { rateLimitResponse } from '@/lib/security/rateLimit';

type SupplierResult = {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  source: string;
  query: string;
  mapsUrl?: string;
  type?: string;
  confidence: 'Live internet result' | 'Fallback demo result';
};

function normalizePhone(phone?: string) {
  return phone ? phone.replace(/[^0-9+]/g, '') : undefined;
}

function demoSupplierResults(query: string, location: string): SupplierResult[] {
  const city = location.split(',')[0] || location;
  const names = [
    'Shree Industrial Metals', 'Prime Alloy & Steel Traders', 'Bharat Metal Stock Yard',
    'Omkar Scrap & Recycling', 'Metro Rolling & Sections', 'Unity Non Ferrous Depot'
  ];
  return names.map((name, i) => ({
    name: `${name} - ${city}`,
    address: `Industrial Area ${i + 1}, ${location}`,
    phone: `+91${String(9822000000 + i * 34721).slice(0, 10)}`,
    rating: 4.0 + (i % 5) * 0.1,
    reviews: 12 + i * 9,
    source: 'Demo supplier until SERPAPI_KEY is active',
    query,
    mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
    type: 'Supplier lead',
    confidence: 'Fallback demo result'
  }));
}

async function searchSerpApiGoogleMaps(query: string): Promise<SupplierResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_maps');
  url.searchParams.set('q', query);
  url.searchParams.set('gl', 'in');
  url.searchParams.set('hl', 'en');
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString(), { next: { revalidate: 60 * 60 } });
  if (!response.ok) return [];
  const data = await response.json();
  const rows = Array.isArray(data.local_results) ? data.local_results : [];

  return rows.slice(0, 12).map((row: any) => ({
    name: row.title || row.name || 'Unnamed supplier',
    address: row.address || row.place_results?.address || 'Address not available',
    phone: normalizePhone(row.phone),
    website: row.website,
    rating: row.rating,
    reviews: row.reviews,
    source: 'SerpApi Google Maps live result',
    query,
    mapsUrl: row.place_id ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.title || query)}&query_place_id=${row.place_id}` : `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
    type: Array.isArray(row.types) ? row.types.join(', ') : row.type,
    confidence: 'Live internet result'
  }));
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitResponse(request, { keyPrefix: 'supplier-search', limit: 20, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const metal = String(body.metal || 'Steel');
    const segmentName = String(body.segment || 'Steel stockists and service centers');
    const state = String(body.state || 'Maharashtra');
    const city = String(body.city || 'Pune');
    const customLocation = String(body.customLocation || '').trim();
    const radiusMode = String(body.radiusMode || 'city');
    const includeAllIndia = Boolean(body.includeAllIndia);

    const segment = supplierSegments.find(s => s.name === segmentName) || supplierSegments[0];
    const location = includeAllIndia ? 'India' : customLocation || [city, state].filter(Boolean).join(', ');
    const suffix = radiusMode === 'industrial-area' ? `${location} industrial area MIDC GIDC SIDCO` : location;
    const queries = buildSupplierQueries(segment, metal, suffix);

    let results: SupplierResult[] = [];
    for (const query of queries) {
      const live = await searchSerpApiGoogleMaps(query);
      results = [...results, ...live];
      if (results.length >= 20) break;
    }

    const unique = Array.from(new Map(results.map(item => [`${item.name}-${item.address}`, item])).values()).slice(0, 25);
    if (unique.length) {
      return NextResponse.json({
        results: unique,
        queries,
        mode: 'live',
        checkedAt: new Date().toISOString(),
        message: 'Live supplier/manufacturer search completed using SerpApi Google Maps results. Verify GST, stock, grade and price before trading.'
      });
    }

    return NextResponse.json({
      results: demoSupplierResults(queries[0], location),
      queries,
      mode: 'fallback',
      checkedAt: new Date().toISOString(),
      message: 'No live supplier results returned. Check SERPAPI_KEY in .env.local or use manual search links.'
    });
  } catch (error) {
    return NextResponse.json({ results: [], message: 'Supplier search failed. Check server logs and API key.' }, { status: 500 });
  }
}
