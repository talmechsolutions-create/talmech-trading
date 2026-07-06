import Link from 'next/link';
import type { TmisAdminRecord } from '@/data/tmis';
import TmisAdminShell from '@/components/tmis/TmisAdminShell';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

type TmisAdminReviewDetailProps = {
  record: TmisAdminRecord;
};

const reviewSteps = [
  'Confirm the source reference and evidence quality.',
  'Check technical, procurement, certificate, and marketplace wording for unverified claims.',
  'Review SEO fields and ensure they do not imply publication or verification.',
  'Confirm originality and that no paid standards or supplier copy is embedded.',
  'Decide whether the item is ready for Phase 2B data modeling or needs more source work.',
];

export default function TmisAdminReviewDetail({ record }: TmisAdminReviewDetailProps) {
  return (
    <TmisAdminShell
      active="review"
      title={`Review: ${record.name}`}
      description="Phase 2A review workspace. This page records what needs review but does not verify, publish, save, or delete records."
    >
      <section className="panel tmisAdminPanel">
        <div className="tmisDetailHero">
          <div>
            <span className="eyebrow">{record.entityType}</span>
            <h2>{record.name}</h2>
            <p className="muted">{record.reasonReviewNeeded}</p>
            <TmisStatusBadges
              contentStatus={record.contentStatus}
              verificationStatus={record.verificationStatus}
              confidenceLevel={record.confidenceLevel}
            />
          </div>
          <div className="tmisDetailActions">
            <Link className="btn" href={record.viewHref}>View record</Link>
            <Link className="btn secondary" href={record.editHref}>Edit Placeholder</Link>
          </div>
        </div>
      </section>

      <section className="grid cards2">
        <article className="panel tmisAdminPanel">
          <div className="tmisPanelHead">
            <span className="eyebrow">Review plan</span>
            <h2>Next action</h2>
            <p className="muted">{record.nextReviewAction}</p>
          </div>
          <ul className="tmisCheckList">
            {reviewSteps.map((step) => <li key={step}>{step}</li>)}
          </ul>
        </article>

        <article className="panel tmisAdminPanel">
          <div className="tmisPanelHead">
            <span className="eyebrow">Phase 2A guardrails</span>
            <h2>No production mutation</h2>
            <p className="muted">Reviewers can inspect and prepare feedback only. Final states remain Draft, Needs Review, or Pending Verification.</p>
          </div>
          <div className="listingMeta">
            <span className="pill gold tmisBadge tmisBadgeDraft">No publish action</span>
            <span className="pill tmisBadge tmisBadgeReview">No verification action</span>
            <span className="pill green tmisBadge tmisBadgeConfidence">No database write</span>
          </div>
        </article>
      </section>

      <section className="panel tmisAdminPanel">
        <div className="tmisPanelHead">
          <span className="eyebrow">Record summary</span>
          <h2>Evidence and review context</h2>
        </div>
        <div className="tableWrap tmisAdminTableWrap">
          <table className="tmisAdminTable tmisSummaryTable">
            <tbody>
              <tr><th>Type</th><td>{record.entityType}</td></tr>
              <tr><th>Status</th><td>{record.contentStatus || record.verificationStatus}</td></tr>
              <tr><th>Confidence</th><td>{record.confidenceLevel}</td></tr>
              <tr><th>Source reference</th><td>{record.sourceReference}</td></tr>
              <tr><th>Source document</th><td>{record.sourceDocument}</td></tr>
              <tr><th>Review reason</th><td>{record.reasonReviewNeeded}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </TmisAdminShell>
  );
}
