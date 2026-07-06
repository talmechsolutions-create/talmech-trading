'use client';

import { useEffect, useMemo, useState } from 'react';

type Role = 'buyer' | 'seller' | 'trader';
type Point = { city: string; state: string; score: number; volume: string; note: string };
type Intel = { product: string; metal: string; monthLabel: string; updatedAt: string; supplierRegions: Point[]; demandRegions: Point[]; source: string };

function readRole(): Role {
  if (typeof window === 'undefined') return 'buyer';
  const accountClass = localStorage.getItem('talmech-account-class');
  const marketView = localStorage.getItem('talmech-market-view');
  const role = localStorage.getItem('talmech-role');
  if (accountClass === 'trader' || role === 'trader') return 'trader';
  if (marketView === 'seller' || role === 'seller') return 'seller';
  return 'buyer';
}

function TrendTable({ title, subtitle, rows, tone }: { title: string; subtitle: string; rows: Point[]; tone: 'supply' | 'demand' }) {
  return (
    <article className={`productIntelCard ${tone}`}>
      <div className="productIntelCardHead">
        <span>{tone === 'supply' ? 'Supply map' : 'Demand map'}</span>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="productIntelList">
        {rows.slice(0, 10).map((row, index) => (
          <div className="productIntelRow" key={`${row.city}-${row.state}-${index}`}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <div>
              <strong>{row.city}</strong>
              <small>{row.state} • {row.volume}</small>
              <em>{row.note}</em>
            </div>
            <span>{row.score}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function ProductMarketIntelligence({ product, metal }: { product: string; metal: string }) {
  const [role, setRole] = useState<Role>('buyer');
  const [intel, setIntel] = useState<Intel | null>(null);

  useEffect(() => {
    const sync = () => setRole(readRole());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('talmech-role-change', sync as EventListener);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('talmech-role-change', sync as EventListener);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/product-intelligence?product=${encodeURIComponent(product)}&metal=${encodeURIComponent(metal)}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => { if (active) setIntel(data); })
      .catch(() => { if (active) setIntel(null); });
    return () => { active = false; };
  }, [product, metal]);

  const roleCopy = useMemo(() => {
    if (role === 'seller') return { label: 'Seller view', title: `Where buyers are active for ${product}`, body: 'Use this to plan outreach, pricing, dispatch location and region-wise demand follow-up.' };
    if (role === 'trader') return { label: 'Trader view', title: `${product} arbitrage map: supply and demand`, body: 'Compare supplier belts with demand cities to identify margin, logistics and lead-routing opportunities.' };
    return { label: 'Buyer view', title: `Where suppliers are active for ${product}`, body: 'Use this to identify nearby sourcing belts before posting a requirement or locking a price.' };
  }, [role, product]);

  const supplier = intel?.supplierRegions || [];
  const demand = intel?.demandRegions || [];
  const showSupply = role === 'buyer' || role === 'trader';
  const showDemand = role === 'seller' || role === 'trader';

  return (
    <section className="productIntelSection">
      <div className="container">
        <div className="productIntelHero">
          <div>
            <span className="eyebrow">Monthly marketplace intelligence</span>
            <h2>{roleCopy.title}</h2>
            <p>{roleCopy.body}</p>
          </div>
          <div className="productIntelMeta">
            <b>{roleCopy.label}</b>
            <span>{intel?.monthLabel || 'Current month'}</span>
            <small>{intel?.source === 'marketplace-data' ? 'Based on live marketplace listings and requirements' : 'Market model until enough live activity is available'}</small>
          </div>
        </div>
        <div className={`productIntelGrid ${role === 'trader' ? 'two' : 'one'}`}>
          {showSupply && <TrendTable title="Top 10 supplier / sourcing regions" subtitle="Useful for buyer sourcing and landed-cost comparison." rows={supplier} tone="supply" />}
          {showDemand && <TrendTable title="Top 10 buyer / demand regions" subtitle="Useful for seller outreach and stock movement planning." rows={demand} tone="demand" />}
        </div>
      </div>
    </section>
  );
}
