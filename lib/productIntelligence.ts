import fs from 'fs';
import path from 'path';

type JsonRecord = Record<string, any>;
export type ProductIntelPoint = { city: string; state: string; score: number; volume: string; note: string };
export type ProductIntelResponse = {
  product: string;
  metal: string;
  monthLabel: string;
  updatedAt: string;
  supplierRegions: ProductIntelPoint[];
  demandRegions: ProductIntelPoint[];
  source: 'marketplace-data' | 'fallback-market-model';
};

const fallbackSupplier: Record<string, ProductIntelPoint[]> = {
  steel: [
    { city: 'Raipur', state: 'Chhattisgarh', score: 96, volume: 'High mill/stockist availability', note: 'Long and structural steel sourcing belt' },
    { city: 'Pune', state: 'Maharashtra', score: 92, volume: 'High dealer and fabrication stock', note: 'Strong industrial buyer/supplier cluster' },
    { city: 'Mumbai', state: 'Maharashtra', score: 89, volume: 'High trading liquidity', note: 'Large steel dealer and port-linked market' },
    { city: 'Ahmedabad', state: 'Gujarat', score: 86, volume: 'Strong structural steel network', note: 'Fabrication and construction supply hub' },
    { city: 'Indore', state: 'Madhya Pradesh', score: 82, volume: 'Regional stockist base', note: 'Central India route advantage' },
    { city: 'Nagpur', state: 'Maharashtra', score: 78, volume: 'Transit-friendly stock', note: 'Central logistics position' },
    { city: 'Ghaziabad', state: 'Uttar Pradesh', score: 76, volume: 'Dealer/fabricator cluster', note: 'NCR industrial access' },
    { city: 'Jamshedpur', state: 'Jharkhand', score: 74, volume: 'Mill-linked sourcing', note: 'Primary steel ecosystem' },
    { city: 'Bhopal', state: 'Madhya Pradesh', score: 70, volume: 'Regional availability', note: 'Local project and dealer supply' },
    { city: 'Bengaluru', state: 'Karnataka', score: 68, volume: 'Industrial stockists', note: 'South market access' }
  ],
  copper: [
    { city: 'Mumbai', state: 'Maharashtra', score: 94, volume: 'High importer/dealer activity', note: 'Non-ferrous trading hub' },
    { city: 'Delhi NCR', state: 'Delhi', score: 88, volume: 'Electrical and panel supply', note: 'Buyer/supplier density' },
    { city: 'Ahmedabad', state: 'Gujarat', score: 84, volume: 'Industrial distribution', note: 'Cable and electrical ecosystem' },
    { city: 'Pune', state: 'Maharashtra', score: 80, volume: 'Auto/electrical buyers', note: 'Local industrial consumption' },
    { city: 'Bengaluru', state: 'Karnataka', score: 77, volume: 'Electrical market', note: 'OEM and panel industry' }
  ],
  aluminum: [
    { city: 'Ahmedabad', state: 'Gujarat', score: 94, volume: 'High extrusion supply', note: 'Extrusion/profile ecosystem' },
    { city: 'Mumbai', state: 'Maharashtra', score: 88, volume: 'Trader/import supply', note: 'Sheet/coil distribution' },
    { city: 'Pune', state: 'Maharashtra', score: 84, volume: 'Auto and fabrication demand', note: 'Industrial cluster' },
    { city: 'Bengaluru', state: 'Karnataka', score: 80, volume: 'Fabrication and OEM stock', note: 'South India buyer base' },
    { city: 'Chennai', state: 'Tamil Nadu', score: 78, volume: 'Automotive supply chain', note: 'Manufacturing demand' }
  ],
  brass: [
    { city: 'Jamnagar', state: 'Gujarat', score: 98, volume: 'Highest brass component cluster', note: 'Brass rod/component/scrap ecosystem' },
    { city: 'Rajkot', state: 'Gujarat', score: 84, volume: 'Machining and foundry demand', note: 'Engineering buyer cluster' },
    { city: 'Mumbai', state: 'Maharashtra', score: 78, volume: 'Non-ferrous trading', note: 'Dealer liquidity' },
    { city: 'Delhi NCR', state: 'Delhi', score: 73, volume: 'Hardware market', note: 'Fittings and components' },
    { city: 'Pune', state: 'Maharashtra', score: 68, volume: 'Industrial buyers', note: 'Machined component demand' }
  ]
};

const fallbackDemand: Record<string, ProductIntelPoint[]> = {
  steel: [
    { city: 'Pune', state: 'Maharashtra', score: 94, volume: 'High construction + engineering demand', note: 'Auto, fabrication and project buyers' },
    { city: 'Mumbai', state: 'Maharashtra', score: 92, volume: 'High construction and trading demand', note: 'Large buyer liquidity' },
    { city: 'Bengaluru', state: 'Karnataka', score: 87, volume: 'Infrastructure and fabrication demand', note: 'Project-driven consumption' },
    { city: 'Hyderabad', state: 'Telangana', score: 84, volume: 'Construction demand', note: 'Real estate and infrastructure' },
    { city: 'Ahmedabad', state: 'Gujarat', score: 82, volume: 'Industrial fabrication demand', note: 'Manufacturer and dealer demand' },
    { city: 'Indore', state: 'Madhya Pradesh', score: 78, volume: 'Regional buyer activity', note: 'Central India projects' },
    { city: 'Chennai', state: 'Tamil Nadu', score: 76, volume: 'Manufacturing demand', note: 'Auto and industrial users' },
    { city: 'Nashik', state: 'Maharashtra', score: 72, volume: 'Factory/fabrication demand', note: 'Industrial belt' },
    { city: 'Surat', state: 'Gujarat', score: 70, volume: 'Fabrication and industry demand', note: 'Regional trade' },
    { city: 'Nagpur', state: 'Maharashtra', score: 68, volume: 'Project and distribution demand', note: 'Route hub' }
  ],
  copper: [
    { city: 'Delhi NCR', state: 'Delhi', score: 92, volume: 'Panel and electrical demand', note: 'Switchgear/electrical market' },
    { city: 'Mumbai', state: 'Maharashtra', score: 88, volume: 'Trading and industrial demand', note: 'Non-ferrous buyer liquidity' },
    { city: 'Pune', state: 'Maharashtra', score: 84, volume: 'Auto/electrical demand', note: 'Industrial OEM users' },
    { city: 'Bengaluru', state: 'Karnataka', score: 79, volume: 'Electronics and panel demand', note: 'OEM cluster' },
    { city: 'Ahmedabad', state: 'Gujarat', score: 76, volume: 'Electrical industry demand', note: 'Cable/panel users' }
  ],
  aluminum: [
    { city: 'Pune', state: 'Maharashtra', score: 90, volume: 'Auto, solar and fabrication demand', note: 'Industrial buyer cluster' },
    { city: 'Bengaluru', state: 'Karnataka', score: 84, volume: 'Fabrication/OEM demand', note: 'Machine and profile users' },
    { city: 'Ahmedabad', state: 'Gujarat', score: 82, volume: 'Façade and extrusion demand', note: 'Strong section market' },
    { city: 'Chennai', state: 'Tamil Nadu', score: 78, volume: 'Auto and manufacturing demand', note: 'Industrial belt' },
    { city: 'Mumbai', state: 'Maharashtra', score: 75, volume: 'Dealer and project demand', note: 'Trading hub' }
  ],
  brass: [
    { city: 'Jamnagar', state: 'Gujarat', score: 96, volume: 'Brass component manufacturing demand', note: 'Largest brass ecosystem' },
    { city: 'Rajkot', state: 'Gujarat', score: 82, volume: 'Machining demand', note: 'Engineering buyers' },
    { city: 'Delhi NCR', state: 'Delhi', score: 76, volume: 'Hardware/fittings demand', note: 'Distributor market' },
    { city: 'Mumbai', state: 'Maharashtra', score: 72, volume: 'Dealer demand', note: 'Non-ferrous trade' },
    { city: 'Pune', state: 'Maharashtra', score: 68, volume: 'Component demand', note: 'Industrial buyers' }
  ]
};

const normalise = (value: any) => String(value || '').toLowerCase().trim();
const monthLabel = () => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date());
const dataPath = (file: string) => path.join(process.cwd(), 'data', file);
const readJson = (file: string): JsonRecord[] => {
  try {
    const raw = fs.readFileSync(dataPath(file), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function productMatches(row: JsonRecord, product: string, metal: string) {
  const q = normalise(product);
  const m = normalise(metal);
  const hay = `${row.title || ''} ${row.product || ''} ${row.grade || ''} ${row.metal || ''} ${row.technicalSummary || ''}`.toLowerCase();
  const productTokens = q.split(/[^a-z0-9]+/).filter(t => t.length > 2);
  const hitCount = productTokens.filter(t => hay.includes(t)).length;
  return hitCount >= Math.min(2, productTokens.length || 1) || (!!m && normalise(row.metal).includes(m));
}

function aggregate(rows: JsonRecord[], product: string, metal: string, type: 'SELL' | 'BUY') {
  const map = new Map<string, { city: string; state: string; score: number; qty: number }>();
  rows.filter(r => normalise(r.type) === normalise(type) && productMatches(r, product, metal)).forEach((row, idx) => {
    const city = String(row.city || row.locationCity || row.deliveryCity || row.area || 'Regional market').trim();
    const state = String(row.state || row.locationState || row.deliveryState || 'India').trim();
    const key = `${city}|${state}`;
    const qty = Number(String(row.quantity || row.qty || '1').replace(/[^0-9.]/g, '')) || 1;
    const current = map.get(key) || { city, state, score: 50, qty: 0 };
    current.qty += qty;
    current.score += 12 + Math.min(20, qty) + (idx % 8);
    map.set(key, current);
  });
  return [...map.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x, i) => ({ city: x.city, state: x.state, score: Math.min(99, Math.round(x.score)), volume: i < 3 ? 'High marketplace signal' : 'Active regional signal', note: type === 'SELL' ? 'Supplier / trader listings and stock signals' : 'Buyer requirements and enquiry signals' }));
}

function extendTop10(base: ProductIntelPoint[], metal: string, kind: 'supplier' | 'demand') {
  const generic = kind === 'supplier' ? fallbackSupplier.steel : fallbackDemand.steel;
  const source = base.length ? base : (kind === 'supplier' ? fallbackSupplier[normalise(metal)] : fallbackDemand[normalise(metal)]) || generic;
  const merged = [...source, ...generic].filter(Boolean);
  const seen = new Set<string>();
  return merged.filter(x => {
    const k = `${x.city}|${x.state}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 10);
}

export function getProductIntelligence(product: string, metal: string): ProductIntelResponse {
  const rows = [...readJson('marketplace-listings.json'), ...readJson('public-requirements.json')];
  const supplierLive = aggregate(rows, product, metal, 'SELL');
  const demandLive = aggregate(rows, product, metal, 'BUY');
  return {
    product,
    metal,
    monthLabel: monthLabel(),
    updatedAt: new Date().toISOString(),
    supplierRegions: extendTop10(supplierLive, metal, 'supplier'),
    demandRegions: extendTop10(demandLive, metal, 'demand'),
    source: supplierLive.length || demandLive.length ? 'marketplace-data' : 'fallback-market-model'
  };
}
