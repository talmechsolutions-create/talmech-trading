import Link from 'next/link';
import type { TmisAdminRecord } from '@/data/tmis';
import TmisAdminShell from '@/components/tmis/TmisAdminShell';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

type TmisAdminEditPlaceholderProps = {
  record: TmisAdminRecord;
};

function PreviewField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <label className={multiline ? 'span2' : ''}>
      {label}
      {multiline ? (
        <textarea className="input tmisPreviewInput" value={value} readOnly />
      ) : (
        <input className="input tmisPreviewInput" value={value} readOnly />
      )}
    </label>
  );
}

export default function TmisAdminEditPlaceholder({ record }: TmisAdminEditPlaceholderProps) {
  return (
    <TmisAdminShell
      active={record.area}
      title={`Edit Placeholder: ${record.name}`}
      description="Phase 2A preview form. Database save is disabled and no production changes are made."
    >
      <section className="panel tmisAdminPanel">
        <div className="tmisDetailHero">
          <div>
            <span className="eyebrow">Phase 2A placeholder only</span>
            <h2>Preview fields before real CRUD approval</h2>
            <p className="muted">This form is intentionally non-destructive. It helps the admin team understand which fields will be editable in Phase 2B.</p>
            <TmisStatusBadges
              contentStatus={record.contentStatus}
              verificationStatus={record.verificationStatus}
              confidenceLevel={record.confidenceLevel}
            />
          </div>
          <div className="tmisDetailActions">
            <Link className="btn secondary" href={record.viewHref}>Back to view</Link>
            <Link className="btn" href={record.reviewHref}>Open review</Link>
          </div>
        </div>
      </section>

      <section className="panel tmisAdminPanel">
        <div className="notice tmisEditNotice">
          <b>Database save is disabled.</b>
          <p>No Prisma writes, production mutations, publish actions, verification actions, or delete actions run from this page.</p>
        </div>
        <form className="formGrid tmisPlaceholderForm">
          <PreviewField label="Name" value={record.name} />
          <PreviewField label="Slug / Admin key" value={record.slug || record.key} />
          <PreviewField label="Status" value={record.contentStatus || record.verificationStatus} />
          <PreviewField label="Confidence level" value={record.confidenceLevel} />
          <PreviewField label="Summary" value={record.summary} multiline />
          <PreviewField label="Verification notes" value={record.verificationNotes.join('\n')} multiline />
          <PreviewField label="Source references" value={record.sourceReference || record.sourceDocument} multiline />
          <PreviewField label="SEO title" value={record.seoTitle} />
          <PreviewField label="Meta description" value={record.metaDescription} multiline />
          <div className="span2 tmisDisabledActionRow">
            <button className="btn dark" type="button" disabled>Save disabled in Phase 2A</button>
            <span>Fields preview only. Phase 2B can add approved database CRUD later.</span>
          </div>
        </form>
      </section>
    </TmisAdminShell>
  );
}
