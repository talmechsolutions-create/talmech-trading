import Link from 'next/link';
import {
  tmisAdminSummary,
  tmisGrades,
  tmisKnowledgeGraph,
  tmisMetalRecords,
  tmisMaterials,
  tmisProducts,
  tmisQualityRecords,
  tmisReviewNote,
  tmisSources,
} from '@/data/tmis';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

const featureLinks = [
  { title: 'Metal Intelligence Workspace', href: '/tmis/metals', desc: 'Business-friendly metal profiles for buyer, seller, quality, RFQ and marketplace planning.' },
  { title: 'Buyer & Seller Planning', href: '/tmis/planning', desc: 'Phase 3A target planning for buyers, sellers, metals, grades, product forms and opportunities.' },
  { title: 'Materials', href: '/materials', desc: 'Material-family records and review status.' },
  { title: 'Steel', href: '/materials/steel', desc: 'Draft steel material-family intelligence.' },
  { title: 'EN24', href: '/grades/en24', desc: 'Grade, quality, procurement, and risk notes.' },
  { title: 'EN24 Round Bar', href: '/products/en24-round-bar', desc: 'Buyer specification and marketplace guidance.' },
  { title: 'Hardness Testing', href: '/quality/hardness-testing', desc: 'Draft quality-test record.' },
  { title: 'Material Test Certificate', href: '/quality/material-test-certificate', desc: 'Draft certificate review record.' },
  { title: 'Marketplace Draft', href: '/marketplace/en24-round-bar', desc: 'RFQ-led listing record for EN24 Round Bar.' },
  { title: 'EN24 RFQ', href: '/rfq/en24-round-bar', desc: 'Buyer RFQ checklist linked to the existing Talmech form.' },
];

export default function TmisHomePage() {
  return (
    <main>
      <section className="productHero section">
        <div className="container productHeroGrid">
          <div>
            <span className="eyebrow">Talmech Manufacturing Intelligence System</span>
            <h1 className="pageTitle">Draft manufacturing intelligence for materials, grades, products, quality and RFQs.</h1>
            <p className="muted">
              TMIS Phase 1 organizes pilot manufacturing knowledge into searchable, database-ready records.
              Every technical record remains Draft, Needs Review, and Pending Verification until owner review is complete.
            </p>
            <TmisStatusBadges contentStatus="Draft" verificationStatus="Needs Review" confidenceLevel="Medium" />
            <div className="row" style={{ justifyContent: 'flex-start', marginTop: 18 }}>
              <Link className="btn" href="/materials">Explore materials</Link>
              <Link className="btn secondary" href="/tmis/metals">Open Metal Intelligence Workspace</Link>
              <Link className="btn secondary" href="/tmis/planning">Open Buyer & Seller Planning</Link>
              <Link className="btn secondary" href="/rfq/en24-round-bar">Build EN24 RFQ</Link>
              <Link className="btn dark" href="/admin/tmis">Review in admin</Link>
            </div>
          </div>
          <aside className="panel">
            <b>Phase 1 review boundary</b>
            <p className="muted">{tmisReviewNote}</p>
            <div className="listingMeta">
              <span className="pill gold">No Published records</span>
              <span className="pill">No Verified records</span>
              <span className="pill green">{tmisAdminSummary.itemsNeedingReview} review items</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid cards4">
            <div className="card"><b>{tmisMaterials.length}</b><p className="muted">material records</p></div>
            <div className="card"><b>{tmisMetalRecords.length}</b><p className="muted">metal intelligence profiles</p></div>
            <div className="card"><b>{tmisGrades.length}</b><p className="muted">grade records</p></div>
            <div className="card"><b>{tmisProducts.length}</b><p className="muted">product records</p></div>
            <div className="card"><b>{tmisQualityRecords.length}</b><p className="muted">quality records</p></div>
          </div>
        </div>
      </section>

      <section className="section productHubSection">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Pilot records</span>
              <h2 className="pageTitle">Start with the EN24 and steel pilot set.</h2>
              <p className="muted">These pages connect public education, marketplace discovery, RFQ preparation, source tracking and admin review.</p>
            </div>
          </div>
          <div className="grid cards4">
            {featureLinks.map((link) => (
              <Link className="card" href={link.href} key={link.href}>
                <h3>{link.title}</h3>
                <p className="muted">{link.desc}</p>
                <span className="btn secondary">Open</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid cards2">
            <article className="panel">
              <span className="eyebrow">Source tracker</span>
              <h2>{tmisSources.length} source rows prepared for review</h2>
              <p className="muted">Source records are shown in the TMIS admin section and remain pending until owner review.</p>
              <Link className="btn secondary" href="/admin/tmis/sources">Open sources</Link>
            </article>
            <article className="panel">
              <span className="eyebrow">Knowledge graph</span>
              <h2>{tmisKnowledgeGraph.length} draft entity relationships</h2>
              <p className="muted">Graph edges support search and future retrieval. Equivalency and technical assertions remain conditional.</p>
              <Link className="btn secondary" href="/admin/tmis/knowledge-graph">Open graph review</Link>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
