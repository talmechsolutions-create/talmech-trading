import type { Metadata } from 'next';
import AdminDataLoadError from '@/components/AdminDataLoadError';
import OutreachCrm from '@/components/OutreachCrm';
import { loadAdminData } from '@/lib/adminSsr';
import { listOutreachProspects } from '@/lib/outreachStore';
import {
  outreachBusinessTypes,
  outreachConsentStatuses,
  outreachIndustryTags,
  outreachSources,
  outreachStatuses,
  outreachTemplates,
} from '@/lib/outreachTemplates';
import { getStorageMode } from '@/lib/storageMode';

export const metadata: Metadata = {
  title: 'Prospect Outreach CRM | Talmech Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminOutreachPage() {
  const { data: prospects, error } = await loadAdminData('/admin/outreach', () => listOutreachProspects(), []);
  if (error) return <AdminDataLoadError title="Prospect Outreach CRM" route="/admin/outreach" error={error} />;

  return (
    <OutreachCrm
      initialProspects={prospects}
      businessTypes={outreachBusinessTypes}
      consentStatuses={outreachConsentStatuses}
      industryTags={outreachIndustryTags}
      sources={outreachSources}
      statuses={outreachStatuses}
      templates={outreachTemplates}
      storageMode={getStorageMode()}
    />
  );
}
