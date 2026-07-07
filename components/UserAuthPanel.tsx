'use client';

import { useEffect, useMemo, useState } from 'react';
import ContextualHelpBox from '@/components/help/ContextualHelpBox';
import { indiaLocations, getCitiesForState } from '@/lib/indiaLocations';

type Step = 'FORM' | 'OTP' | 'PENDING' | 'APPROVED';
type MarketRole = 'buyer' | 'seller';

async function resizeImageFile(file: File, maxSize = 900, quality = 0.72) {
  return new Promise<any>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ name: file.name, type: file.type, size: file.size });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          name: file.name,
          type: 'image/jpeg',
          originalType: file.type,
          size: file.size,
          compressed: true,
          previewSize: dataUrl.length,
          dataUrl,
        });
      };
      img.onerror = () => resolve({ name: file.name, type: file.type, size: file.size });
      img.src = String(reader.result || '');
    };
    reader.onerror = () => resolve({ name: file.name, type: file.type, size: file.size });
    reader.readAsDataURL(file);
  });
}

async function readFiles(files: FileList | null) {
  if (!files) return [];
  const list = Array.from(files).slice(0, 6);
  return Promise.all(
    list.map((file) => {
      if (!file.type.startsWith('image/')) {
        return Promise.resolve({ name: file.name, type: file.type, size: file.size });
      }
      return resizeImageFile(file);
    })
  );
}

function isTraderAccount(accountType?: string) {
  return String(accountType || '').toLowerCase().includes('trader');
}

function marketRoleFor(accountType: string): MarketRole {
  const lower = accountType.toLowerCase();
  if (lower.includes('seller') || lower.includes('supplier') || lower.includes('manufacturer') || lower.includes('scrap')) return 'seller';
  return 'buyer';
}

function helpTypeForAccount(accountType: string, trader: boolean) {
  if (trader) return 'traderOnboarding' as const;
  const lower = accountType.toLowerCase();
  if (lower.includes('seller') || lower.includes('supplier') || lower.includes('manufacturer') || lower.includes('scrap')) {
    return 'sellerOnboarding' as const;
  }
  return 'buyerOnboarding' as const;
}

function createSafeLocalUser(profile: any, roleHint?: string) {
  const trader = isTraderAccount(profile?.accountType || profile?.role || roleHint);
  const marketRole: MarketRole = trader
    ? ((localStorage.getItem('talmech-market-view') as MarketRole) || 'buyer')
    : marketRoleFor(String(profile?.accountType || profile?.role || roleHint || 'Buyer'));

  return {
    id: profile?.id || profile?.primaryMobile || profile?.phone || profile?.email || '',
    accountType: trader ? 'Trader - buyer and seller access' : profile?.accountType || profile?.role || marketRole,
    accountClass: trader ? 'trader' : marketRole,
    role: trader ? 'trader' : marketRole,
    marketRole,
    name: trader ? 'Trader' : profile?.ownerName || profile?.name || profile?.firmName || 'User',
    firmName: profile?.firmName || profile?.company || '',
    company: profile?.firmName || profile?.company || '',
    ownerName: profile?.ownerName || profile?.name || '',
    gstNumber: profile?.gstNumber || '',
    primaryMobile: profile?.primaryMobile || profile?.phone || '',
    phone: profile?.primaryMobile || profile?.phone || '',
    email: profile?.email || '',
    city: profile?.city || '',
    state: profile?.state || '',
    status: profile?.status || 'PENDING_REVIEW',
    verified: profile?.status === 'APPROVED' || Boolean(profile?.verified),
    traderAccess: trader && (profile?.status === 'APPROVED' || profile?.verified === true),
    adminCreated: Boolean(profile?.adminCreated),
    onboardingSource: profile?.onboardingSource || '',
    mustChangePassword: Boolean(profile?.mustChangePassword),
    profileConfirmationRequired: profile?.profileConfirmationRequired === undefined ? undefined : Boolean(profile?.profileConfirmationRequired),
  };
}

function clearLargeTalmechLocalStorage() {
  [
    'talmech-registration-draft',
    'talmech-upload-preview',
    'talmech-documents',
    'talmech-images',
    'talmech-large-profile',
  ].forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });
}

function persistProfile(profile: any) {
  const trader = isTraderAccount(profile?.accountType || profile?.role);
  const defaultRole: MarketRole = trader
    ? ((localStorage.getItem('talmech-market-view') as MarketRole) || 'buyer')
    : marketRoleFor(String(profile?.accountType || profile?.role || 'Buyer'));
  const safeProfile = createSafeLocalUser(profile, trader ? 'trader' : defaultRole);

  clearLargeTalmechLocalStorage();

  try {
    localStorage.setItem('talmech-user', JSON.stringify(safeProfile));
  } catch (error) {
    console.warn('Talmech localStorage quota exceeded. Replacing with minimal session only.', error);
    try {
      localStorage.removeItem('talmech-user');
      localStorage.setItem('talmech-user', JSON.stringify({
        id: safeProfile.id,
        accountType: safeProfile.accountType,
        accountClass: safeProfile.accountClass,
        role: safeProfile.role,
        marketRole: safeProfile.marketRole,
        name: safeProfile.name,
        status: safeProfile.status,
        verified: safeProfile.verified,
        traderAccess: safeProfile.traderAccess,
      }));
    } catch (secondError) {
      console.error('Unable to save even minimal Talmech session.', secondError);
    }
  }

  localStorage.setItem('talmech-account-class', trader ? 'trader' : defaultRole);
  localStorage.setItem('talmech-role', defaultRole);
  localStorage.setItem('talmech-market-view', defaultRole);
  localStorage.setItem('talmech-role-locked', trader && safeProfile.status === 'APPROVED' ? 'false' : 'true');
  localStorage.setItem('talmech-trader-approved', trader && safeProfile.status === 'APPROVED' ? 'true' : 'false');
  window.dispatchEvent(new Event('talmech-role-change'));
  return safeProfile;
}

const initialForm = {
  accountType: 'Buyer',
  firmName: '',
  ownerName: '',
  directorName: '',
  businessRole: 'Owner / Proprietor',
  gstNumber: '',
  primaryMobile: '',
  alternateMobile: '',
  email: '',
  state: 'Maharashtra',
  city: 'Pune',
  area: '',
  pincode: '',
  fullAddress: '',
  liveLocation: '',
  locationPermission: false,
  shopImages: [],
  documents: '',
  tradingProducts: '',
  monthlyTradingVolume: '',
  monthlyTradingVolumeUnit: 'MT / month',
  tradeScope: 'Domestic',
  annualTurnoverAmount: '',
  annualTurnoverUnit: 'Lakh',
  tradingExperienceYears: '',
  majorMarkets: '',
  buyerSellerMix: 'Both buying and selling',
  importExportCode: '',
  paymentCycle: '',
  warehouseDetails: '',
};

export default function UserAuthPanel() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<Step>('FORM');
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [message, setMessage] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [form, setForm] = useState<any>(initialForm);
  const [adminAssistedLogin, setAdminAssistedLogin] = useState({ login: '', password: '' });
  const [adminAssistedLoading, setAdminAssistedLoading] = useState(false);

  const traderForm = useMemo(() => isTraderAccount(form.accountType), [form.accountType]);

  useEffect(() => {
    try {
      const preferred = localStorage.getItem('talmech-preferred-account-type');
      if (preferred === 'trader') {
        setForm((f: any) => ({ ...f, accountType: 'Trader - buyer and seller access' }));
        localStorage.removeItem('talmech-preferred-account-type');
      }

      const raw = localStorage.getItem('talmech-user');
      const u = JSON.parse(raw || 'null');
      if (u) {
        const safe = raw && raw.length > 4000 ? persistProfile(u) : createSafeLocalUser(u, u.accountClass || u.role);
        setUser(safe);
        setStep(safe.status === 'APPROVED' || safe.verified ? 'APPROVED' : 'PENDING');
      }
    } catch {}
  }, []);

  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  async function pinLookup(pin: string) {
    set('pincode', pin);
    const clean = pin.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) {
      setPinMessage('');
      return;
    }
    try {
      const d = await fetch(`/api/pincode?pin=${clean}`).then((r) => r.json());
      if (d.ok && d.info) {
        setForm((f: any) => ({ ...f, pincode: clean, state: d.info.state, city: d.info.city, area: f.area || d.info.area }));
        setPinMessage(`Auto-detected: ${d.info.area}, ${d.info.city}, ${d.info.state}`);
      } else {
        setPinMessage('PIN not found in local sample. Select city/state manually; admin will verify.');
      }
    } catch {
      setPinMessage('PIN lookup unavailable. Select city/state manually.');
    }
  }

  async function handleShopFiles(files: FileList | null) {
    set('shopImages', await readFiles(files));
  }

  function validate() {
    if (!form.firmName || !form.ownerName || !form.gstNumber || !form.primaryMobile || !form.alternateMobile || !form.email || !form.fullAddress || !form.pincode) {
      return 'Please complete firm name, authorised person, GST, two mobile numbers, email, full address and PIN code.';
    }
    if (String(form.primaryMobile).replace(/\D/g, '').length < 10 || String(form.alternateMobile).replace(/\D/g, '').length < 10) {
      return 'Please enter two valid mobile numbers.';
    }
    if ((form.shopImages || []).length < 2) return 'Please upload at least two shop/office/warehouse/stockyard images for verification.';
    if (!form.locationPermission) return 'Please accept live/current location verification permission before submitting.';
    if (traderForm) {
      if (!form.tradingProducts || !form.monthlyTradingVolume || !form.annualTurnoverAmount || !form.tradingExperienceYears || !form.majorMarkets) {
        return 'For trader approval, please complete trading products, monthly trading volume, turnover, experience and major markets.';
      }
    }
    return '';
  }

  async function requestOtp() {
    const err = validate();
    if (err) {
      setMessage(err);
      return;
    }
    setMessage('Requesting OTP...');
    setOtp('');
    setOtpHint('');
    const res = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contact: form.primaryMobile,
        channel: 'sms',
        purpose: 'onboarding',
      }),
    });
    const data = await res.json().catch(() => ({ ok: false, error: 'Unable to request OTP.' }));
    if (!data.ok) {
      setMessage(data.error || 'Unable to request OTP.');
      return;
    }
    setOtpHint(data.developmentOnlyOtp ? String(data.developmentOnlyOtp) : '');
    setStep('OTP');
    setMessage(`OTP sent to ${data.contact || 'your mobile number'}.`);
  }

  async function submitRegistration() {
    setMessage('Verifying OTP...');
    const otpRes = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contact: form.primaryMobile,
        channel: 'sms',
        purpose: 'onboarding',
        otp,
      }),
    });
    const otpData = await otpRes.json().catch(() => ({ ok: false, error: 'Unable to verify OTP.' }));
    if (!otpData.ok) {
      setMessage(otpData.error || 'Invalid OTP.');
      return;
    }

    setMessage('Submitting registration for admin review...');
    const payload = {
      ...form,
      createdFrom: 'public-signin',
      accountLock: form.accountType,
      subscriptionRequired: traderForm,
      subscriptionPlan: traderForm ? 'Trader dual-access approval / subscription review required' : 'Not required',
      roleCategory: traderForm ? 'trader' : marketRoleFor(form.accountType),
    };
    const res = await fetch('/api/user-registrations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      setMessage(data.error || 'Unable to submit registration.');
      return;
    }
    const profile = { ...data.user, name: form.ownerName, role: form.accountType, phone: form.primaryMobile, company: form.firmName, verified: false };
    const safeProfile = persistProfile(profile);
    setUser(safeProfile);
    setStep('PENDING');
    setMessage('Registration submitted. Talmech admin will review and approve/reject the account from the admin portal.');
  }

  async function checkStatus() {
    if (!user?.id && !form.primaryMobile) {
      setMessage('Enter your mobile number or submit registration first.');
      return;
    }
    const key = user?.id || form.primaryMobile;
    const d = await fetch(`/api/user-registrations?statusBy=${encodeURIComponent(key)}`, { cache: 'no-store' }).then((r) => r.json());
    if (d.ok) {
      const profile = { ...d.user, name: d.user.ownerName, role: d.user.accountType, phone: d.user.primaryMobile, company: d.user.firmName, verified: d.user.status === 'APPROVED' };
      const safeProfile = persistProfile(profile);
      setUser(safeProfile);
      setStep(safeProfile.verified ? 'APPROVED' : 'PENDING');
      setMessage(`Current account status: ${d.user.status}`);
    } else {
      setMessage('No registration found. Please complete the form.');
    }
  }

  async function signInAdminAssisted() {
    if (!adminAssistedLogin.login || !adminAssistedLogin.password) {
      setMessage('Enter the email or mobile and password for the admin-created account.');
      return;
    }
    setAdminAssistedLoading(true);
    setMessage('Signing in...');
    const res = await fetch('/api/auth/admin-assisted-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(adminAssistedLogin),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to sign in.' }));
    setAdminAssistedLoading(false);
    if (!res.ok) {
      setMessage(res.error || 'Unable to sign in.');
      return;
    }

    const profile = {
      ...res.user,
      name: res.user.ownerName,
      role: res.user.accountType,
      phone: res.user.primaryMobile,
      company: res.user.firmName,
      verified: res.user.status === 'APPROVED',
    };
    const safeProfile = persistProfile(profile);
    setUser(safeProfile);
    setStep(safeProfile.verified ? 'APPROVED' : 'PENDING');
    setAdminAssistedLogin({ login: '', password: '' });
    setMessage(
      res.user.profileConfirmationRequired
        ? 'Signed in. Please review your profile details with Talmech support before full marketplace activation.'
        : 'Signed in successfully.'
    );
  }

  function signOut() {
    ['talmech-user', 'talmech-account-class', 'talmech-role', 'talmech-market-view', 'talmech-role-locked', 'talmech-trader-approved', 'talmech-preferred-account-type'].forEach((k) => localStorage.removeItem(k));
    setUser(null);
    setStep('FORM');
    window.dispatchEvent(new Event('talmech-role-change'));
  }

  function switchTraderView(next: MarketRole) {
    localStorage.setItem('talmech-role', next);
    localStorage.setItem('talmech-market-view', next);
    localStorage.setItem('talmech-role-locked', 'false');
    window.dispatchEvent(new Event('talmech-role-change'));
    setMessage(`Trader marketplace view changed to ${next === 'buyer' ? 'Buyer' : 'Seller'} mode.`);
  }

  if (user && step === 'APPROVED') {
    const trader = isTraderAccount(user.accountType || user.role);
    return (
      <section className="section">
        <div className="container">
          <div className="card profileCard">
            <span className="eyebrow">{trader ? 'Verified trader account' : 'Verified account'}</span>
            <h1 className="pageTitle">Welcome, {user.ownerName || user.name || user.phone}</h1>
            <p className="muted">
              {user.firmName || user.company} • {trader ? 'Trader dual-access approved' : user.accountType || user.role} • GST: {user.gstNumber || 'verified'} • Phone: {user.primaryMobile || user.phone}
            </p>
            {trader && (
              <div className="notice">
                Trader access is active. You can switch marketplace view anytime between buyer demand and seller/supplier listings.
              </div>
            )}
            <div className="row" style={{ justifyContent: 'flex-start' }}>
              {trader && <button className="btn" onClick={() => switchTraderView('buyer')}>Use buyer view</button>}
              {trader && <button className="btn secondary" onClick={() => switchTraderView('seller')}>Use seller view</button>}
              {!trader && <a className="btn" href="/post-requirement">Post Requirement</a>}
              {!trader && <a className="btn secondary" href="/public-marketplace">Browse Marketplace</a>}
              <a className="btn secondary" href="/how-it-works">How it works</a>
              <button className="btn dark" onClick={signOut}>Sign out</button>
            </div>
            {message && <p className="success">{message}</p>}
          </div>
        </div>
      </section>
    );
  }

  if (user && step === 'PENDING') {
    const trader = isTraderAccount(user.accountType || user.role);
    const adminAssisted = user.adminCreated || ['whatsapp-assisted', 'manual-admin-listing'].includes(user.onboardingSource);
    return (
      <section className="section">
        <div className="container">
          <div className="card profileCard">
            <span className="eyebrow">{trader ? 'Trader approval pending' : 'Verification pending'}</span>
            <h1 className="pageTitle">Your Talmech account is under review.</h1>
            <p className="muted">Firm: {user.firmName || user.company} • Account: {user.accountType || user.role} • Status: {user.status || 'PENDING_REVIEW'}</p>
            <p className="notice">{adminAssisted ? 'Your admin-created workspace is available. Please review your profile details; Talmech admin can still assist while confirmation is pending.' : trader ? 'Trader accounts need extra commercial review because they can access both buying and selling workflows.' : 'Marketplace posting and listing access opens after admin verification.'}</p>
            <div className="row" style={{ justifyContent: 'flex-start' }}>
              {adminAssisted && <a className="btn" href="/account">Open client workspace</a>}
              <button className="btn" onClick={checkStatus}>Check approval status</button>
              <a className="btn secondary" href="/how-it-works">Watch onboarding guide</a>
              <button className="btn dark" onClick={signOut}>Sign out</button>
            </div>
            {message && <p className="success">{message}</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="panel authPanel proRegistration traderRegistrationPanel">
          <span className="eyebrow">Verified account onboarding</span>
          <h1 className="pageTitle">Create a Talmech buyer, seller or trader account.</h1>
          <p className="muted">Trader accounts are reviewed separately and, after approval, can switch between buyer and seller marketplace views.</p>
          <ContextualHelpBox type={helpTypeForAccount(form.accountType, traderForm)} label="Need help onboarding?" />

          {step === 'FORM' ? (
            <div className="formGrid">
              <div className="span2 adminAssistedLoginBox">
                <div>
                  <span className="pill">Admin-assisted account</span>
                  <h2>Sign in to admin-created account</h2>
                  <p className="muted">Use the password you set from an activation link or the temporary password Talmech admin shared for a manually created account.</p>
                </div>
                <div className="formGrid">
                  <label>Email or mobile<input className="input" value={adminAssistedLogin.login} onChange={(e) => setAdminAssistedLogin((x) => ({ ...x, login: e.target.value }))} placeholder="registered email or mobile" /></label>
                  <label>Password<input className="input" type="password" value={adminAssistedLogin.password} onChange={(e) => setAdminAssistedLogin((x) => ({ ...x, password: e.target.value }))} autoComplete="current-password" /></label>
                  <button className="btn span2" type="button" disabled={adminAssistedLoading} onClick={signInAdminAssisted}>{adminAssistedLoading ? 'Signing in...' : 'Sign in to admin-created account'}</button>
                </div>
              </div>
              <label>Account type
                <select value={form.accountType} onChange={(e) => set('accountType', e.target.value)}>
                  <option>Buyer</option>
                  <option>Seller / Supplier</option>
                  <option>Manufacturer</option>
                  <option>Trader - buyer and seller access</option>
                  <option>Scrap dealer</option>
                  <option>Logistics provider</option>
                </select>
              </label>
              <label>Firm / company name<input className="input" value={form.firmName} onChange={(e) => set('firmName', e.target.value)} placeholder="Legal or trading name" /></label>
              <label>Owner / authorised person<input className="input" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="Owner / CEO / authorised person" /></label>
              <label>Designation<select value={form.businessRole} onChange={(e) => set('businessRole', e.target.value)}><option>Owner / Proprietor</option><option>Director</option><option>CEO</option><option>Partner</option><option>Purchase Head</option><option>Sales Head</option><option>Authorised Manager</option></select></label>
              <label>Director / partner name<input className="input" value={form.directorName} onChange={(e) => set('directorName', e.target.value)} placeholder="Optional but recommended" /></label>
              <label>GST number<input className="input" value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value.toUpperCase())} placeholder="27ABCDE1234F1Z5" /></label>
              <label>Email<input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="business@email.com" /></label>
              <label>Primary mobile / WhatsApp<input className="input" value={form.primaryMobile} onChange={(e) => set('primaryMobile', e.target.value)} placeholder="10 digit mobile" /></label>
              <label>Alternate mobile<input className="input" value={form.alternateMobile} onChange={(e) => set('alternateMobile', e.target.value)} placeholder="Second mobile number" /></label>
              <label>PIN code<input className="input" value={form.pincode} onChange={(e) => pinLookup(e.target.value)} placeholder="411026" /></label>
              <label>State<select value={form.state} onChange={(e) => { const first = getCitiesForState(e.target.value)[0] || ''; setForm((f: any) => ({ ...f, state: e.target.value, city: first })); }}>{indiaLocations.map((x) => <option key={x.state}>{x.state}</option>)}</select></label>
              <label>City<select value={form.city} onChange={(e) => set('city', e.target.value)}>{getCitiesForState(form.state).map((c) => <option key={c}>{c}</option>)}</select></label>
              <label>Area / MIDC / market<input className="input" value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="Chakan MIDC, Bhosari, GIDC etc." /></label>
              {pinMessage && <p className="span2 notice slimNotice">{pinMessage}</p>}
              <label className="span2">Full address<textarea value={form.fullAddress} onChange={(e) => set('fullAddress', e.target.value)} placeholder="Shop/office/plant/stockyard address with landmark" /></label>
              <label className="span2">Live/current location link or coordinates<input className="input" value={form.liveLocation} onChange={(e) => set('liveLocation', e.target.value)} placeholder="Google Maps link / Plus Code / coordinates" /></label>

              {traderForm && (
                <div className="span2 traderFieldsBox">
                  <span className="eyebrow">Trader commercial profile</span>
                  <div className="formGrid">
                    <label className="span2">What metals/products do you trade?<textarea value={form.tradingProducts} onChange={(e) => set('tradingProducts', e.target.value)} placeholder="Example: MS scrap, TMT, HR/CR coils, aluminium ingots, copper scrap, brass rods..." /></label>
                    <label>Monthly trading volume<input className="input" value={form.monthlyTradingVolume} onChange={(e) => set('monthlyTradingVolume', e.target.value)} placeholder="Example: 250" /></label>
                    <label>Volume unit<select value={form.monthlyTradingVolumeUnit} onChange={(e) => set('monthlyTradingVolumeUnit', e.target.value)}><option>KG / month</option><option>MT / month</option><option>Truckloads / month</option><option>Containers / month</option></select></label>
                    <label>Trade scope<select value={form.tradeScope} onChange={(e) => set('tradeScope', e.target.value)}><option>Domestic</option><option>International</option><option>Domestic and International</option></select></label>
                    <label>Annual turnover<input className="input" value={form.annualTurnoverAmount} onChange={(e) => set('annualTurnoverAmount', e.target.value)} placeholder="Example: 75" /></label>
                    <label>Turnover unit<select value={form.annualTurnoverUnit} onChange={(e) => set('annualTurnoverUnit', e.target.value)}><option>Lakh</option><option>Cr</option></select></label>
                    <label>Trading experience in years<input className="input" value={form.tradingExperienceYears} onChange={(e) => set('tradingExperienceYears', e.target.value)} placeholder="Example: 8" /></label>
                    <label>Buyer/seller activity<select value={form.buyerSellerMix} onChange={(e) => set('buyerSellerMix', e.target.value)}><option>Both buying and selling</option><option>Mainly buying</option><option>Mainly selling</option><option>Broker / mediator</option></select></label>
                    <label>IEC / import-export code<input className="input" value={form.importExportCode} onChange={(e) => set('importExportCode', e.target.value)} placeholder="Optional, for international trade" /></label>
                    <label>Payment cycle<input className="input" value={form.paymentCycle} onChange={(e) => set('paymentCycle', e.target.value)} placeholder="Advance / credit days / LC etc." /></label>
                    <label className="span2">Major markets / routes<textarea value={form.majorMarkets} onChange={(e) => set('majorMarkets', e.target.value)} placeholder="Example: Pune, Mumbai, Gujarat, Chennai, UAE import/export, etc." /></label>
                    <label className="span2">Warehouse / stockyard details<textarea value={form.warehouseDetails} onChange={(e) => set('warehouseDetails', e.target.value)} placeholder="Warehouse capacity, weighbridge, loading/unloading, transport support..." /></label>
                  </div>
                </div>
              )}

              <label className="span2">Upload at least two shop/office/warehouse/stockyard images<input className="input" type="file" accept="image/*,.pdf" multiple onChange={(e) => handleShopFiles(e.target.files)} /><span className="muted">Used only for protected admin verification.</span></label>
              {!!form.shopImages?.length && <div className="span2 uploadPreviewGrid">{form.shopImages.map((img: any, i: number) => img.dataUrl ? <div className="uploadPreviewCard" key={i}><img src={img.dataUrl} alt={img.name} /><b>{img.name}</b></div> : <div className="uploadPreviewCard docPreviewCard" key={i}>📄 {img.name}</div>)}</div>}
              <label className="span2">Document notes / business profile<textarea value={form.documents} onChange={(e) => set('documents', e.target.value)} placeholder="Mention documents available, references, dispatch capability, buying/selling category, compliance notes." /></label>
              <label className="span2 checkLine"><input type="checkbox" checked={form.locationPermission} onChange={(e) => set('locationPermission', e.target.checked)} /> I agree to current/live location verification and admin review before account activation.</label>
              {traderForm && <p className="span2 notice">Trader access is not automatic. Admin will review GST, turnover, trading experience, volume, location and business documents before enabling buyer/seller switching.</p>}
              <div className="span2"><button className="btn" onClick={requestOtp}>Verify mobile with OTP</button><button className="btn secondary" type="button" onClick={checkStatus} style={{ marginLeft: 10 }}>Check existing status</button></div>
              {message && <p className="span2 notice">{message}</p>}
            </div>
          ) : (
            <div className="otpBox">
              <p className="notice">
                {otpHint ? <>Development OTP for local testing: <b>{otpHint}</b></> : 'Enter the OTP sent to your mobile number. Production OTP delivery depends on the configured provider.'}
              </p>
              <label>Enter OTP<input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6 digit OTP" /></label>
              <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn" onClick={submitRegistration}>Submit for admin approval</button><button className="btn secondary" onClick={() => setStep('FORM')}>Edit details</button></div>
              {message && <p className="notice">{message}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
