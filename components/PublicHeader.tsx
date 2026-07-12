'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type MarketRole = 'buyer' | 'seller';

type NavItem = {
  label: string;
  href: string;
  description?: string;
};

type NavColumn = {
  title: string;
  items: NavItem[];
};

type NavSection = {
  id: string;
  label: string;
  summary: string;
  columns: NavColumn[];
};

function createNavSections(helpHref: string): NavSection[] {
  return [
    {
      id: 'marketplace',
      label: 'Marketplace',
      summary: 'Find live metal listings, suppliers, requirements, and small-deal sourcing support.',
      columns: [
        {
          title: 'Trade Hub',
          items: [
            { label: 'Browse Marketplace', href: '/marketplace', description: 'Open the marketplace entry point.' },
            { label: 'Public Marketplace', href: '/public-marketplace', description: 'Search verified public listings.' },
            { label: 'Post Requirement', href: '/post-requirement', description: 'Share a buyer requirement with Talmech.' },
          ],
        },
        {
          title: 'Sourcing Tools',
          items: [
            { label: 'Small Deals', href: '/small-deals', description: 'Support for low-volume industrial buying.' },
            { label: 'Supplier Search', href: '/supplier-search', description: 'Find suppliers and local business options.' },
          ],
        },
      ],
    },
    {
      id: 'sell-buy',
      label: 'Sell / Buy',
      summary: 'Fast entry points for sellers, buyers, WhatsApp-led onboarding, and account access.',
      columns: [
        {
          title: 'Start Trading',
          items: [
            { label: 'Sell on Talmech', href: '/sell', description: 'List stock and receive qualified buyer interest.' },
            { label: 'Post Requirement', href: '/post-requirement', description: 'Tell Talmech what material you need.' },
            { label: 'WhatsApp Upload', href: '/whatsapp-upload', description: 'Send stock details for assisted listing.' },
          ],
        },
        {
          title: 'Account Access',
          items: [
            { label: 'Create Account / Sign In', href: '/signin', description: 'Access buyer, seller, and client tools.' },
            { label: 'Buyer Mode Action', href: '/post-requirement', description: 'Move directly into a buyer requirement flow.' },
          ],
        },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      summary: 'Industrial services around logistics, inspection, manpower, quality, and dispatch support.',
      columns: [
        {
          title: 'Core Services',
          items: [
            { label: 'Logistics', href: '/logistics', description: 'Transport and dispatch support for metal movement.' },
            { label: 'Manpower Services', href: '/manpower-services', description: 'Skilled people for industrial work sites.' },
            { label: 'Contact Talmech', href: '/contact', description: 'Discuss a service requirement with the team.' },
          ],
        },
        {
          title: 'Skilled Manpower',
          items: [
            { label: 'Skilled Industrial Manpower', href: '/manpower-services' },
            { label: 'NDT Support Manpower', href: '/manpower-services' },
            { label: 'Grinding & Finishing Manpower', href: '/manpower-services' },
            { label: 'Fabrication Support', href: '/manpower-services' },
          ],
        },
        {
          title: 'Inspection & Dispatch',
          items: [
            { label: 'Metal Inspection Support', href: '/manpower-services' },
            { label: 'Quality Inspection Support', href: '/manpower-services' },
            { label: 'Loading & Dispatch Supervision', href: '/manpower-services' },
            { label: 'WhatsApp Upload', href: '/whatsapp-upload' },
          ],
        },
      ],
    },
    {
      id: 'metals-products',
      label: 'Metals & Products',
      summary: 'Browse metal categories, product pages, RFQ surfaces, and TMIS planning intelligence.',
      columns: [
        {
          title: 'Core Metals',
          items: [
            { label: 'Steel', href: '/metals/steel' },
            { label: 'Copper', href: '/metals/copper' },
            { label: 'Aluminium', href: '/metals/aluminum' },
            { label: 'Stainless Steel', href: '/metals/stainless-steel' },
            { label: 'Brass', href: '/metals/brass' },
            { label: 'Scrap', href: '/scrap' },
          ],
        },
        {
          title: 'Products',
          items: [
            { label: 'Metal Products', href: '/metal-products' },
            { label: 'EN24 Round Bar', href: '/products/en24-round-bar' },
            { label: 'Marketplace EN24', href: '/marketplace/en24-round-bar' },
            { label: 'RFQ EN24 Round Bar', href: '/rfq/en24-round-bar' },
          ],
        },
        {
          title: 'Manufacturing Intelligence',
          items: [
            { label: 'TMIS', href: '/tmis' },
            { label: 'TMIS Metals', href: '/tmis/metals' },
            { label: 'Buyer Planning', href: '/tmis/planning/buyers' },
            { label: 'Seller Planning', href: '/tmis/planning/sellers' },
            { label: 'Opportunities', href: '/tmis/planning/opportunities' },
          ],
        },
      ],
    },
    {
      id: 'resources',
      label: 'Resources',
      summary: 'Guides, knowledge surfaces, strategy tools, and metal intelligence references.',
      columns: [
        {
          title: 'Guides',
          items: [
            { label: 'How It Works', href: '/how-it-works' },
            { label: 'Knowledge', href: '/knowledge' },
            { label: 'Strategy', href: '/strategy' },
          ],
        },
        {
          title: 'Intelligence',
          items: [
            { label: 'SEO Tracker', href: '/seo-tracker' },
            { label: 'Manufacturing Intelligence', href: '/manufacturing-intelligence' },
            { label: 'Contact', href: '/contact' },
          ],
        },
      ],
    },
    {
      id: 'about',
      label: 'About',
      summary: 'Reach Talmech, explore services, and get help with onboarding or account workflows.',
      columns: [
        {
          title: 'Talmech',
          items: [
            { label: 'About Talmech / Contact', href: '/contact' },
            { label: 'Logistics', href: '/logistics' },
            { label: 'Manpower Services', href: '/manpower-services' },
          ],
        },
        {
          title: 'Support',
          items: [
            { label: 'Support / Help', href: helpHref },
            { label: 'How It Works', href: '/how-it-works' },
          ],
        },
      ],
    },
  ];
}

function sectionItems(section: NavSection) {
  return section.columns.flatMap((column) => column.items);
}

export default function PublicHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState('');
  const [accountClass, setAccountClass] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>('marketplace');
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

  useEffect(() => {
    closeMenus();
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function closeMenus() {
    setMenuOpen(false);
    setOpenMenu(null);
    setProfileOpen(false);
  }

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  const isTrader = accountClass === 'trader' || String(user?.accountType || user?.role || '').toLowerCase().includes('trader');
  const status = user?.status === 'APPROVED' || user?.verified ? 'Verified' : user ? 'Review' : '';
  const navSections = createNavSections(user ? '/account/help' : '/how-it-works');
  const isAdminSurface = pathname.startsWith('/admin') || pathname.startsWith('/admin-');

  function sectionActive(section: NavSection) {
    return sectionItems(section).some((item) => isActive(item.href));
  }

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
    setMenuOpen(false);
    window.dispatchEvent(new Event('talmech-role-change'));
  }

  const profileLabel = isTrader ? 'Trader' : role === 'seller' ? 'Seller' : role === 'buyer' ? 'Buyer' : 'Account';
  const displayName = user?.firmName || user?.company || user?.ownerName || user?.name || profileLabel;

  return (
    <header className={`tmHeader tmMegaHeader ${isAdminSurface ? 'tmHeaderCompact' : ''}`}>
      <div className="container">
        <div className="tmHeaderShell">
          <Link href="/" className="tmBrand" onClick={closeMenus}>
            <span className="tmBrandIcon">T</span>
            <span className="tmBrandCopy"><strong>Talmech Trading</strong><small>Metal sourcing, selling and services</small></span>
          </Link>

          <button type="button" className={`tmMenuButton ${menuOpen ? 'active' : ''}`} aria-label="Toggle navigation menu" aria-expanded={menuOpen} aria-controls="talmech-mobile-menu" onClick={() => setMenuOpen((v) => !v)}><i /><i /><i /></button>

          <nav id="talmech-mobile-menu" className={`tmNav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
            <div className="tmDesktopNav">
              <div className="tmNavLinks" onMouseLeave={() => setOpenMenu(null)}>
                {navSections.map((section) => {
                  const active = sectionActive(section);
                  const expanded = openMenu === section.id;
                  return (
                    <div key={section.id} className={`tmMegaMenu ${expanded ? 'open' : ''}`} onMouseEnter={() => setOpenMenu(section.id)}>
                      <button
                        type="button"
                        id={`tm-mega-trigger-${section.id}`}
                        className={`tmMegaTrigger ${active ? 'active' : ''}`}
                        aria-expanded={expanded}
                        aria-controls={`tm-mega-panel-${section.id}`}
                        onClick={() => setOpenMenu(expanded ? null : section.id)}
                        onFocus={() => setOpenMenu(section.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setOpenMenu(section.id);
                          }
                        }}
                      >
                        {section.label}
                      </button>
                      <div id={`tm-mega-panel-${section.id}`} className={`tmMegaPanel tmMegaCols${section.columns.length}`} aria-labelledby={`tm-mega-trigger-${section.id}`}>
                        <div className="tmMegaIntro">
                          <b>{section.label}</b>
                          <p>{section.summary}</p>
                        </div>
                        <div className="tmMegaGrid">
                          {section.columns.map((column) => (
                            <div key={column.title} className="tmMegaColumn">
                              <span>{column.title}</span>
                              {column.items.map((item) => (
                                <Link key={`${column.title}-${item.label}-${item.href}`} href={item.href} className={isActive(item.href) ? 'active' : ''} onClick={closeMenus}>
                                  <b>{item.label}</b>
                                  {item.description && <small>{item.description}</small>}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="tmHeaderRight">
                <Link href="/public-marketplace" className="tmHeaderSearch" onClick={closeMenus}>Search</Link>

                {isTrader && status === 'Verified' ? (
                  <div className="tmTraderSwitch" aria-label="Trader marketplace mode switch">
                    <button type="button" className={role === 'buyer' ? 'active' : ''} onClick={() => switchTraderMode('buyer')}>Buyer</button>
                    <button type="button" className={role === 'seller' ? 'active' : ''} onClick={() => switchTraderMode('seller')}>Seller</button>
                  </div>
                ) : role ? <span className="tmModeChip">{role === 'seller' ? 'Seller mode' : 'Buyer mode'}</span> : null}

                {user ? (
                  <div className="tmProfileMenu">
                    <button type="button" className="tmUserPill" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
                      <span className="tmAvatar">{displayName.slice(0, 1).toUpperCase()}</span>
                      <span className="tmUserText"><b>{displayName}</b>{status && <small>{status} / {profileLabel}</small>}</span>
                    </button>
                    {profileOpen && (
                      <div className="tmProfileDropdown">
                        <Link href="/account" onClick={closeMenus}>Dashboard / Account</Link>
                        <Link href="/account/profile" onClick={closeMenus}>Profile</Link>
                        <Link href="/account/listings" onClick={closeMenus}>My Listings</Link>
                        <Link href="/account/requirements" onClick={closeMenus}>Requirements</Link>
                        <Link href="/account/help" onClick={closeMenus}>Help</Link>
                        <button type="button" onClick={signOut}>Sign out</button>
                      </div>
                    )}
                  </div>
                ) : <Link href="/signin" className="tmSignin" onClick={closeMenus}>Sign in</Link>}
              </div>
            </div>

            <div className="tmMobileNav">
              <Link href="/" className={`tmMobileHome ${isActive('/') ? 'active' : ''}`} onClick={closeMenus}>Home</Link>
              <Link href="/public-marketplace" className="tmMobileSearch" onClick={closeMenus}>Search marketplace</Link>

              {navSections.map((section) => {
                const expanded = openMobileSection === section.id;
                return (
                  <div key={section.id} className={`tmMobileGroup ${expanded ? 'open' : ''}`}>
                    <button type="button" aria-expanded={expanded} aria-controls={`tm-mobile-panel-${section.id}`} onClick={() => setOpenMobileSection(expanded ? null : section.id)}>
                      <span>{section.label}</span>
                    </button>
                    <div id={`tm-mobile-panel-${section.id}`} className="tmMobileLinks">
                      {section.columns.map((column) => (
                        <div key={column.title} className="tmMobileColumn">
                          <small>{column.title}</small>
                          {column.items.map((item) => (
                            <Link key={`${section.id}-${column.title}-${item.label}-${item.href}`} href={item.href} className={isActive(item.href) ? 'active' : ''} onClick={closeMenus}>
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className={`tmMobileGroup ${openMobileSection === 'account' ? 'open' : ''}`}>
                <button type="button" aria-expanded={openMobileSection === 'account'} aria-controls="tm-mobile-panel-account" onClick={() => setOpenMobileSection(openMobileSection === 'account' ? null : 'account')}>
                  <span>{user ? 'Account' : 'Account / Sign in'}</span>
                </button>
                <div id="tm-mobile-panel-account" className="tmMobileLinks">
                  {isTrader && status === 'Verified' ? (
                    <div className="tmTraderSwitch" aria-label="Trader marketplace mode switch">
                      <button type="button" className={role === 'buyer' ? 'active' : ''} onClick={() => switchTraderMode('buyer')}>Buyer</button>
                      <button type="button" className={role === 'seller' ? 'active' : ''} onClick={() => switchTraderMode('seller')}>Seller</button>
                    </div>
                  ) : role ? <span className="tmModeChip">{role === 'seller' ? 'Seller mode' : 'Buyer mode'}</span> : null}

                  {user ? (
                    <div className="tmMobileAccountLinks">
                      <div className="tmMobileIdentity">
                        <span className="tmAvatar">{displayName.slice(0, 1).toUpperCase()}</span>
                        <span><b>{displayName}</b>{status && <small>{status} / {profileLabel}</small>}</span>
                      </div>
                      <Link href="/account" onClick={closeMenus}>Dashboard / Account</Link>
                      <Link href="/account/profile" onClick={closeMenus}>Profile</Link>
                      <Link href="/account/listings" onClick={closeMenus}>My Listings</Link>
                      <Link href="/account/requirements" onClick={closeMenus}>Requirements</Link>
                      <Link href="/account/help" onClick={closeMenus}>Help</Link>
                      <button type="button" onClick={signOut}>Sign out</button>
                    </div>
                  ) : (
                    <Link href="/signin" className="tmSignin" onClick={closeMenus}>Sign in</Link>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
