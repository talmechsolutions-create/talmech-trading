'use client';

import { useEffect, useMemo, useState } from 'react';

type Audit = any;
type Campaign = any;

const starterCampaign = {
  status: 'Draft',
  channel: 'SEO / Organic',
  objective: 'Lead generation',
  audience: '',
  region: '',
  keywordTheme: '',
  landingPage: '/public-marketplace',
  budget: '',
  owner: 'Talmech Marketing',
  notes: '',
};

const sourceLabels: Record<string, string> = {
  direct: 'Direct / typed URL',
  organic: 'Organic search',
  referral: 'Referral',
};

function entries(obj: Record<string, number> = {}) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

export default function MarketingSeoConsole() {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [eventSummary, setEventSummary] = useState<any>({});
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(starterCampaign);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    const [a, c, e] = await Promise.all([
      fetch('/api/seo-audit', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/marketing-campaigns', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/marketing-events', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
    ]);
    setAudit(a.audit || null);
    setCampaigns(c.campaigns || []);
    setEvents(e.events || []);
    setEventSummary(e.summary || {});
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const pages = useMemo(() => {
    const q = filter.toLowerCase().trim();
    const rows = audit?.pageAudits || [];
    if (!q) return rows.slice(0, 90);
    return rows.filter((p: any) => `${p.path} ${p.title} ${p.keywords?.join(' ')}`.toLowerCase().includes(q)).slice(0, 120);
  }, [audit, filter]);

  async function createCampaign(e: any) {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/marketing-campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      setMessage('Marketing campaign added to tracker.');
      setForm(starterCampaign);
      await load();
    } else {
      setMessage(data.error || 'Could not save campaign.');
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/marketing-campaigns', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  const apiRows = audit?.apiRegistry || [];
  const summary = audit?.summary || {};
  const traffic = audit?.traffic || {};
  const playbooks = audit?.playbooks || [];

  return (
    <div className="marketingConsole">
      <section className="marketingHeroPanel">
        <div>
          <span className="eyebrow">SEO + Marketing Tracker</span>
          <h1 className="pageTitle">Growth command center for buyers, sellers and traders.</h1>
          <p className="muted">
            Plan campaigns, monitor technical SEO, capture UTM/source tracking, track mobile/desktop traffic and prepare API integrations without exposing public admin tools.
          </p>
        </div>
        <div className="marketingKpis">
          <div><b>{loading ? '...' : summary.pagesScanned || 0}</b><span>SEO pages scanned</span></div>
          <div><b>{loading ? '...' : `${summary.averageScore || 0}%`}</b><span>SEO readiness</span></div>
          <div><b>{loading ? '...' : summary.configuredApis || 0}</b><span>connected APIs</span></div>
          <div><b>{loading ? '...' : summary.eventsTracked || 0}</b><span>tracked visits</span></div>
        </div>
      </section>

      <section className="marketingSectionGap marketingInsightGrid">
        <div className="card marketingCardStrong">
          <h3>Buyer acquisition</h3>
          <p className="muted">Target city/product intent such as “MS plate supplier Pune”, “TMT bars near Chakan” and “copper scrap buyer Indore”.</p>
        </div>
        <div className="card marketingCardStrong">
          <h3>Supplier onboarding</h3>
          <p className="muted">Run supplier/dealer/trader campaigns and route them into approval, listings and CRM follow-up workflows.</p>
        </div>
        <div className="card marketingCardStrong">
          <h3>Trader growth</h3>
          <p className="muted">Build demand and supply heatmaps for approved traders using buyer/seller campaign segments and regional traffic.</p>
        </div>
        <div className="card marketingCardStrong">
          <h3>Mobile-first reach</h3>
          <p className="muted">Track mobile traffic, search queries and high-intent pages because most industrial users will browse on phone.</p>
        </div>
      </section>

      <section className="panel marketingSectionGap">
        <div className="sectionHeadMini">
          <div>
            <h2>API connection checklist</h2>
            <p className="muted">Minimum live stack: Search Console, GA4, SERP tracker, Razorpay webhook, Cloudinary and OpenRouteService. Social/ads APIs are added when you run paid campaigns.</p>
          </div>
          <button className="btn secondary" onClick={load}>Refresh tracker</button>
        </div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Integration</th><th>Purpose</th><th>Environment keys</th><th>Area</th><th>Status</th><th>Priority</th></tr></thead>
            <tbody>
              {apiRows.map((api: any) => (
                <tr key={api.name}>
                  <td><b>{api.name}</b><br/><small className="muted">{api.requiredFor}</small></td>
                  <td>{api.purpose}</td>
                  <td><code>{api.env}</code></td>
                  <td>{api.owner}</td>
                  <td><span className={api.configured ? 'status live' : 'status quote'}>{api.configured ? 'Configured' : 'Pending'}</span></td>
                  <td>{api.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="marketingGrid marketingSectionGap">
        <div className="panel">
          <h2>Live tracking snapshot</h2>
          <div className="growthMiniGrid">
            <div><b>{eventSummary.total || 0}</b><span>events stored</span></div>
            <div><b>{summary.mobileEvents || 0}</b><span>mobile visits</span></div>
            <div><b>{Object.keys(traffic.bySource || {}).length}</b><span>traffic sources</span></div>
            <div><b>{Object.keys(traffic.byCity || {}).filter((c)=>c !== 'unknown').length}</b><span>city signals</span></div>
          </div>
          <div className="trafficColumns">
            <div>
              <h3>Top sources</h3>
              {entries(traffic.bySource).map(([name, count]) => <p key={name}><b>{sourceLabels[name] || name}</b><span>{count}</span></p>)}
            </div>
            <div>
              <h3>User roles</h3>
              {entries(traffic.byRole).map(([name, count]) => <p key={name}><b>{name}</b><span>{count}</span></p>)}
            </div>
            <div>
              <h3>Devices</h3>
              {entries(traffic.byDevice).map(([name, count]) => <p key={name}><b>{name}</b><span>{count}</span></p>)}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>Marketing playbooks</h2>
          <div className="playbookList">
            {playbooks.map((p: any) => (
              <article key={p.title}>
                <h3>{p.title}</h3>
                <p className="muted">{p.target}</p>
                <div className="productChipCloud">{p.channels.map((c: string) => <span key={c}>{c}</span>)}</div>
                <ul>{p.actions.map((a: string) => <li key={a}>{a}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketingGrid marketingSectionGap">
        <div className="panel">
          <h2>Create marketing campaign</h2>
          <form className="formGrid" onSubmit={createCampaign}>
            <label>Channel<select value={form.channel} onChange={(e)=>setForm({...form, channel:e.target.value})}><option>SEO / Organic</option><option>Google Search Ads</option><option>Meta Ads</option><option>LinkedIn B2B</option><option>WhatsApp outreach</option><option>Email campaign</option><option>YouTube / Video SEO</option></select></label>
            <label>Status<select value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})}><option>Draft</option><option>Planned</option><option>Live</option><option>Paused</option><option>Completed</option></select></label>
            <label>Objective<input className="input" value={form.objective} onChange={(e)=>setForm({...form, objective:e.target.value})} placeholder="Buyer leads, supplier onboarding..." /></label>
            <label>Region<input className="input" value={form.region} onChange={(e)=>setForm({...form, region:e.target.value})} placeholder="Pune, Chakan, Indore..." /></label>
            <label className="span2">Audience<input className="input" value={form.audience} onChange={(e)=>setForm({...form, audience:e.target.value})} placeholder="Fabricators, contractors, scrap dealers..." /></label>
            <label className="span2">Keyword theme<input className="input" value={form.keywordTheme} onChange={(e)=>setForm({...form, keywordTheme:e.target.value})} placeholder="MS plate suppliers, copper scrap buyer..." /></label>
            <label>Landing page<input className="input" value={form.landingPage} onChange={(e)=>setForm({...form, landingPage:e.target.value})} /></label>
            <label>Budget<input className="input" value={form.budget} onChange={(e)=>setForm({...form, budget:e.target.value})} placeholder="₹ / month" /></label>
            <label className="span2">Notes<textarea value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} placeholder="Offer, CTA, follow-up workflow..." /></label>
            <button className="btn">Save campaign</button>
          </form>
          {message && <p className="success">{message}</p>}
        </div>
        <div className="panel">
          <h2>Campaign pipeline</h2>
          <div className="marketingCampaignList">
            {campaigns.map((campaign) => (
              <article className="campaignItem" key={campaign.id}>
                <div>
                  <span className="status estimate">{campaign.status}</span>
                  <h3>{campaign.objective}</h3>
                  <p className="muted">{campaign.channel} • {campaign.region}</p>
                  <p>{campaign.keywordTheme}</p>
                  <small className="muted">Landing: {campaign.landingPage}</small>
                </div>
                <select value={campaign.status} onChange={(e)=>updateStatus(campaign.id, e.target.value)}>
                  <option>Draft</option><option>Planned</option><option>Live</option><option>Paused</option><option>Completed</option>
                </select>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel marketingSectionGap">
        <div className="sectionHeadMini">
          <div>
            <h2>SEO page tracker</h2>
            <p className="muted">Search every public route, metal category, product page and keyword theme. Admin pages remain noindex and protected.</p>
          </div>
          <input className="input marketingFilter" value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="Filter pages or keywords..." />
        </div>
        <div className="seoPageGrid">
          {pages.map((page: any) => (
            <article className="seoPageCard" key={page.path}>
              <div className="seoScore"><b>{page.score}</b><span>/100</span></div>
              <div>
                <h3>{page.title}</h3>
                <p className="muted">{page.path} • {page.visitsTracked || 0} tracked visits</p>
                <div className="productChipCloud">{(page.keywords || []).slice(0, 6).map((kw: string) => <span key={kw}>{kw}</span>)}</div>
                <ul>{(page.recommendations || []).slice(0, 2).map((r: string) => <li key={r}>{r}</li>)}</ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel marketingSectionGap">
        <h2>Recent tracked events</h2>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Time</th><th>Page</th><th>Source</th><th>Medium</th><th>Role</th><th>Device</th><th>Keyword</th></tr></thead>
            <tbody>
              {events.slice(0, 40).map((ev) => (
                <tr key={ev.id}>
                  <td>{new Date(ev.createdAt).toLocaleString()}</td>
                  <td>{ev.page}</td>
                  <td>{ev.source}</td>
                  <td>{ev.medium}</td>
                  <td>{ev.role || 'unknown'}</td>
                  <td>{ev.device || 'unknown'}</td>
                  <td>{ev.keyword || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
