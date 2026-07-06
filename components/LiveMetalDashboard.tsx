"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { metals, formatINR } from '@/lib/data';

type Price = {
  slug: string;
  price: number;
  change: string;
  changePercent: number;
  source: string;
  updatedAt?: string;
  sourceUpdatedAt?: string;
  status: 'LIVE' | 'FALLBACK_ESTIMATE' | 'MANUAL_QUOTE_REQUIRED';
  confidence: 'high' | 'medium' | 'low';
  note: string;
  warning?: string;
};

type Feed = {
  prices: Price[];
  source: string;
  requestedAt: string;
  serverUpdatedAt: string;
  nextRefreshAt: string;
  refreshSeconds: number;
};

function fmtTime(value?: string) {
  if (!value) return 'Not available';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusClass(status?: string) {
  if (status === 'LIVE') return 'liveDot';
  if (status === 'MANUAL_QUOTE_REQUIRED') return 'manualDot';
  return 'fallbackDot';
}

function statusLabel(status?: string) {
  if (status === 'LIVE') return 'LIVE';
  if (status === 'MANUAL_QUOTE_REQUIRED') return 'MANUAL QUOTE';
  return 'FALLBACK ESTIMATE';
}

export default function LiveMetalDashboard() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [status, setStatus] = useState('Loading live market feed...');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/live-prices', { cache: 'no-store' });
      const data = await res.json();
      setFeed(data);
      setStatus(data.source || 'Live feed loaded');
    } catch {
      setStatus('Unable to load live API feed. Showing saved fallback quotes.');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 300000);
    return () => clearInterval(id);
  }, []);

  const prices = feed?.prices || [];
  const merged = metals.map((metal) => ({
    ...metal,
    ...(prices.find((price) => price.slug === metal.slug) || {}),
  }));
  const regions = ['All', ...Array.from(new Set(metals.map((metal) => metal.state)))];
  const filtered = merged.filter(
    (metal) =>
      (region === 'All' || metal.state === region) &&
      `${metal.name} ${metal.city} ${metal.grade}`.toLowerCase().includes(query.toLowerCase())
  );
  const liveCount = merged.filter((metal) => (metal as Price).status === 'LIVE').length;
  const quoteCount = merged.length - liveCount;

  return (
    <>
      <div className="liveStrip">
        <div>
          <div className="row" style={{ justifyContent: 'flex-start' }}>
            <b>{liveCount} API-live prices</b>
            <span className="badge">{quoteCount} fallback/manual prices</span>
            {refreshing && <span className="badge">Refreshing...</span>}
          </div>
          <p>{status}</p>
          <p>
            <b>Dashboard checked:</b> {fmtTime(feed?.serverUpdatedAt)} &nbsp; | &nbsp;
            <b>Next auto-refresh:</b> {fmtTime(feed?.nextRefreshAt)}
          </p>
          <p className="muted">
            LIVE means provider-backed base price. FALLBACK ESTIMATE and MANUAL QUOTE REQUIRED
            still need supplier/admin confirmation before trading.
          </p>
        </div>
        <div className="filters">
          <input
            className="input"
            placeholder="Search metal, city, grade"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            {regions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button className="btn secondary" onClick={load}>Refresh now</button>
        </div>
      </div>

      <section className="grid cards4" style={{ marginTop: 24 }}>
        {filtered.map((metal) => {
          const rate = metal as typeof metal & Price;
          const change = Number(rate.changePercent ?? metal.change ?? 0);

          return (
            <Link className="card priceCard" href={`/metals/${metal.slug}`} key={metal.slug}>
              <div className="row">
                <span className="badge">{metal.city}, {metal.state}</span>
                <span className={statusClass(rate.status)}>{statusLabel(rate.status)}</span>
              </div>
              <h2>{metal.name}</h2>
              <p className="price">{formatINR(Number(metal.price))}/{metal.unit}</p>
              <p className={change >= 0 ? 'up' : 'down'}>{change > 0 ? '+' : ''}{change}% today</p>
              <small className="muted">Source: {rate.source}</small>
              <small className="muted"><b>Source time:</b> {fmtTime(rate.sourceUpdatedAt || rate.updatedAt)}</small>
              <small className="muted"><b>Confidence:</b> {rate.confidence || 'medium'} - {rate.note || ''}</small>
              {rate.warning && <small className="muted"><b>Warning:</b> {rate.warning}</small>}
              <div className="spark" />
            </Link>
          );
        })}
      </section>
    </>
  );
}
