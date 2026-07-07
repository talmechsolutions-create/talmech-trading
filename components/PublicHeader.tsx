'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const publicNav = [
  ['Home', '/'],
  ['Marketplace', '/public-marketplace'],
  ['Post Requirement', '/post-requirement'],
  ['Sell on Talmech', '/sell'],
  ['WhatsApp Upload', '/whatsapp-upload'],
  ['Metals', '/metals'],
  ['Products', '/metal-products'],
  ['Logistics', '/logistics'],
  ['Contact', '/contact'],
];

type MarketRole = 'buyer' | 'seller';

export default function PublicHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState('');
  const [accountClass, setAccountClass] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        const u = JSON.parse(localStorage.getItem('talmech-user') || 'null');
        setUser(u);
        setRole(localStorage.getItem('talmech-role') || '');
        setAccountClass(localStorage.getItem('talmech-account-class') || (String(u?.accountType || u?.role || '').toLowerCase().includes('trader') ? 'trader' : ''));
      } catch {
        setUser(null);
        setRole('');
        setAccountClass('');
      }
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('talmech-role-change', sync as EventListener);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('talmech-role-change', sync as EventListener);
    };
  }, []);

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  const isTrader = accountClass === 'trader' || String(user?.accountType || user?.role || '').toLowerCase().includes('trader');
  const status = user?.status === 'APPROVED' || user?.verified ? 'Verified' : user ? 'Review' : '';

  function switchTraderMode(next: MarketRole) {
    localStorage.setItem('talmech-role', next);
    localStorage.setItem('talmech-market-view', next);
    localStorage.setItem('talmech-role-locked', 'false');
    window.dispatchEvent(new Event('talmech-role-change'));
    setRole(next);
  }

  function signOut() {
    ['talmech-user', 'talmech-account-class', 'talmech-role', 'talmech-market-view', 'talmech-role-locked', 'talmech-trader-approved', 'talmech-preferred-account-type'].forEach((key) => localStorage.removeItem(key));
    fetch('/api/auth/client-logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setRole('');
    setAccountClass('');
    setProfileOpen(false);
    window.dispatchEvent(new Event('talmech-role-change'));
  }

  const profileLabel = isTrader ? 'Trader' : role === 'seller' ? 'Seller' : role === 'buyer' ? 'Buyer' : 'Account';
  const displayName = user?.firmName || user?.company || user?.ownerName || user?.name || profileLabel;

  return (
    <header className="tmHeader">
      <div className="container">
        <div className="tmHeaderShell">
          <Link href="/" className="tmBrand" onClick={() => setMenuOpen(false)}>
            <span className="tmBrandIcon">T</span>
            <span className="tmBrandCopy"><strong>Talmech Trading</strong><small>Metal sourcing • selling • logistics</small></span>
          </Link>

          <button type="button" className={`tmMenuButton ${menuOpen ? 'active' : ''}`} aria-label="Toggle navigation menu" onClick={() => setMenuOpen((v) => !v)}><i /><i /><i /></button>

          <nav className={`tmNav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
            <div className="tmNavLinks">
              {publicNav.map(([label, href]) => <Link key={href} href={href} className={isActive(href) ? 'active' : ''} onClick={() => setMenuOpen(false)}>{label}</Link>)}
            </div>

            <div className="tmHeaderRight">
              {isTrader && status === 'Verified' ? (
                <div className="tmTraderSwitch" aria-label="Trader marketplace mode switch">
                  <button type="button" className={role === 'buyer' ? 'active' : ''} onClick={() => switchTraderMode('buyer')}>Buyer</button>
                  <button type="button" className={role === 'seller' ? 'active' : ''} onClick={() => switchTraderMode('seller')}>Seller</button>
                </div>
              ) : role ? <span className="tmModeChip">{role === 'seller' ? 'Seller mode' : 'Buyer mode'}</span> : null}

              {user ? (
                <div className="tmProfileMenu">
                  <button type="button" className="tmUserPill" onClick={() => setProfileOpen((open) => !open)}>
                    <span className="tmAvatar">{displayName.slice(0, 1).toUpperCase()}</span>
                    <span className="tmUserText"><b>{displayName}</b>{status && <small>{status} / {profileLabel}</small>}</span>
                  </button>
                  {profileOpen && (
                    <div className="tmProfileDropdown">
                      <Link href="/account" onClick={() => { setMenuOpen(false); setProfileOpen(false); }}>Dashboard</Link>
                      <Link href="/account/profile" onClick={() => { setMenuOpen(false); setProfileOpen(false); }}>Profile</Link>
                      <Link href="/account/listings" onClick={() => { setMenuOpen(false); setProfileOpen(false); }}>My Listings</Link>
                      <Link href="/account/requirements" onClick={() => { setMenuOpen(false); setProfileOpen(false); }}>Requirements</Link>
                      <Link href="/account/help" onClick={() => { setMenuOpen(false); setProfileOpen(false); }}>Help</Link>
                      <button type="button" onClick={signOut}>Sign out</button>
                    </div>
                  )}
                </div>
              ) : <Link href="/signin" className="tmSignin" onClick={() => setMenuOpen(false)}>Sign in</Link>}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
