'use client';

import { useEffect, useState } from 'react';

function label(status?: string) {
  if (status === 'LIVE') return 'LIVE';
  if (status === 'MANUAL_QUOTE_REQUIRED') return 'MANUAL QUOTE';
  return 'FALLBACK ESTIMATE';
}

export default function LivePriceTicker() {
  const [data, setData] = useState<any>(null);

  async function load() {
    const next = await fetch('/api/live-prices', { cache: 'no-store' }).then((res) => res.json());
    setData(next);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 300000);
    return () => clearInterval(timer);
  }, []);

  const prices = data?.prices || [];

  return (
    <div className="grid cards4">
      {prices.slice(0, 8).map((price: any) => (
        <div className="card" key={price.slug || price.metal}>
          <div className="row">
            <span className="badge">{label(price.status)}</span>
            <b>{price.change}</b>
          </div>
          <h3>{price.metal}</h3>
          <p className="price">Rs. {Number(price.price).toLocaleString('en-IN')}/{price.unit}</p>
          <p className="muted">Source: {price.source}</p>
          {price.warning && <p className="muted">Note: {price.warning}</p>}
          <p className="timestamp">
            Checked: {data?.checkedAt ? new Date(data.checkedAt).toLocaleString() : 'loading...'}
          </p>
        </div>
      ))}
    </div>
  );
}
