import Link from 'next/link';
import {
  tmisAdminSummary,
  tmisAllEntityRecords,
  tmisKnowledgeGraph,
  tmisProcurementChecklists,
  tmisReviewNote,
  tmisSources,
} from '@/data/tmis';
import TmisAdminShell from '@/components/tmis/TmisAdminShell';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

const statCards = [
  { label: 'Total materials', value: tmisAdminSummary.totalMaterials },
  { label: 'Total grades', value: tmisAdminSummary.totalGrades },
  { label: 'Total products', value: tmisAdminSummary.totalProducts },
  { label: 'Total quality records', value: tmisAdminSummary.totalQualityRecords },
  { label: 'Total source records', value: tmisAdminSummary.totalSourceRecords },
  { label: 'Knowledge graph relationships', value: tmisAdminSummary.totalKnowledgeGraphRelationships },
  { label: 'Items needing review', value: tmisAdminSummary.itemsNeedingReview },
  { label: 'Verified or Published', value: 0 },
];

const phaseCards = [
  {
    phase: 'Phase 1',
    title: 'Read-only seed data',
    description: 'Static TypeScript records for materials, grades, products, quality, sources, and graph relationships.',
  },
  {
    phase: 'Phase 2A',
    title: 'Review and edit placeholder workflow',
    description: 'Safe admin views, review cards, and disabled edit previews with no production database writes.',
  },
  {
    phase: 'Phase 2B',
    title: 'Database CRUD after approval',
    description: 'Approved create, update, and governance workflow can be connected after the data model is signed off.',
  },
  {
    phase: 'Phase 3',
    title: 'Publishing workflow',
    description: 'Manual publish/review gates can move approved records toward public pages without bypassing review.',
  },
  {
    phase: 'Phase 4',
    title: 'Marketplace automation',
    description: 'Supplier/buyer matching, RFQ enrichment, and marketplace automation can build on verified records later.',
  },
];

export default function TmisAdminDashboard() {
  return (
    <TmisAdminShell
      active="dashboard"
      title="Manufacturing intelligence review dashboard"
      description={tmisReviewNote}
    >
      <div className="grid cards4 tmisStatsGrid">
        {statCards.map((stat) => (
          <div className="card tmisStatCard" key={stat.label}>
            <b>{stat.value}</b>
            <p className="muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid cards2 tmisAdminSectionGap">
        <section className="panel tmisAdminPanel">
          <div className="sectionHead tmisPanelHead">
            <div>
              <span className="eyebrow">Verification status</span>
              <h2>Status summary</h2>
              <p className="muted">Phase 1 keeps every record out of Published and Verified states.</p>
            </div>
          </div>
          <div className="tableWrap tmisAdminTableWrap">
            <table className="tmisAdminTable tmisSummaryTable">
              <tbody>
                {tmisAdminSummary.verificationStatusSummary.map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    <td><b>{row.value}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel tmisAdminPanel">
          <div className="sectionHead tmisPanelHead">
            <div>
              <span className="eyebrow">Review boundary</span>
              <h2>Phase 1 controls</h2>
              <p className="muted">Read-only controls keep review separate from marketplace, payment, and logistics workflows.</p>
            </div>
          </div>
          <div className="listingMeta">
            <span className="pill gold">Draft only</span>
            <span className="pill">Needs Review</span>
            <span className="pill">Pending Verification</span>
            <span className="pill green">Static TypeScript seed</span>
          </div>
          <p className="muted">Content, source rows, and graph relationships are visible for review only. Nothing in TMIS Phase 1 is marked Published or Verified.</p>
          <div className="tmisActionGroup">
            <Link className="btn secondary" href="/admin/tmis/review">Open full review queue</Link>
            <Link className="btn secondary" href="/tmis/metals">Open Metal Intelligence Workspace</Link>
            <Link className="btn secondary" href="/admin/tmis/planning">Open Buyer & Seller Planning</Link>
          </div>
        </section>
      </div>

      <section className="panel tmisAdminPanel tmisAdminSectionGap">
        <div className="sectionHead tmisPanelHead">
          <div>
            <span className="eyebrow">TMIS roadmap</span>
            <h2>Safe admin operation phases</h2>
            <p className="muted">Phase 2A improves admin workflow only. It does not add publish, verify, delete, or production database-save behavior.</p>
          </div>
        </div>
        <div className="tmisPhaseGrid">
          {phaseCards.map((phase) => (
            <article className="tmisPhaseCard" key={phase.phase}>
              <span>{phase.phase}</span>
              <h3>{phase.title}</h3>
              <p>{phase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel tmisAdminPanel tmisAdminSectionGap">
        <div className="sectionHead tmisPanelHead">
          <div>
            <span className="eyebrow">Needs review</span>
            <h2>Priority review queue</h2>
            <p className="muted">High-level snapshot of draft records, source tracker rows, and graph relationships that need review.</p>
          </div>
        </div>
        <div className="tableWrap tmisAdminTableWrap">
          <table className="tmisAdminTable">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Status</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {tmisAllEntityRecords.slice(0, 6).map((item) => (
                <tr key={item.id}>
                  <td className="tmisPrimaryCell"><b>{item.name}</b><br /><small>{item.shortDescription}</small></td>
                  <td className="tmisCompactCell">{item.entityType}</td>
                  <td className="tmisStatusCell">
                    <TmisStatusBadges contentStatus={item.contentStatus} verificationStatus={item.verificationStatus} confidenceLevel={item.confidenceLevel} />
                  </td>
                  <td className="tmisSourceCell"><code>{item.sourceDocument}</code></td>
                </tr>
              ))}
              {tmisProcurementChecklists.map((item) => (
                <tr key={item.id}>
                  <td className="tmisPrimaryCell"><b>{item.name}</b><br /><small>{item.relatedProduct}</small></td>
                  <td className="tmisCompactCell">{item.entityType}</td>
                  <td className="tmisStatusCell">
                    <TmisStatusBadges contentStatus={item.contentStatus} verificationStatus={item.verificationStatus} confidenceLevel={item.confidenceLevel} />
                  </td>
                  <td className="tmisSourceCell"><code>{item.sourceDocument}</code></td>
                </tr>
              ))}
              <tr>
                <td className="tmisPrimaryCell"><b>{tmisSources.length} source tracker rows</b></td>
                <td className="tmisCompactCell">Source Tracker</td>
                <td className="tmisStatusCell"><span className="pill gold tmisBadge tmisBadgeDraft">Pending Verification</span></td>
                <td className="tmisSourceCell">03_Research_Tracker/TMIS_Source_Tracker.xlsx</td>
              </tr>
              <tr>
                <td className="tmisPrimaryCell"><b>{tmisKnowledgeGraph.length} knowledge graph relationships</b></td>
                <td className="tmisCompactCell">Knowledge Graph</td>
                <td className="tmisStatusCell"><span className="pill gold tmisBadge tmisBadgeDraft">Draft</span><span className="pill tmisBadge tmisBadgeReview">Needs Review</span></td>
                <td className="tmisSourceCell">02_Technical_Architecture/Knowledge_Graph/tmis_knowledge_graph_blueprint.md</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </TmisAdminShell>
  );
}
