import Link from 'next/link';
import type { TmisAdminRecord } from '@/data/tmis';
import TmisAdminShell from '@/components/tmis/TmisAdminShell';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

type TmisAdminRecordDetailProps = {
  record: TmisAdminRecord;
};

function FieldTable({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return <p className="muted">No fields available for this Phase 2A preview.</p>;
  return (
    <div className="tableWrap tmisAdminTableWrap">
      <table className="tmisAdminTable tmisSummaryTable">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TmisAdminRecordDetail({ record }: TmisAdminRecordDetailProps) {
  return (
    <TmisAdminShell
      active={record.area}
      title={record.name}
      description="Phase 2A record view. This page supports review operations only and does not publish, verify, delete, or save production data."
    >
      <section className="panel tmisAdminPanel">
        <div className="tmisDetailHero">
          <div>
            <span className="eyebrow">{record.entityType}</span>
            <h2>{record.name}</h2>
            <p className="muted">{record.summary}</p>
            <TmisStatusBadges
              contentStatus={record.contentStatus}
              verificationStatus={record.verificationStatus}
              confidenceLevel={record.confidenceLevel}
            />
          </div>
          <div className="tmisDetailActions">
            <Link className="btn" href={record.reviewHref}>Open review</Link>
            <Link className="btn secondary" href={record.editHref}>Edit Placeholder</Link>
          </div>
        </div>
      </section>

      <section className="grid cards2">
        <article className="panel tmisAdminPanel">
          <div className="tmisPanelHead">
            <span className="eyebrow">Record metadata</span>
            <h2>Status and source</h2>
            <p className="muted">All values are read-only Phase 2A preview fields.</p>
          </div>
          <FieldTable
            rows={[
              { label: 'Entity type', value: record.entityType },
              { label: 'Content status', value: record.contentStatus || 'Draft reference item' },
              { label: 'Verification status', value: record.verificationStatus },
              { label: 'Confidence level', value: record.confidenceLevel },
              { label: 'Source document', value: record.sourceDocument },
              { label: 'Primary keyword', value: record.primaryKeyword },
              { label: 'SEO title', value: record.seoTitle },
              { label: 'Meta description', value: record.metaDescription },
            ]}
          />
        </article>

        <article className="panel tmisAdminPanel">
          <div className="tmisPanelHead">
            <span className="eyebrow">Next review action</span>
            <h2>What to check next</h2>
            <p className="muted">{record.reasonReviewNeeded}</p>
          </div>
          <div className="tmisNextActionBox">
            <b>{record.nextReviewAction}</b>
            <p>No Verified, Published, or production-save action is available in Phase 2A.</p>
          </div>
        </article>
      </section>

      <section className="panel tmisAdminPanel">
        <div className="tmisPanelHead">
          <span className="eyebrow">Database fields</span>
          <h2>Preview fields</h2>
          <p className="muted">These fields are seeded TypeScript values only. Database writes remain disabled.</p>
        </div>
        <FieldTable rows={record.fields} />
      </section>

      <section className="panel tmisAdminPanel">
        <div className="tmisPanelHead">
          <span className="eyebrow">Knowledge graph relationships</span>
          <h2>{record.graphEdges.length} related relationships</h2>
          <p className="muted">Graph edges remain draft review aids and are not final technical claims.</p>
        </div>
        {record.graphEdges.length ? (
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
                </tr>
              </thead>
              <tbody>
                {record.graphEdges.map((edge, index) => (
                  <tr key={`${edge.subject}-${edge.relationship}-${edge.object}-${index}`}>
                    <td className="tmisGraphEntity"><b>{edge.subject}</b></td>
                    <td className="tmisRelationshipCell">{edge.relationship}</td>
                    <td className="tmisGraphEntity">{edge.object}</td>
                    <td className="tmisStatusCell"><span className="pill green tmisBadge tmisBadgeConfidence">{edge.confidenceLevel} confidence</span></td>
                    <td className="tmisCompactCell">{edge.sourceReference}</td>
                    <td className="tmisNotesCell">{edge.notes || 'Needs relationship review before verification.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No graph relationships are mapped to this item yet.</p>}
      </section>

      <section className="grid cards2">
        <article className="panel tmisAdminPanel">
          <div className="tmisPanelHead">
            <span className="eyebrow">Source references</span>
            <h2>{record.sourceReferences.length} source references</h2>
          </div>
          {record.sourceReferences.length ? (
            <div className="tableWrap tmisAdminTableWrap">
              <table className="tmisAdminTable">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Fact supported</th>
                  </tr>
                </thead>
                <tbody>
                  {record.sourceReferences.map((source) => (
                    <tr key={source.sourceId}>
                      <td className="tmisCompactCell"><b>{source.sourceId}</b></td>
                      <td className="tmisPrimaryCell">{source.title}</td>
                      <td className="tmisStatusCell"><span className="pill gold tmisBadge tmisBadgeDraft">{source.verificationStatus}</span></td>
                      <td className="tmisNotesCell">{source.factSupported}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No source rows are mapped yet.</p>}
        </article>

        <article className="panel tmisAdminPanel">
          <div className="tmisPanelHead">
            <span className="eyebrow">Verification notes</span>
            <h2>Review checklist</h2>
          </div>
          <ul className="tmisCheckList">
            {record.verificationNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
          <div className="tmisPanelHead tmisSubPanelHead">
            <span className="eyebrow">Originality check</span>
            <h2>Content boundary</h2>
          </div>
          <ul className="tmisCheckList">
            {record.originalityCheck.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>
    </TmisAdminShell>
  );
}
