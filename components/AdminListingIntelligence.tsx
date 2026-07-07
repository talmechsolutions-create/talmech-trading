import Link from 'next/link';
import type { ListingIntelligenceSummary, ListingStrategy } from '@/lib/listingIntelligence';

function join(value: unknown, fallback = 'Insufficient data') {
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  return String(value || fallback);
}

function scoreClass(score: number) {
  if (score >= 80) return 'pill green';
  if (score >= 55) return 'pill gold';
  return 'pill';
}

function StrategyBlock({ strategy }: { strategy: ListingStrategy }) {
  return (
    <article className="card listingStrategyCard">
      <div className="sectionHead compactHead">
        <div>
          <span className={scoreClass(strategy.qualityScore)}>Quality {strategy.qualityScore}</span>
          <h3>{strategy.strategyTitle}</h3>
          <p className="muted">{strategy.recommendedPitch}</p>
        </div>
        <Link className="btn secondary" href={`/admin/listings/${strategy.listingId}`}>Open listing</Link>
      </div>
      <div className="grid cards3">
        <div>
          <b>Target buyer profiles</b>
          {strategy.targetBuyerProfiles.map((item) => <p key={item}>{item}</p>)}
        </div>
        <div>
          <b>Target industries</b>
          {strategy.targetIndustries.map((item) => <p key={item}>{item}</p>)}
        </div>
        <div>
          <b>Suggested admin actions</b>
          {strategy.suggestedAdminActions.map((item) => <p key={item}>{item}</p>)}
        </div>
      </div>
      {strategy.missingDataWarnings.length > 0 && (
        <p className="notice slimNotice">{strategy.missingDataWarnings.join(' ')}</p>
      )}
    </article>
  );
}

export default function AdminListingIntelligence({ summary, aiStatus }: { summary: ListingIntelligenceSummary; aiStatus: string }) {
  const overview = summary.overview;

  return (
    <main className="adminShell section listingIntelShell">
      <div className="container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Talmech Listing Intelligence Engine</span>
            <h1 className="pageTitle">Listing supervision and strategy</h1>
            <p className="muted">Rules-based intelligence for metal, product, grade, region, listing type, demand category, active status, and target buyer strategy.</p>
          </div>
          <div className="waActionRow">
            <Link className="btn secondary" href="/admin/listings">Admin listings</Link>
            <Link className="btn secondary" href="/admin">Admin home</Link>
          </div>
        </div>

        <div className="listingIntelMode">
          <span className="pill green">Rules-based intelligence active</span>
          <span className="pill gold">{aiStatus}</span>
          <span className="muted">Generated {new Date(summary.generatedAt).toLocaleString('en-IN')}</span>
        </div>

        <section className="grid cards4">
          <div className="card"><h2>{overview.totalListings}</h2><p className="muted">Total listings</p></div>
          <div className="card"><h2>{overview.activeListings}</h2><p className="muted">Active listings</p></div>
          <div className="card"><h2>{overview.pendingReview}</h2><p className="muted">Pending review</p></div>
          <div className="card"><h2>{overview.adminCreated}</h2><p className="muted">Admin-created</p></div>
          <div className="card"><h2>{overview.clientCreated}</h2><p className="muted">Client-created</p></div>
          <div className="card"><h2>{overview.whatsappAssisted}</h2><p className="muted">WhatsApp-assisted</p></div>
          <div className="card"><h2>{overview.listingsWithImages}</h2><p className="muted">Listings with images</p></div>
          <div className="card"><h2>{overview.listingsMissingImages}</h2><p className="muted">Listings missing images</p></div>
        </section>

        <section className="panel intelPanel">
          <h2>Metal-wise dashboard</h2>
          <div className="waAdminTableWrap"><table className="waAdminTable">
            <thead><tr><th>Metal</th><th>Active</th><th>Total</th><th>Top products</th><th>Top regions</th><th>Buyer/seller mix</th><th>Recommended action</th></tr></thead>
            <tbody>{summary.byMetal.map((row) => <tr key={row.metal}><td><b>{row.metal}</b></td><td>{row.activeListings}</td><td>{row.totalListings}</td><td>{join(row.topProducts)}</td><td>{join(row.topRegions)}</td><td>{row.buyerSellerMix}</td><td>{row.recommendedAction}</td></tr>)}{!summary.byMetal.length && <tr><td colSpan={7}>No metal listing data yet.</td></tr>}</tbody>
          </table></div>
        </section>

        <section className="panel intelPanel">
          <h2>Product-wise dashboard</h2>
          <div className="waAdminTableWrap"><table className="waAdminTable">
            <thead><tr><th>Product</th><th>Metal</th><th>Active</th><th>Regions</th><th>Target buyer strategy</th><th>Admin action</th></tr></thead>
            <tbody>{summary.byProduct.map((row) => <tr key={`${row.metal}-${row.product}`}><td><b>{row.product}</b></td><td>{row.metal}</td><td>{row.activeListings}</td><td>{join(row.regions)}</td><td>{join(row.likelyBuyerTypes)}</td><td>{row.suggestedNextAction}</td></tr>)}{!summary.byProduct.length && <tr><td colSpan={6}>No product listing data yet.</td></tr>}</tbody>
          </table></div>
        </section>

        <section className="panel intelPanel">
          <h2>Region-wise dashboard</h2>
          <div className="waAdminTableWrap"><table className="waAdminTable">
            <thead><tr><th>State / city</th><th>Active</th><th>Metals</th><th>Products</th><th>Buyer/seller mix</th><th>Opportunity notes</th></tr></thead>
            <tbody>{summary.byRegion.map((row) => <tr key={row.region}><td><b>{row.region}</b></td><td>{row.activeListings}</td><td>{join(row.metals)}</td><td>{join(row.products)}</td><td>{row.buyerSellerMix}</td><td>{row.opportunityNotes}</td></tr>)}{!summary.byRegion.length && <tr><td colSpan={6}>No regional listing data yet.</td></tr>}</tbody>
          </table></div>
        </section>

        <section className="panel intelPanel">
          <h2>Listings needing attention</h2>
          <div className="waAdminTableWrap"><table className="waAdminTable">
            <thead><tr><th>Listing</th><th>Product</th><th>Status</th><th>Images</th><th>Quality</th><th>Missing data / warnings</th></tr></thead>
            <tbody>{summary.attentionListings.map((item: any) => <tr key={item.listing.id}><td><Link href={`/admin/listings/${item.listing.id}`}>{item.listing.id}</Link></td><td>{[item.listing.metal, item.listing.product, item.listing.grade].filter(Boolean).join(' / ')}</td><td><span className="pill">{item.listing.status || '-'}</span></td><td>{item.images?.length || 0}</td><td><span className={scoreClass(item.strategy.qualityScore)}>{item.strategy.qualityScore}</span></td><td>{item.strategy.missingDataWarnings.join(' ') || 'Needs admin verification'}</td></tr>)}{!summary.attentionListings.length && <tr><td colSpan={6}>No high-priority listing gaps found.</td></tr>}</tbody>
          </table></div>
        </section>

        <section className="listingStrategyGrid">
          <div className="sectionHead">
            <div>
              <h2>Strategy console</h2>
              <p className="muted">Listing-level strategy uses deterministic rules and available listing data only.</p>
            </div>
          </div>
          {summary.listingStrategies.slice(0, 24).map((strategy) => <StrategyBlock key={strategy.listingId} strategy={strategy} />)}
          {!summary.listingStrategies.length && <div className="panel"><p className="muted">No listings available for strategy generation yet.</p></div>}
        </section>
      </div>
    </main>
  );
}
