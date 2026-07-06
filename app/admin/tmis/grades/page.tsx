import type { Metadata } from 'next';
import { tmisGrades } from '@/data/tmis';
import { TmisAdminEntityTable } from '@/components/tmis/TmisAdminTables';

export const metadata: Metadata = {
  title: 'Admin TMIS Grades',
  robots: { index: false, follow: false },
};

export default function AdminTmisGradesPage() {
  return (
    <TmisAdminEntityTable
      active="grades"
      title="TMIS grade records"
      description="Review draft material-grade records, equivalency notes, quality needs, and procurement cautions."
      rows={tmisGrades}
    />
  );
}
