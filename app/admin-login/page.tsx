'use client';
import { useEffect, useState } from 'react';

function adminRedirectTarget() {
  if (typeof window === 'undefined') return '/dashboard';
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const redirectTo = adminRedirectTarget();
    fetch('/api/admin-session', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.authenticated) window.location.href = redirectTo; })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMessage('');
    const res = await fetch('/api/admin-session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    const redirectTo = adminRedirectTarget();
    if (data.ok) window.location.href = redirectTo;
    else setMessage(data.error || 'Invalid admin credentials.');
  }

  return (
    <main className="adminLoginPage">
      <section className="adminLoginShell">
        <div className="adminLoginBrand">
          <span className="brandMark">T</span>
          <b>Talmech Trading</b>
        </div>
        <div className="adminLoginGrid">
          <div className="adminLoginCopy">
            <span className="eyebrow">Private admin portal</span>
            <h1>Secure access for verified Talmech operations only.</h1>
            <p>Use this portal to review users, leads, listings, price-lock requests, CRM follow-up and admin workflow. Public users cannot see this route from the website navigation.</p>
            <ul>
              <li>HttpOnly admin session cookie</li>
              <li>Protected admin pages and admin APIs</li>
              <li>Hidden from public navigation and blocked from indexing</li>
              <li>Use strong credentials before production deployment</li>
            </ul>
          </div>
          <form className="adminLoginCard" onSubmit={submit}>
            <h2>Admin sign in</h2>
            <p className="muted">Enter authorised Talmech admin credentials.</p>
            <label>Username<input className="input" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required /></label>
            <label>Password<input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
            <button className="btn" disabled={loading}>{loading ? 'Checking...' : 'Open admin portal'}</button>
            {message && <p className="notice">{message}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
