import type { Metadata } from 'next';
import Link from 'next/link';
import {
  tmisGrades,
  tmisKnowledgeGraph,
  tmisMaterials,
  tmisProducts,
  tmisQualityRecords,
  tmisReviewNote,
  tmisSources,
} from '@/lib/tmisData';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

export const metadata: Metadata = {
  title: 'TMIS Manufacturing Intelligence | Draft Materials, Grades and Quality Records',
  description:
    'Talmech Manufacturing Intelligence System Phase 1 with draft material, grade, product, quality, RFQ, source, and knowledge graph records marked needs review.',
  alternates: { canonical: '/manufacturing-intelligence' },
};

const featureLinks = [
  { title: 'Materials', href: '/manufacturing-intelligence/materials', desc: 'Material-family records and review status.' },
  { title: 'Steel', href: '/manufacturing-intelligence/materials/steel', desc: 'Draft steel material-family intelligence.' },
  { title: 'EN24', href: '/manufacturing-intelligence/grades/en24', desc: 'Grade, quality, procurement, and risk notes.' },
  { title: 'EN24 Round Bar', href: '/manufacturing-intelligence/products/en24-round-bar', desc: 'Buyer specification and marketplace guidance.' },
  { title: 'Hardness Testing', href: '/manufacturing-intelligence/quality/hardness-testing', desc: 'Draft quality-test record.' },
  { title: 'Material Test Certificate', href: '/manufacturing-intelligence/quality/material-test-certificate', desc: 'Draft certificate review record.' },
  { title: 'EN24 RFQ', href: '/manufacturing-intelligence/rfq/en24-round-bar', desc: 'Buyer RFQ checklist linked to existing Talmech form.' },
];

export default function ManufacturingIntelligencePage() {
  return (
    <main>
      <section className="homeHeroPro">
        <div className="container homeHeroGrid">
          <div className="homeHeroCopy">
            <span className="eyebrow">Talmech Manufacturing Intelligence System</span>
            <h1>Structured industrial intelligence for materials, grades, products, quality and RFQs.</h1>
            <p>
              TMIS Phase 1 organizes pilot manufacturing knowledge into searchable, database-ready records. Every technical record is intentionally marked Draft, Needs Review, and Medium or Unknown confidence until source review is complete.
            </p>
            <div className="heroActionRow">
              <Link className="btn" href="/manufacturing-intelligence/materials">Explore materials</Link>
              <Link className="btn secondary" href="/manufacturing-intelligence/rfq/en24-round-bar">Build EN24 RFQ</Link>
              <Link className="btn dark" href="/public-marketplace?product=EN24%20Round%20Bar&metal=steel">Search marketplace</Link>
            </div>
          </div>
          <aside className="heroFloatPanel" style={{ position: 'static' }}>
            <b>Phase 1 review boundary</b>
            <span>{tmisReviewNote}</span>
            <TmisStatusBadges contentStatus="Draft" verificationStatus="Needs Review" confidenceLevel="Medium" />
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid cards4">
            <div className="card"><b>{tmisMaterials.length}</b><p className="muted">material records</p></div>
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
          <div className="grid cards3">
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
            </article>
            <article className="panel">
              <span className="eyebrow">Knowledge graph</span>
              <h2>{tmisKnowledgeGraph.length} draft entity relationships</h2>
              <p className="muted">Graph edges support search and future retrieval. Equivalency and technical assertions remain conditional.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
