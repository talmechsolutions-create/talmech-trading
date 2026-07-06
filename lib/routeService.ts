export type RoutePoint = { lat: number; lng: number };
export type RoadRouteResult = {
  ok: boolean;
  provider: 'openrouteservice' | 'fallback';
  distanceKm: number;
  durationMinutes: number;
  source: string;
  error?: string;
};

function authHeaders(apiKey: string): HeadersInit {
  return { Authorization: apiKey, 'Content-Type': 'application/json', Accept: 'application/json' };
}

function geocodeHeaders(apiKey: string): HeadersInit {
  return { Authorization: apiKey, Accept: 'application/json' };
}

export function toRoutePoint(lat: any, lng: any): RoutePoint | null {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < 6 || la > 38 || ln < 68 || ln > 98) return null;
  return { lat: la, lng: ln };
}

export async function getOpenRouteServiceRoute(input: {
  pickupLat?: any;
  pickupLng?: any;
  dropLat?: any;
  dropLng?: any;
}): Promise<RoadRouteResult | null> {
  const envKey = process.env.OPENROUTESERVICE_API_KEY?.trim();
  const pickup = toRoutePoint(input.pickupLat, input.pickupLng);
  const drop = toRoutePoint(input.dropLat, input.dropLng);
  if (!envKey || !pickup || !drop) return null;

  const apiKey: string = envKey;
  const body = { coordinates: [[pickup.lng, pickup.lat], [drop.lng, drop.lat]], instructions: false };

  async function call(profile: 'driving-hgv' | 'driving-car'): Promise<RoadRouteResult> {
    const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ORS ${profile} ${res.status} ${text}`.trim());
    }
    const data = await res.json();
    const route = data?.routes?.[0];
    const distanceMeters = Number(route?.summary?.distance || 0);
    const durationSeconds = Number(route?.summary?.duration || 0);
    if (!distanceMeters || !durationSeconds) throw new Error('ORS route summary missing');
    return {
      ok: true,
      provider: 'openrouteservice',
      distanceKm: Math.max(1, Math.round((distanceMeters / 1000) * 10) / 10),
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      source: profile,
    };
  }

  try {
    return await call('driving-hgv');
  } catch (hgvError: any) {
    try { return await call('driving-car'); }
    catch (carError: any) {
      return { ok: false, provider: 'openrouteservice', distanceKm: 0, durationMinutes: 0, source: 'openrouteservice', error: String(carError?.message || hgvError?.message || 'OpenRouteService failed') };
    }
  }
}

export async function geocodeIndiaAddress(query: string) {
  const envKey = process.env.OPENROUTESERVICE_API_KEY?.trim();
  const q = String(query || '').trim();
  if (!envKey || q.length < 4) return [];
  const apiKey: string = envKey;
  const url = new URL('https://api.openrouteservice.org/geocode/search');
  url.searchParams.set('text', q.toLowerCase().includes('india') ? q : `${q}, India`);
  url.searchParams.set('boundary.country', 'IN');
  url.searchParams.set('size', '5');
  try {
    const res = await fetch(url.toString(), { headers: geocodeHeaders(apiKey), cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.features || []).map((feature: any) => {
      const coords = feature?.geometry?.coordinates || [];
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!toRoutePoint(lat, lng)) return null;
      return { label: feature?.properties?.label || feature?.properties?.name || `${lat}, ${lng}`, lat, lng, confidence: feature?.properties?.confidence };
    }).filter(Boolean);
  } catch (error) {
    console.error('ORS GEOCODE ERROR:', error);
    return [];
  }
}
