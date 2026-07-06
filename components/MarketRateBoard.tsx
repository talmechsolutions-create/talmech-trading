'use client';

import { useEffect, useMemo, useState } from 'react';
import ContextualHelpBox from '@/components/help/ContextualHelpBox';
import { indiaLocations, getCitiesForState } from '@/lib/indiaLocations';

const localFactors: Record<string, number> = {
  Maharashtra: 1.015,
  Gujarat: 1.01,
  Delhi: 1.02,
  Karnataka: 1.018,
  'Tamil Nadu': 1.016,
  Chhattisgarh: 0.995,
  Odisha: 0.99,
  Punjab: 1.006,
};

const fallbackPrices = [
  { metal: 'Steel', price: 62500, unit: 'MT', status: 'MANUAL_QUOTE_REQUIRED', source: 'regional supplier/manual quote' },
  { metal: 'Copper', price: 850000, unit: 'MT', status: 'FALLBACK_ESTIMATE', source: 'API/manual blended estimate' },
  { metal: 'Aluminum', price: 240000, unit: 'MT', status: 'FALLBACK_ESTIMATE', source: 'API/manual blended estimate' },
  { metal: 'Brass', price: 510000, unit: 'MT', status: 'MANUAL_QUOTE_REQUIRED', source: 'supplier quote required' },
  { metal: 'Zinc', price: 265000, unit: 'MT', status: 'FALLBACK_ESTIMATE', source: 'regional premium estimate' },
  { metal: 'Nickel', price: 1580000, unit: 'MT', status: 'FALLBACK_ESTIMATE', source: 'API/manual blended estimate' },
  { metal: 'Lead', price: 185000, unit: 'MT', status: 'FALLBACK_ESTIMATE', source: 'regional premium estimate' },
  { metal: 'Iron', price: 48000, unit: 'MT', status: 'MANUAL_QUOTE_REQUIRED', source: 'regional supplier quote' },
  { metal: 'Gold', price: 7200000, unit: '10G', status: 'FALLBACK_ESTIMATE', source: 'precious metal feed' },
  { metal: 'Silver', price: 92000, unit: 'KG', status: 'FALLBACK_ESTIMATE', source: 'precious metal feed' },
];

function statusLabel(status?: string) {
  if (status === 'LIVE') return 'LIVE';
  if (status === 'MANUAL_QUOTE_REQUIRED') return 'MANUAL QUOTE';
  return 'FALLBACK ESTIMATE';
}

export default function MarketRateBoard() {
  const [data, setData] = useState<any>({ prices: fallbackPrices, checkedAt: null });
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');
  const [checkedText, setCheckedText] = useState('Checking...');
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await fetch('/api/live-prices', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const next = await res.json();
      setData({
        prices: Array.isArray(next?.prices) && next.prices.length ? next.prices : fallbackPrices,
        checkedAt: next?.checkedAt || new Date().toISOString(),
      });
      const raw = next?.checkedAt ? new Date(next.checkedAt) : new Date();
      setCheckedText(raw.toLocaleString('en-IN'));
    } catch {
      setData((old: any) => ({
        prices: old?.prices?.length ? old.prices : fallbackPrices,
        checkedAt: new Date().toISOString(),
      }));
      setCheckedText(new Date().toLocaleString('en-IN'));
      setError('Live API temporarily unavailable. Showing fallback/regional estimates until refresh succeeds.');
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 300000);
    return () => clearInterval(timer);
  }, []);

  const rows = useMemo(
    () =>
      (data?.prices || fallbackPrices).map((price: any) => {
        const factor = localFactors[state] || 1;
        return { ...price, localPrice: Math.round(Number(price.price || 0) * factor), factor };
      }),
    [data, state]
  );

  return (
    <div className="rateBoard card">
      <div className="rateTop">
        <div>
          <span className="eyebrow">Live market rate board</span>
          <h2>Base metal prices with local location estimate.</h2>
          <p className="muted">
            API-backed metals show LIVE only when provider data is available. Fallback and manual
            quote rows still require supplier confirmation before order closure.
          </p>
          {error && <p className="notice slimNotice">{error}</p>}
        </div>
        <div className="row">
          <a className="btn secondary" href="/whatsapp-upload">Need help uploading?</a>
          <button className="btn secondary" onClick={load}>Refresh rates</button>
        </div>
      </div>
      <ContextualHelpBox type="rates" label="Watch onboarding guide" />

      <div className="rateFilters">
        <label>
          State
          <select
            value={state}
            onChange={(event) => {
              setState(event.target.value);
              setCity(getCitiesForState(event.target.value)[0] || '');
            }}
          >
            {indiaLocations.map((item) => (
              <option key={item.state}>{item.state}</option>
            ))}
          </select>
        </label>
        <label>
          City / market
          <select value={city} onChange={(event) => setCity(event.target.value)}>
            {getCitiesForState(state).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="timeBox">
          <b>Last checked</b>
          <span suppressHydrationWarning>{checkedText}</span>
          <small>Auto-refresh every 5 minutes</small>
        </div>
      </div>

      <div className="rateGrid">
        {rows.map((price: any, index: number) => (
          <div className="rateMini" key={price.slug || price.metal}>
            <div className="row">
              <b>{price.metal}</b>
              <span className={`status ${String(price.status).toLowerCase()}`}>
                {statusLabel(price.status)}
              </span>
            </div>
            <p className="priceSmall">Rs. {Number(price.localPrice || 0).toLocaleString('en-IN')}/{price.unit}</p>
            <div className="miniBars">
              {[0.72, 0.82, 0.76, 0.9, 0.86, 1].map((height, barIndex) => (
                <span
                  key={barIndex}
                  style={{ height: `${Math.round(36 * height + (index % 3) * 4)}px` }}
                />
              ))}
            </div>
            <small>{city}, {state} estimate - {price.source}</small>
            {price.warning && <small>{price.warning}</small>}
          </div>
        ))}
      </div>
    </div>
  );
}
