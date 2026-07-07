'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type View = 'dashboard' | 'profile' | 'listings' | 'new-listing' | 'requirements' | 'new-requirement' | 'orders' | 'performance' | 'help';

const nav = [
  ['Dashboard', '/account', 'dashboard'],
  ['Profile', '/account/profile', 'profile'],
  ['Listings', '/account/listings', 'listings'],
  ['Requirements', '/account/requirements', 'requirements'],
  ['Orders', '/account/orders', 'orders'],
  ['Performance', '/account/performance', 'performance'],
  ['Help', '/account/help', 'help'],
] as const;

const blankListing = {
  listingType: 'Sell listing',
  metal: '',
  product: '',
  grade: '',
  productForm: '',
  sizeOrSpecification: '',
  quantity: '',
  quantityUnit: 'KG',
  price: '',
  priceUnit: 'per kg',
  targetPrice: '',
  taxStatus: 'not sure',
  stockStatus: 'ready stock',
  certificateAvailable: '',
  certificateRequired: '',
  dispatchLocation: '',
  deliveryLocation: '',
  city: '',
  state: '',
  deliveryTimeline: '',
  remarks: '',
};

const blankRequirement = {
  metal: '',
  product: '',
  grade: '',
  quantity: '',
  unit: 'KG',
  targetPrice: '',
  city: '',
  state: '',
  deliveryLocation: '',
  deliveryTimeline: '',
  remarks: '',
};

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function raw(row: any) {
  return row?.raw && typeof row.raw === 'object' ? row.raw : {};
}

function loadLocalUser() {
  try {
    return JSON.parse(localStorage.getItem('talmech-user') || 'null');
  } catch {
    return null;
  }
}

function Field({ label, value }: { label: string; value: unknown }) {
  return <p><b>{label}:</b> {String(value || '-')}</p>;
}

export default function AccountWorkspace({ view }: { view: View }) {
  const [user, setUser] = useState<any>(null);
  const [profileForm, setProfileForm] = useState<any>({});
  const [listings, setListings] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [listingForm, setListingForm] = useState<any>(blankListing);
  const [requirementForm, setRequirementForm] = useState<any>(blankRequirement);
  const [ticketForm, setTicketForm] = useState({ category: 'General support', priority: 'Normal', subject: '', message: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const accountType = user?.accountType || user?.role || 'Account';
  const profileNeedsReview = user?.profileConfirmationRequired || /PENDING/i.test(String(user?.status || ''));
  const mustChangePassword = Boolean(user?.mustChangePassword);
  const activeListings = listings.filter((listing) => !/sold|fulfilled|closed|paused/i.test(String(listing.status || ''))).length;

  const performance = useMemo(() => ({
    totalListings: listings.length,
    activeListings,
    requirements: requirements.length,
    inquiries: 0,
    quoteRequests: requirements.length,
    priceLocks: 0,
    completedOrders: 0,
    pendingAdminActions: listings.filter((listing) => /pending/i.test(String(listing.status || raw(listing).listingApprovalStatus || ''))).length + requirements.filter((req) => /new|pending/i.test(String(req.status || ''))).length,
  }), [listings, requirements, activeListings]);

  async function load() {
    setLoading(true);
    const local = loadLocalUser();
    if (local) setUser(local);
    const profile = await fetch('/api/account/profile', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ ok: false }));
    if (profile.ok) {
      setUser(profile.user);
      setProfileForm(profile.user);
    } else if (local) {
      setProfileForm(local);
      setMessage('Sign in again if profile, listing, or ticket actions are unavailable.');
    }
    const [listingData, requirementData, ticketData] = await Promise.all([
      fetch('/api/account/listings', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ ok: false, listings: [] })),
      fetch('/api/account/requirements', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ ok: false, requirements: [] })),
      fetch('/api/account/support-tickets', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ ok: false, tickets: [] })),
    ]);
    if (listingData.ok) setListings(listingData.listings || []);
    if (requirementData.ok) setRequirements(requirementData.requirements || []);
    if (ticketData.ok) setTickets(ticketData.tickets || []);
    setLoading(false);
  }

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  function setProfile(key: string, value: string) {
    setProfileForm((form: any) => ({ ...form, [key]: value }));
  }

  function setListing(key: string, value: string) {
    setListingForm((form: any) => ({ ...form, [key]: value }));
  }

  function setRequirement(key: string, value: string) {
    setRequirementForm((form: any) => ({ ...form, [key]: value }));
  }

  async function saveProfile() {
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(profileForm),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to save profile.' }));
    setMessage(res.ok ? 'Profile updated. Sensitive changes may require Talmech confirmation.' : res.error || 'Unable to save profile.');
    if (res.ok) {
      setUser(res.user);
      localStorage.setItem('talmech-user', JSON.stringify({ ...loadLocalUser(), ...res.user, name: res.user.ownerName, company: res.user.firmName }));
      window.dispatchEvent(new Event('talmech-role-change'));
    }
  }

  async function createListing() {
    const res = await fetch('/api/account/listings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(listingForm),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to create listing.' }));
    setMessage(res.ok ? 'Listing submitted for admin review.' : res.error || 'Unable to create listing.');
    if (res.ok) {
      setListingForm(blankListing);
      await load();
    }
  }

  async function createRequirement() {
    const res = await fetch('/api/account/requirements', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requirementForm),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to post requirement.' }));
    setMessage(res.ok ? 'Requirement posted for Talmech review.' : res.error || 'Unable to post requirement.');
    if (res.ok) {
      setRequirementForm(blankRequirement);
      await load();
    }
  }

  async function createTicket() {
    const res = await fetch('/api/account/support-tickets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ticketForm),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to create ticket.' }));
    setMessage(res.ok ? 'Support ticket created.' : res.error || 'Unable to create ticket.');
    if (res.ok) {
      setTicketForm({ category: 'General support', priority: 'Normal', subject: '', message: '' });
      await load();
    }
  }

  async function changePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setMessage('Enter your current temporary password and a new password.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }
    setPasswordSaving(true);
    const res = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(passwordForm),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to change password.' }));
    setPasswordSaving(false);
    setMessage(res.ok ? 'Password changed. Your temporary password is no longer valid.' : res.error || 'Unable to change password.');
    if (res.ok) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setUser(res.user);
      localStorage.setItem('talmech-user', JSON.stringify({ ...loadLocalUser(), ...res.user, name: res.user.ownerName, company: res.user.firmName }));
      window.dispatchEvent(new Event('talmech-role-change'));
    }
  }

  if (!user && !loading) {
    return (
      <main className="accountShell section">
        <div className="container">
          <section className="panel accountEmptyState">
            <span className="eyebrow">Client workspace</span>
            <h1 className="pageTitle">Sign in to open your Talmech workspace.</h1>
            <p className="muted">Admin-created clients can activate their account and sign in from the sign-in page.</p>
            <Link className="btn" href="/signin">Go to sign in</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="accountShell section">
      <div className="container accountLayout">
        <aside className="accountSidebar">
          <div className="accountAvatar">{String(user?.firmName || user?.ownerName || 'T').slice(0, 1).toUpperCase()}</div>
          <b>{user?.firmName || user?.company || user?.ownerName || 'Talmech client'}</b>
          <span className="pill">{accountType}</span>
          <nav>{nav.map(([label, href, key]) => <Link key={href} className={view === key ? 'active' : ''} href={href}>{label}</Link>)}</nav>
        </aside>
        <section className="accountMain">
          <div className="accountHero">
            <div>
              <span className="eyebrow">Client workspace</span>
              <h1 className="pageTitle">Welcome, {user?.firmName || user?.ownerName || user?.name || 'Talmech client'}</h1>
              <p className="muted">Manage listings, buying requirements, orders, profile details, and support tickets from one place.</p>
            </div>
            <a className="btn secondary" href="https://wa.me/917389642874" target="_blank" rel="noreferrer">Contact Talmech</a>
          </div>
          {profileNeedsReview && <p className="notice">Please review and complete your business profile. Talmech admin can still assist you.</p>}
          {mustChangePassword && (
            <section className="panel accountPasswordPanel">
              <div>
                <span className="pill gold">Temporary password</span>
                <h2>Change your password</h2>
                <p className="muted">This admin-created account was issued with a temporary password. Set a new password before continuing regular account work.</p>
              </div>
              <div className="formGrid">
                <label>Current temporary password<input className="input" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((form) => ({ ...form, currentPassword: event.target.value }))} autoComplete="current-password" /></label>
                <label>New password<input className="input" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((form) => ({ ...form, newPassword: event.target.value }))} autoComplete="new-password" /></label>
                <label>Confirm new password<input className="input" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((form) => ({ ...form, confirmPassword: event.target.value }))} autoComplete="new-password" /></label>
                <button className="btn" type="button" disabled={passwordSaving} onClick={changePassword}>{passwordSaving ? 'Changing...' : 'Change password'}</button>
              </div>
            </section>
          )}
          {message && <p className="success">{message}</p>}

          {view === 'dashboard' && (
            <>
              <div className="grid cards4 accountKpis">
                <div className="card"><h2>{activeListings}</h2><p className="muted">Active listings</p></div>
                <div className="card"><h2>{requirements.length}</h2><p className="muted">Requirements</p></div>
                <div className="card"><h2>0</h2><p className="muted">Orders / price locks</p></div>
                <div className="card"><h2>{tickets.filter((t) => !/resolved|closed/i.test(t.status)).length}</h2><p className="muted">Open tickets</p></div>
              </div>
              <div className="accountQuickActions">
                <Link className="btn" href="/account/listings/new">Create new listing</Link>
                <Link className="btn secondary" href="/account/requirements/new">Post requirement</Link>
                <Link className="btn secondary" href="/account/profile">Edit profile</Link>
                <Link className="btn secondary" href="/account/help">Raise support ticket</Link>
              </div>
              <section className="panel">
                <h2>Recent activity</h2>
                {[...listings.slice(0, 3), ...requirements.slice(0, 2), ...tickets.slice(0, 2)].length ? (
                  <div className="accountActivityList">
                    {listings.slice(0, 3).map((listing) => <p key={listing.id}><b>{listing.id}</b> listing is {listing.status || 'Open'}.</p>)}
                    {requirements.slice(0, 2).map((req) => <p key={req.id}><b>{req.id}</b> requirement is {req.status || 'New'}.</p>)}
                    {tickets.slice(0, 2).map((ticket) => <p key={ticket.ticketId}><b>{ticket.ticketId}</b> ticket is {ticket.status}.</p>)}
                  </div>
                ) : <p className="muted">No recent activity yet.</p>}
              </section>
            </>
          )}

          {view === 'profile' && (
            <section className="panel">
              <h2>Business profile</h2>
              <div className="formGrid">
                <label>Full name<input className="input" value={profileForm.ownerName || ''} onChange={(event) => setProfile('ownerName', event.target.value)} /></label>
                <label>Firm name<input className="input" value={profileForm.firmName || ''} onChange={(event) => setProfile('firmName', event.target.value)} /></label>
                <label>Email<input className="input" value={profileForm.email || ''} onChange={(event) => setProfile('email', event.target.value)} /></label>
                <label>Mobile<input className="input" value={profileForm.primaryMobile || ''} onChange={(event) => setProfile('primaryMobile', event.target.value)} /></label>
                <label>Alternate mobile<input className="input" value={profileForm.alternateMobile || ''} onChange={(event) => setProfile('alternateMobile', event.target.value)} /></label>
                <label>GST<input className="input" value={profileForm.gstNumber || ''} onChange={(event) => setProfile('gstNumber', event.target.value.toUpperCase())} /></label>
                <label>City<input className="input" value={profileForm.city || ''} onChange={(event) => setProfile('city', event.target.value)} /></label>
                <label>State<input className="input" value={profileForm.state || ''} onChange={(event) => setProfile('state', event.target.value)} /></label>
                <label>Business role<input className="input" value={profileForm.businessRole || ''} onChange={(event) => setProfile('businessRole', event.target.value)} /></label>
                <label className="span2">Address<textarea value={profileForm.fullAddress || ''} onChange={(event) => setProfile('fullAddress', event.target.value)} /></label>
                <label className="span2">Product interest / trading products<textarea value={profileForm.tradingProducts || ''} onChange={(event) => setProfile('tradingProducts', event.target.value)} /></label>
                <label className="span2">Documents note<textarea value={profileForm.documents || ''} onChange={(event) => setProfile('documents', event.target.value)} /></label>
                <button className="btn span2" type="button" onClick={saveProfile}>Save profile</button>
              </div>
            </section>
          )}

          {view === 'listings' && (
            <section className="panel">
              <div className="sectionHead"><div><h2>My listings</h2><p className="muted">Client-created listings stay pending until Talmech reviews them.</p></div><Link className="btn" href="/account/listings/new">New listing</Link></div>
              <div className="accountTableWrap"><table><thead><tr><th>ID</th><th>Type</th><th>Product</th><th>Quantity</th><th>Status</th><th>Created</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id}><td>{listing.id}</td><td>{raw(listing).listingKind || listing.type}</td><td>{listing.metal} / {listing.product} / {listing.grade || '-'}</td><td>{listing.quantity} {listing.unit}</td><td><span className="pill">{listing.status}</span></td><td>{formatDate(listing.createdAt)}</td></tr>)}{!listings.length && <tr><td colSpan={6}>No listings yet.</td></tr>}</tbody></table></div>
            </section>
          )}

          {view === 'new-listing' && (
            <section className="panel">
              <h2>Create new listing</h2>
              <ListingForm form={listingForm} set={setListing} onSubmit={createListing} />
            </section>
          )}

          {view === 'requirements' && (
            <section className="panel">
              <div className="sectionHead"><div><h2>My requirements</h2><p className="muted">Buying requirements posted from your workspace.</p></div><Link className="btn" href="/account/requirements/new">New requirement</Link></div>
              <div className="accountTableWrap"><table><thead><tr><th>ID</th><th>Product</th><th>Quantity</th><th>Status</th><th>Created</th></tr></thead><tbody>{requirements.map((req) => <tr key={req.id}><td>{req.id}</td><td>{req.metal} / {req.product} / {req.grade || '-'}</td><td>{req.quantity} {req.unit}</td><td><span className="pill">{req.status}</span></td><td>{formatDate(req.createdAt)}</td></tr>)}{!requirements.length && <tr><td colSpan={5}>No requirements yet.</td></tr>}</tbody></table></div>
            </section>
          )}

          {view === 'new-requirement' && (
            <section className="panel">
              <h2>Post requirement</h2>
              <RequirementForm form={requirementForm} set={setRequirement} onSubmit={createRequirement} />
            </section>
          )}

          {view === 'orders' && (
            <section className="panel accountEmptyState"><h2>Orders</h2><p className="muted">No orders yet. Orders will appear here after Talmech confirms a deal or price lock.</p></section>
          )}

          {view === 'performance' && (
            <section className="panel">
              <h2>Performance</h2>
              <div className="grid cards3 accountKpis">
                <Kpi label="Total listings" value={performance.totalListings} />
                <Kpi label="Active listings" value={performance.activeListings} />
                <Kpi label="Inquiries" value={performance.inquiries} />
                <Kpi label="Quote requests" value={performance.quoteRequests} />
                <Kpi label="Price locks" value={performance.priceLocks} />
                <Kpi label="Completed orders" value={performance.completedOrders} />
                <Kpi label="Pending admin actions" value={performance.pendingAdminActions} />
              </div>
              <p className="muted">Performance stays at 0 until real inquiries, price locks, and completed orders are linked to this account.</p>
            </section>
          )}

          {view === 'help' && (
            <section className="panel">
              <h2>Help tickets</h2>
              <div className="formGrid">
                <label>Category<input className="input" value={ticketForm.category} onChange={(event) => setTicketForm((form) => ({ ...form, category: event.target.value }))} /></label>
                <label>Priority<select value={ticketForm.priority} onChange={(event) => setTicketForm((form) => ({ ...form, priority: event.target.value }))}><option>Normal</option><option>High</option><option>Urgent</option></select></label>
                <label className="span2">Subject<input className="input" value={ticketForm.subject} onChange={(event) => setTicketForm((form) => ({ ...form, subject: event.target.value }))} /></label>
                <label className="span2">Message<textarea value={ticketForm.message} onChange={(event) => setTicketForm((form) => ({ ...form, message: event.target.value }))} /></label>
                <button className="btn span2" type="button" onClick={createTicket}>Create ticket</button>
              </div>
              <div className="accountTicketList">
                {tickets.map((ticket) => <article className="card" key={ticket.ticketId}><span className="pill">{ticket.status}</span><h3>{ticket.subject}</h3><p className="muted">{ticket.ticketId} / {formatDate(ticket.createdAt)}</p><p>{ticket.message}</p></article>)}
                {!tickets.length && <p className="muted">No support tickets yet.</p>}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return <div className="card"><h2>{value}</h2><p className="muted">{label}</p></div>;
}

function ListingForm({ form, set, onSubmit }: { form: any; set: (key: string, value: string) => void; onSubmit: () => void }) {
  return (
    <div className="formGrid">
      <label>Listing type<select value={form.listingType} onChange={(event) => set('listingType', event.target.value)}><option>Sell listing</option><option>Buy requirement</option><option>Scrap listing</option><option>Trader deal listing</option></select></label>
      <label>Metal<input className="input" value={form.metal} onChange={(event) => set('metal', event.target.value)} /></label>
      <label>Product<input className="input" value={form.product} onChange={(event) => set('product', event.target.value)} /></label>
      <label>Grade<input className="input" value={form.grade} onChange={(event) => set('grade', event.target.value)} /></label>
      <label>Product form<input className="input" value={form.productForm} onChange={(event) => set('productForm', event.target.value)} /></label>
      <label>Size / spec<input className="input" value={form.sizeOrSpecification} onChange={(event) => set('sizeOrSpecification', event.target.value)} /></label>
      <label>Quantity<input className="input" value={form.quantity} onChange={(event) => set('quantity', event.target.value)} /></label>
      <label>Unit<input className="input" value={form.quantityUnit} onChange={(event) => set('quantityUnit', event.target.value)} /></label>
      <label>Price<input className="input" value={form.price} onChange={(event) => set('price', event.target.value)} /></label>
      <label>Price unit<input className="input" value={form.priceUnit} onChange={(event) => set('priceUnit', event.target.value)} /></label>
      <label>Target price<input className="input" value={form.targetPrice} onChange={(event) => set('targetPrice', event.target.value)} /></label>
      <label>GST<select value={form.taxStatus} onChange={(event) => set('taxStatus', event.target.value)}><option>not sure</option><option>GST extra</option><option>GST included</option></select></label>
      <label>Stock status<input className="input" value={form.stockStatus} onChange={(event) => set('stockStatus', event.target.value)} /></label>
      <label>Certificate available<input className="input" value={form.certificateAvailable} onChange={(event) => set('certificateAvailable', event.target.value)} /></label>
      <label className="span2">Dispatch location<textarea value={form.dispatchLocation} onChange={(event) => set('dispatchLocation', event.target.value)} /></label>
      <label className="span2">Delivery location<textarea value={form.deliveryLocation} onChange={(event) => set('deliveryLocation', event.target.value)} /></label>
      <label>City<input className="input" value={form.city} onChange={(event) => set('city', event.target.value)} /></label>
      <label>State<input className="input" value={form.state} onChange={(event) => set('state', event.target.value)} /></label>
      <label>Delivery timeline<input className="input" value={form.deliveryTimeline} onChange={(event) => set('deliveryTimeline', event.target.value)} /></label>
      <label className="span2">Remarks / images and documents note<textarea value={form.remarks} onChange={(event) => set('remarks', event.target.value)} /></label>
      <button className="btn span2" type="button" onClick={onSubmit}>Submit for admin review</button>
    </div>
  );
}

function RequirementForm({ form, set, onSubmit }: { form: any; set: (key: string, value: string) => void; onSubmit: () => void }) {
  return (
    <div className="formGrid">
      <label>Metal<input className="input" value={form.metal} onChange={(event) => set('metal', event.target.value)} /></label>
      <label>Product<input className="input" value={form.product} onChange={(event) => set('product', event.target.value)} /></label>
      <label>Grade<input className="input" value={form.grade} onChange={(event) => set('grade', event.target.value)} /></label>
      <label>Quantity<input className="input" value={form.quantity} onChange={(event) => set('quantity', event.target.value)} /></label>
      <label>Unit<input className="input" value={form.unit} onChange={(event) => set('unit', event.target.value)} /></label>
      <label>Target price<input className="input" value={form.targetPrice} onChange={(event) => set('targetPrice', event.target.value)} /></label>
      <label>City<input className="input" value={form.city} onChange={(event) => set('city', event.target.value)} /></label>
      <label>State<input className="input" value={form.state} onChange={(event) => set('state', event.target.value)} /></label>
      <label className="span2">Delivery location<textarea value={form.deliveryLocation} onChange={(event) => set('deliveryLocation', event.target.value)} /></label>
      <label>Delivery timeline<input className="input" value={form.deliveryTimeline} onChange={(event) => set('deliveryTimeline', event.target.value)} /></label>
      <label className="span2">Technical details / remarks<textarea value={form.remarks} onChange={(event) => set('remarks', event.target.value)} /></label>
      <button className="btn span2" type="button" onClick={onSubmit}>Post requirement</button>
    </div>
  );
}
