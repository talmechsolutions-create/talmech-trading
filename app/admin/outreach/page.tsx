import type { Metadata } from 'next';
import OutreachCrm from '@/components/OutreachCrm';
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
  const prospects = await listOutreachProspects();

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
