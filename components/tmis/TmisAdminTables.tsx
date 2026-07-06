import Link from 'next/link';
import {
  findTmisAdminEntityRecordById,
  tmisAllEntityRecords,
  tmisKnowledgeGraph,
  tmisKnowledgeGraphAdminRecord,
  tmisProcurementChecklists,
  tmisReviewQueueItems,
  tmisSourceAdminRecords,
  tmisSources,
} from '@/data/tmis';
import type { TmisEntity } from '@/data/tmis';
import TmisAdminActions from '@/components/tmis/TmisAdminActions';
import TmisAdminShell, { type TmisAdminKey } from '@/components/tmis/TmisAdminShell';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

type EntityTableProps = {
  active: TmisAdminKey;
  title: string;
  description: string;
  rows: TmisEntity[];
};

export function TmisAdminEntityTable({ active, title, description, rows }: EntityTableProps) {
  return (
    <TmisAdminShell active={active} title={title} description={description}>
      <section className="panel tmisAdminPanel">
        <div className="sectionHead tmisPanelHead">
          <div>
            <span className="eyebrow">Read-only seed table</span>
            <h2>{rows.length} records</h2>
            <p className="muted">No destructive delete actions are available in TMIS Phase 1.</p>
          </div>
        </div>
        <div className="tableWrap tmisAdminTableWrap">
          <table className="tmisAdminTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Parent / Category</th>
                <th>Status</th>
                <th>Source document</th>
                <th>Primary keyword</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const adminRecord = findTmisAdminEntityRecordById(row.id);
                return (
                  <tr key={row.id}>
                    <td className="tmisPrimaryCell"><b>{row.name}</b><br /><small>{row.shortDescription}</small></td>
                    <td className="tmisCompactCell">{row.entityType}</td>
                    <td className="tmisMediumCell">{[row.parent, row.category].filter(Boolean).join(' / ') || '-'}</td>
                    <td className="tmisStatusCell">
                      <TmisStatusBadges
                        contentStatus={row.contentStatus}
                        verificationStatus={row.verificationStatus}
                        confidenceLevel={row.confidenceLevel}
                      />
                    </td>
                    <td className="tmisSourceCell"><code>{row.sourceDocument}</code></td>
                    <td className="tmisMediumCell">{row.primaryKeyword}</td>
                    <td className="tmisActionCell">{adminRecord ? <TmisAdminActions record={adminRecord} /> : 'Pending route'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </TmisAdminShell>
  );
}

export function TmisAdminSourcesTable() {
  return (
    <TmisAdminShell
      active="sources"
      title="TMIS source tracker"
      description="Source records remain Pending Verification until owner review confirms source authority, evidence quality, and scope."
    >
      <section className="panel tmisAdminPanel">
        <div className="sectionHead tmisPanelHead">
          <div>
            <span className="eyebrow">Reference-only source tracker</span>
            <h2>{tmisSources.length} source rows</h2>
            <p className="muted">Each source row stays pending until the evidence and supported fact are reviewed.</p>
          </div>
        </div>
        <div className="tableWrap tmisAdminTableWrap">
          <table className="tmisAdminTable">
            <thead>
              <tr>
                <th>Source ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Entity</th>
                <th>Fact supported</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tmisSources.map((row) => {
                const adminRecord = tmisSourceAdminRecords.find((record) => record.source?.sourceId === row.sourceId);
                return (
                  <tr key={row.sourceId}>
                    <td className="tmisCompactCell"><b>{row.sourceId}</b></td>
                    <td className="tmisPrimaryCell">{row.title}</td>
                    <td className="tmisMediumCell">{row.sourceType}</td>
                    <td className="tmisCompactCell">{row.entityName}</td>
                    <td className="tmisMediumCell">{row.factSupported}</td>
                    <td className="tmisStatusCell"><span className="pill gold tmisBadge tmisBadgeDraft">{row.verificationStatus}</span><span className="pill green tmisBadge tmisBadgeConfidence">{row.confidenceLevel} confidence</span></td>
                    <td className="tmisNotesCell">{row.notes}</td>
                    <td className="tmisActionCell">{adminRecord ? <TmisAdminActions record={adminRecord} /> : 'Pending route'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </TmisAdminShell>
  );
}

export function TmisAdminKnowledgeGraphTable() {
  return (
    <TmisAdminShell
      active="knowledge-graph"
      title="TMIS knowledge graph review"
      description="Draft relationships are review aids for search and retrieval. They are not final technical equivalency or suitability claims."
    >
      <section className="panel tmisAdminPanel">
        <div className="sectionHead tmisPanelHead">
          <div>
            <span className="eyebrow">Draft graph relationships</span>
            <h2>{tmisKnowledgeGraph.length} relationships</h2>
            <p className="muted">Subject, relationship, object, and notes are separated for quick relationship review.</p>
          </div>
        </div>
        <div className="tableWrap tmisAdminTableWrap">
          <table className="tmisAdminTable tmisGraphTable">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Relationship</th>
                <th>Object</th>
                <th>Confidence</th>
                <th>Source</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tmisKnowledgeGraph.map((row, index) => (
                <tr key={`${row.subject}-${row.relationship}-${row.object}-${index}`}>
                  <td className="tmisGraphEntity"><b>{row.subject}</b></td>
                  <td className="tmisRelationshipCell">{row.relationship}</td>
                  <td className="tmisGraphEntity">{row.object}</td>
                  <td className="tmisStatusCell"><span className="pill green tmisBadge tmisBadgeConfidence">{row.confidenceLevel} confidence</span></td>
                  <td className="tmisCompactCell">{row.sourceReference}</td>
                  <td className="tmisNotesCell">{row.notes || 'Needs relationship review before verification.'}</td>
                  <td className="tmisActionCell"><TmisAdminActions record={tmisKnowledgeGraphAdminRecord} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </TmisAdminShell>
  );
}

export function TmisAdminReviewQueue() {
  return (
    <TmisAdminShell
      active="review"
      title="TMIS review queue"
      description="All Phase 1 TMIS records are intentionally Draft, Needs Review, or Pending Verification."
    >
      <section className="panel tmisAdminPanel">
        <div className="sectionHead tmisPanelHead">
          <div>
            <span className="eyebrow">Phase 2A review workflow</span>
            <h2>{tmisReviewQueueItems.length} review items</h2>
            <p className="muted">This queue is intentionally read-only and keeps every item in Draft, Needs Review, or Pending Verification.</p>
          </div>
        </div>
        <div className="tmisReviewGrid">
          {tmisReviewQueueItems.map((item) => (
            <article className="tmisReviewCard" key={item.key}>
              <div>
                <span className="eyebrow">{item.entityType}</span>
                <h3>{item.name}</h3>
                <p>{item.reasonReviewNeeded}</p>
              </div>
              <TmisStatusBadges
                contentStatus={item.contentStatus}
                verificationStatus={item.verificationStatus}
                confidenceLevel={item.confidenceLevel}
              />
              <div className="tmisReviewMeta">
                <span><b>Source</b>{item.sourceReference}</span>
                <span><b>Next action</b>{item.nextReviewAction}</span>
              </div>
              <Link className="btn secondary" href={item.reviewHref}>Open review</Link>
            </article>
          ))}
        </div>
      </section>
    </TmisAdminShell>
  );
}
