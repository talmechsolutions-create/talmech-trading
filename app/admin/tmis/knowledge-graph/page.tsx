import type { Metadata } from 'next';
import { TmisAdminKnowledgeGraphTable } from '@/components/tmis/TmisAdminTables';

export const metadata: Metadata = {
  title: 'Admin TMIS Knowledge Graph',
  robots: { index: false, follow: false },
};

export default function AdminTmisKnowledgeGraphPage() {
  return <TmisAdminKnowledgeGraphTable />;
}
