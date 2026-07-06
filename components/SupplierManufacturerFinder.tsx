'use client';

import {useMemo, useState} from 'react';
import {allIndiaStates, indiaStates} from '@/lib/indiaLocations';
import {metalsForSupplierSearch, supplierSegments, SupplierSegment} from '@/lib/supplierKnowledge';

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

type ApiResponse = {
  results: SupplierResult[];
  queries: string[];
  mode: 'live' | 'fallback';
  checkedAt: string;
  message: string;
};

function digits(phone?: string) {
  return (phone || '').replace(/[^0-9]/g, '');
}

function supplierLeadFromResult(result: SupplierResult, segment: SupplierSegment, metal: string, state: string, city: string) {
  return {
    id: crypto.randomUUID(),
    type: 'Manufacturer / Supplier',
    company: result.name,
    contact: 'Owner / Sales / Dispatch',
    phone: digits(result.phone),
    email: '',
    city,
    state,
    metal,
    qty: 'To qualify',
    frequency: 'To qualify',
    stage: 'New',
    nextAction: 'Call supplier, verify grade, stock, price, GST and dispatch timeline',
    value: 0,
    notes: `Imported from supplier finder. Segment: ${segment.name}. Address: ${result.address}. Source: ${result.source}. Query: ${result.query}`
  };
}

function exportCsv(rows: SupplierResult[]) {
  const header = ['name','address','phone','website','rating','reviews','source','query'];
  const csv = [header.join(','), ...rows.map(row => header.map(key => `"${String((row as any)[key] || '').replaceAll('"','""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `talmech-supplier-search-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SupplierManufacturerFinder() {
  const [metal, setMetal] = useState('Steel');
  const availableSegments = useMemo(() => supplierSegments.filter(segment => segment.metals.includes(metal)), [metal]);
  const [segmentName, setSegmentName] = useState('Steel stockists and service centers');
  const segment = useMemo(() => availableSegments.find(s => s.name === segmentName) || availableSegments[0] || supplierSegments[0], [availableSegments, segmentName]);
  const [state, setState] = useState('Maharashtra');
  const cities = indiaStates[state] || ['Pune'];
  const [city, setCity] = useState('Pune');
  const [customLocation, setCustomLocation] = useState('');
  const [radiusMode, setRadiusMode] = useState('city');
  const [includeAllIndia, setIncludeAllIndia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [message, setMessage] = useState('');

  function changeMetal(value: string) {
    setMetal(value);
    const firstSegment = supplierSegments.find(segment => segment.metals.includes(value));
    if (firstSegment) setSegmentName(firstSegment.name);
  }

  function changeState(value: string) {
    setState(value);
    const firstCity = indiaStates[value]?.[0] || '';
    setCity(firstCity);
  }

  async function runSearch() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/supplier-search', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({metal, segment: segment.name, state, city, customLocation, radiusMode, includeAllIndia})
      });
      const json = await response.json();
      setData(json);
      setMessage(json.message || 'Search complete.');
    } catch {
      setMessage('Supplier search failed. Check API key and internet connection.');
    } finally {
      setLoading(false);
    }
  }

  function addToCrm(result: SupplierResult) {
    const saved = localStorage.getItem('talmech_trading_crm');
    let rows: any[] = [];
    try { rows = saved ? JSON.parse(saved) : []; } catch {}
    const lead = supplierLeadFromResult(result, segment, metal, state, city);
    localStorage.setItem('talmech_trading_crm', JSON.stringify([lead, ...rows]));
    setMessage(`${result.name} added to Trading CRM as Manufacturer / Supplier.`);
  }

  const locationText = includeAllIndia ? 'India' : customLocation || `${city}, ${state}`;
  const manualSearches = [
    `${segment.searchTerms[0] || metal + ' supplier'} in ${locationText}`,
    `${metal} manufacturer supplier stockist in ${locationText}`,
    `${metal} dealer GST supplier in ${locationText}`,
    `${metal} scrap supplier recycler in ${locationText}`
  ];
  const pitch = `Hello, I am from Talmech Trading. We are building verified regional demand and supply for ${metal}. If you supply ${segment.products.slice(0,3).join(', ')}, please share your stock list, grade, MOQ, ex-works price, GST details and dispatch city. We will bring buyer requirements and coordinate logistics on a commission basis.`;

  return <main className="container section">
    <span className="eyebrow">Supplier sourcing command center</span>
    <h1 className="pageTitle">Find manufacturers, stockists, dealers and scrap suppliers</h1>
    <p className="lead">Search source-side suppliers across India by metal, product segment, state, city, MIDC/GIDC/industrial area or all-India. Convert verified suppliers directly into your Trading CRM.</p>

    <section className="grid cards3" style={{marginTop:24}}>
      <div className="card"><b>1. Search source</b><p className="muted">Find mills, stockists, dealers, importers, foundries and scrap yards by location.</p></div>
      <div className="card"><b>2. Qualify stock</b><p className="muted">Check grade, quantity, test certificate, GST, price validity, loading and dispatch timeline.</p></div>
      <div className="card"><b>3. Add to CRM</b><p className="muted">Store verified supplier leads and match them with buyer demand + logistics.</p></div>
    </section>

    <section className="panel" style={{marginTop:24}}>
      <div className="finderGrid">
        <label>Metal
          <select value={metal} onChange={event => changeMetal(event.target.value)}>{metalsForSupplierSearch.map(item => <option key={item}>{item}</option>)}</select>
        </label>
        <label>Supplier segment
          <select value={segment.name} onChange={event => setSegmentName(event.target.value)}>{availableSegments.map(item => <option key={item.name}>{item.name}</option>)}</select>
        </label>
        <label>State / region
          <select value={state} onChange={event => changeState(event.target.value)} disabled={includeAllIndia}>{allIndiaStates.filter(x => x !== 'All India').map(item => <option key={item}>{item}</option>)}</select>
        </label>
        <button className="btn finderBtn" onClick={runSearch} disabled={loading}>{loading ? 'Searching...' : 'Find suppliers'}</button>
      </div>

      <div className="finderGrid" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr', marginTop:14}}>
        <label>City / industrial city
          <select value={city} onChange={event => setCity(event.target.value)} disabled={includeAllIndia}>{cities.map(item => <option key={item}>{item}</option>)}</select>
        </label>
        <label>Custom location / MIDC / GIDC
          <input className="input" value={customLocation} onChange={event => setCustomLocation(event.target.value)} placeholder="Example: Bhosari MIDC, Pune" disabled={includeAllIndia}/>
        </label>
        <label>Search radius type
          <select value={radiusMode} onChange={event => setRadiusMode(event.target.value)}>
            <option value="city">City search</option>
            <option value="industrial-area">Industrial-area focused</option>
            <option value="state">State-wide keyword search</option>
          </select>
        </label>
        <label style={{display:'flex', alignItems:'center', gap:10, marginTop:26}}>
          <input type="checkbox" checked={includeAllIndia} onChange={event => setIncludeAllIndia(event.target.checked)} /> All India search
        </label>
      </div>
    </section>

    <section className="grid cards3" style={{marginTop:24}}>
      <div className="card"><h2>Products to source</h2>{segment.products.map(item => <p key={item}>• {item}</p>)}</div>
      <div className="card"><h2>Qualification checklist</h2>{segment.qualification.map(item => <p key={item}>✅ {item}</p>)}</div>
      <div className="card"><h2>Supplier pitch</h2><p className="muted">{pitch}</p><button className="btn secondary" onClick={() => navigator.clipboard.writeText(pitch)}>Copy pitch</button></div>
    </section>

    <section className="panel" style={{marginTop:24}}>
      <div className="row"><div><h2>Manual free search links</h2><p className="muted">Use these when SerpApi credits are low. Open, verify, then add good suppliers manually to CRM.</p></div></div>
      <div className="grid cards4" style={{marginTop:14}}>{manualSearches.map(query => <a className="card" key={query} target="_blank" href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}><b>{query}</b><p className="muted">Open Google search →</p></a>)}</div>
    </section>

    {message && <p className="warn">{message}</p>}
    {data && <section className="section">
      <div className="row"><div><h2>Supplier results</h2><p className="muted">Checked: {new Date(data.checkedAt).toLocaleString()} · Mode: {data.mode}</p></div><button className="btn secondary" onClick={() => exportCsv(data.results)}>Export CSV</button></div>
      <div className="grid cards2" style={{marginTop:18}}>{data.results.map((result, index) => <div className="supplierCard" key={`${result.name}-${index}`}>
        <div className="row"><b>{result.name}</b><span className={result.confidence === 'Live internet result' ? 'liveDot' : 'manualDot'}>{result.confidence}</span></div>
        <p className="muted">{result.address}</p>
        {result.type && <p>Type: {result.type}</p>}
        {result.rating && <p>Rating: {result.rating} {result.reviews ? `(${result.reviews} reviews)` : ''}</p>}
        {result.phone && <p>Phone: {result.phone}</p>}
        <p className="muted">Query: {result.query}</p>
        <div className="row" style={{marginTop:12, justifyContent:'flex-start'}}>
          <button className="btn" onClick={() => addToCrm(result)}>Add supplier to CRM</button>
          {result.phone && <a className="btn secondary" href={`tel:${digits(result.phone)}`}>Call</a>}
          {result.phone && <a className="btn secondary" target="_blank" href={`https://wa.me/${digits(result.phone)}?text=${encodeURIComponent(pitch)}`}>WhatsApp</a>}
          {result.website && <a className="btn secondary" target="_blank" href={result.website}>Website</a>}
          {result.mapsUrl && <a className="btn secondary" target="_blank" href={result.mapsUrl}>Map</a>}
        </div>
      </div>)}</div>
      <div className="panel" style={{marginTop:20}}><b>Queries used</b>{data.queries.map(query => <p className="muted" key={query}>• {query}</p>)}</div>
    </section>}
  </main>;
}
