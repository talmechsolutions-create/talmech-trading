'use client';

import { useState } from 'react';

function marketRoleFor(accountType: string) {
  const lower = accountType.toLowerCase();
  if (lower.includes('seller') || lower.includes('supplier') || lower.includes('manufacturer') || lower.includes('scrap')) return 'seller';
  return 'buyer';
}

function persistAdminAssistedUser(user: any) {
  const trader = String(user?.accountType || '').toLowerCase().includes('trader') || user?.roleCategory === 'trader';
  const marketRole = trader ? 'buyer' : marketRoleFor(String(user?.accountType || 'Buyer'));
  const safeProfile = {
    id: user?.id || '',
    accountType: user?.accountType || 'Buyer',
    accountClass: trader ? 'trader' : marketRole,
    role: trader ? 'trader' : marketRole,
    marketRole,
    name: user?.ownerName || user?.firmName || 'User',
    firmName: user?.firmName || '',
    company: user?.firmName || '',
    ownerName: user?.ownerName || '',
    gstNumber: user?.gstNumber || '',
    primaryMobile: user?.primaryMobile || '',
    phone: user?.primaryMobile || '',
    email: user?.email || '',
    city: user?.city || '',
    state: user?.state || '',
    status: user?.status || 'PENDING_PROFILE_CONFIRMATION',
    verified: user?.status === 'APPROVED',
    adminCreated: true,
    onboardingSource: user?.onboardingSource || 'whatsapp-assisted',
    profileConfirmationRequired: user?.profileConfirmationRequired !== false,
    traderAccess: trader && user?.status === 'APPROVED',
  };

  localStorage.setItem('talmech-user', JSON.stringify(safeProfile));
  localStorage.setItem('talmech-account-class', trader ? 'trader' : marketRole);
  localStorage.setItem('talmech-role', marketRole);
  localStorage.setItem('talmech-market-view', marketRole);
  localStorage.setItem('talmech-role-locked', trader && safeProfile.verified ? 'false' : 'true');
  localStorage.setItem('talmech-trader-approved', trader && safeProfile.verified ? 'true' : 'false');
  window.dispatchEvent(new Event('talmech-role-change'));
  return safeProfile;
}

export default function AdminAccountActivation({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [activated, setActivated] = useState(false);

  async function activate() {
    if (!token) {
      setMessage('Activation token is missing.');
      return;
    }
    if (password.length < 12) {
      setMessage('Use at least 12 characters for the password.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setSaving(true);
    setMessage('Activating account...');
    const res = await fetch('/api/auth/activate-admin-account', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to activate account.' }));
    setSaving(false);

    if (!res.ok) {
      setMessage(res.error || 'Unable to activate account.');
      return;
    }

    persistAdminAssistedUser(res.user);
    setActivated(true);
    setPassword('');
    setConfirmPassword('');
    setMessage('Account activated. Your password is set and no OTP was required for this admin-created setup.');
  }

  return (
    <main className="section activateAccountPage">
      <div className="container">
        <section className="panel activateAccountPanel">
          <span className="eyebrow">Admin-created account</span>
          <h1 className="pageTitle">Activate your Talmech Trading account</h1>
          <p className="muted">Set a password for the account created from your WhatsApp details. This activation flow does not change the normal public OTP onboarding flow.</p>

          {activated ? (
            <div className="success">
              {message}
              <div className="waActionRow" style={{ marginTop: 14 }}>
                <a className="btn" href="/signin">Continue to sign in</a>
                <a className="btn secondary" href="/post-requirement">Post requirement</a>
              </div>
            </div>
          ) : (
            <div className="formGrid">
              <label>Password<input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="Minimum 12 characters" /></label>
              <label>Confirm password<input className="input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></label>
              <button className="btn span2" type="button" disabled={saving} onClick={activate}>{saving ? 'Activating...' : 'Activate account'}</button>
              {message && <p className="notice span2">{message}</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
