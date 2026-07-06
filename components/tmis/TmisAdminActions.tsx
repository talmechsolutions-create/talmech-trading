import Link from 'next/link';
import type { TmisAdminRecord } from '@/data/tmis';

type TmisAdminActionsProps = {
  record: Pick<TmisAdminRecord, 'viewHref' | 'reviewHref' | 'editHref'>;
};

export default function TmisAdminActions({ record }: TmisAdminActionsProps) {
  return (
    <div className="tmisActionGroup" aria-label="TMIS admin actions">
      <Link className="tmisActionLink" href={record.viewHref}>View</Link>
      <Link className="tmisActionLink review" href={record.reviewHref}>Review</Link>
      <Link className="tmisActionLink placeholder" href={record.editHref}>Edit Placeholder</Link>
    </div>
  );
}
