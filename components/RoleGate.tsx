'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Role = 'buyer' | 'seller';

export default function RoleGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem('talmech-role'));
    } catch {}
  }, []);

  function choose(role: Role) {
    try {
      localStorage.setItem('talmech-role', role);
      localStorage.setItem('talmech-market-view', role);
      localStorage.setItem('talmech-role-locked', 'true');
      window.dispatchEvent(new Event('talmech-role-change'));
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="roleGateBackdrop">
      <div className="roleGateCard">
        <span className="eyebrow">Choose your primary marketplace role</span>
        <h2>Are you here mainly to buy, sell or trade?</h2>
        <p className="muted">Buyer and seller views are selected for cleaner marketplace routing. Traders can register separately for admin-approved dual access.</p>
        <div className="roleChoiceGrid">
          <button onClick={() => choose('buyer')} className="roleChoice"><span>🛒</span><b>I am a Buyer</b><small>Find verified stock, suppliers, scrap and local metal products.</small></button>
          <button onClick={() => choose('seller')} className="roleChoice"><span>🏭</span><b>I am a Seller / Supplier</b><small>Find buyer requirements and list stock or manufacturing capability.</small></button>
        </div>
        <div className="card noShadow traderChoiceCard" style={{ marginTop: 16 }}>
          <b>Trader account</b>
          <p className="muted">Apply for special trader approval to switch between buyer and seller views after admin verification.</p>
          <Link className="btn" href="/signin" onClick={() => { try { localStorage.setItem('talmech-preferred-account-type', 'trader'); } catch {} setShow(false); }}>Register as trader</Link>
        </div>
      </div>
    </div>
  );
}
