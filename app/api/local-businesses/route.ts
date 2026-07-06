import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || 'steel suppliers India';
  const location = searchParams.get('location') || 'India';
  const key = process.env.SERPAPI_KEY;

  if (!key) {
    return NextResponse.json({ source:'manual', message:'SERPAPI_KEY not configured. Use manual search links.', results: [], query, location });
  }

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine','google_maps');
  url.searchParams.set('q', query);
  url.searchParams.set('location', location);
  url.searchParams.set('api_key', key);
  const res = await fetch(url.toString(), { cache:'no-store' });
  const data = await res.json();
  const results = (data.local_results || []).slice(0, 20).map((x:any)=>({
    name:x.title, address:x.address, phone:x.phone, website:x.website, rating:x.rating, reviews:x.reviews, gps:x.gps_coordinates, source:'SerpApi Google Maps', mapsUrl:x.place_id ? `https://www.google.com/maps/place/?q=place_id:${x.place_id}` : undefined
  }));
  return NextResponse.json({ source:'serpapi', query, location, results, checkedAt:new Date().toISOString() });
}
