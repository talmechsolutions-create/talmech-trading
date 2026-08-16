import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  Field,
  IndustrialAccessDenied,
  IndustrialBadge,
  IndustrialEmptyState,
  IndustrialSchemaNotice,
  formatDate,
  formatIndustrialLabel,
  jsonList,
} from '@/components/industrial/IndustrialAdminComponents';
import { ADMIN_COOKIE } from '@/lib/adminSecurity';
import { getIndustrialCompanyDetail } from '@/lib/industrialIntelligenceService';
import { requireIndustrialPermissionForToken } from '@/lib/security/industrialPermissions';

export const metadata: Metadata = {
  title: 'Industrial Company Detail | Talmech Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function IndustrialCompanyDetailPage({ params }: { params: { id: string } }) {
  const access = requireIndustrialPermissionForToken(cookies().get(ADMIN_COOKIE)?.value, 'industrial_intelligence.view');
  if (!access.ok) return <IndustrialAccessDenied message={access.message} />;

  const result = await getIndustrialCompanyDetail(params.id);
  const company = result.data;
  if (result.schemaReady && !company) notFound();

  return (
    <main className="adminShell section">
      <div className="container industrialAdmin">
        <div className="industrialHeader">
          <div>
            <span className="eyebrow">Industrial Company</span>
            <h1 className="pageTitle">{company?.displayName || company?.canonicalName || 'Company record'}</h1>
            <p className="muted">Read-only master record with bounded plant, contact, capability, opportunity and source sections.</p>
          </div>
          <div className="industrialHeaderActions">
            <Link className="btn secondary" href="/admin/industrial-intelligence/companies">Companies</Link>
            <Link className="btn secondary" href="/admin/industrial-intelligence">Dashboard</Link>
          </div>
        </div>
        <IndustrialSchemaNotice schemaReady={result.schemaReady} />

        {!company ? (
          <IndustrialEmptyState title="Company data is not available yet." />
        ) : (
          <>
            <section className="panel">
              <div className="industrialPanelHead">
                <h2>Company overview</h2>
                <div className="industrialBadgeRow">
                  <IndustrialBadge value={company.verificationStatus} tone={company.verificationStatus === 'VERIFIED' ? 'green' : 'gold'} />
                  <IndustrialBadge value={company.priority} />
                </div>
              </div>
              <div className="industrialDetailGrid">
                <Field label="Canonical name" value={company.canonicalName} />
                <Field label="Legal name" value={company.legalName} />
                <Field label="Website" value={company.officialWebsite ? <a href={company.officialWebsite} rel="noreferrer" target="_blank">{company.officialWebsite}</a> : '-'} />
                <Field label="Domain" value={company.officialDomain} />
                <Field label="GSTIN" value={company.gstin} />
                <Field label="Industry" value={formatIndustrialLabel(company.industryCategory)} />
                <Field label="Subcategories" value={jsonList(company.subcategories)} />
                <Field label="Country" value={company.country} />
                <Field label="Region" value={company.region} />
                <Field label="State" value={company.state} />
                <Field label="City" value={company.city} />
                <Field label="Opportunity score" value={company.opportunityScore} />
                <Field label="Research status" value={company.researchStatus} />
                <Field label="Lifecycle" value={formatIndustrialLabel(company.lifecycleStatus)} />
                <Field label="Created" value={formatDate(company.createdAt)} />
                <Field label="Updated" value={formatDate(company.updatedAt)} />
              </div>
            </section>

            <section className="panel">
              <div className="industrialPanelHead"><h2>Plants</h2><span className="muted">{company._count.plants} total, showing latest 25</span></div>
              {company.plants.length ? (
                <div className="tableWrap"><table><thead><tr><th>Plant</th><th>State</th><th>City</th><th>Cluster</th><th>Plant Type</th><th>Capacity / Scale</th><th>Verification</th><th>Actions</th></tr></thead><tbody>
                  {company.plants.map((plant) => (
                    <tr key={plant.id}><td><b>{plant.plantName}</b></td><td>{plant.state || '-'}</td><td>{plant.city || '-'}</td><td>{plant.industrialCluster || plant.industrialArea || '-'}</td><td>{plant.plantType || '-'}</td><td>{plant.capacityScale || '-'}</td><td>{formatIndustrialLabel(plant.verificationStatus)}</td><td><Link className="btn secondary" href={`/admin/industrial-intelligence/plants/${plant.id}`}>View Plant</Link></td></tr>
                  ))}
                </tbody></table></div>
              ) : <p className="muted">No plants are linked to this company yet.</p>}
            </section>

            <section className="panel">
              <div className="industrialPanelHead"><h2>Contacts</h2><span className="muted">{company._count.contacts} total, showing latest 25</span></div>
              {company.contacts.length ? (
                <div className="tableWrap"><table><thead><tr><th>Person</th><th>Designation</th><th>Department</th><th>Plant</th><th>Phone</th><th>Email</th><th>Verification</th></tr></thead><tbody>
                  {company.contacts.map((contact) => (
                    <tr key={contact.id}><td><b>{contact.personName || '-'}</b></td><td>{contact.designation || '-'}</td><td>{contact.department || '-'}</td><td>{contact.plant?.plantName || 'Company level'}</td><td>{contact.phone || '-'}</td><td>{contact.email || '-'}</td><td>{formatIndustrialLabel(contact.verificationStatus)}</td></tr>
                  ))}
                </tbody></table></div>
              ) : <p className="muted">No admin-only contacts are linked to this company yet.</p>}
            </section>

            <section className="industrialTwoColumn">
              <div className="panel">
                <div className="industrialPanelHead"><h2>Capabilities / processes</h2><span className="muted">{company._count.capabilities} total</span></div>
                {company.capabilities.length ? <div className="industrialMetricList">{company.capabilities.map((item) => <p key={item.id}><b>{item.processName || item.capabilityType}</b><span>{[item.product, item.material, item.capacityText].filter(Boolean).join(' | ') || formatIndustrialLabel(item.verificationStatus)}</span></p>)}</div> : <p className="muted">No capabilities have been recorded yet.</p>}
              </div>
              <div className="panel">
                <div className="industrialPanelHead"><h2>Service opportunities</h2><span className="muted">{company._count.serviceOpportunities} total</span></div>
                {company.serviceOpportunities.length ? <div className="industrialMetricList">{company.serviceOpportunities.map((item) => <p key={item.id}><b>{formatIndustrialLabel(item.serviceType)}</b><span>{item.fitLevel} | score {item.score} | {formatIndustrialLabel(item.status)}</span></p>)}</div> : <p className="muted">No service opportunities have been recorded yet.</p>}
              </div>
            </section>

            <section className="panel">
              <div className="industrialPanelHead"><h2>Sources / verification</h2><span className="muted">{company._count.sources} total, showing latest 25</span></div>
              {company.sources.length ? (
                <div className="tableWrap"><table><thead><tr><th>Type</th><th>Source</th><th>Level</th><th>Evidence</th><th>Research date</th><th>Notes</th></tr></thead><tbody>
                  {company.sources.map((source) => (
                    <tr key={source.id}><td>{formatIndustrialLabel(source.sourceType)}</td><td>{source.sourceUrl ? <a href={source.sourceUrl} rel="noreferrer" target="_blank">{source.sourceTitle || source.sourceUrl}</a> : source.sourceTitle || '-'}</td><td>{formatIndustrialLabel(source.verificationLevel)}</td><td>{source.verificationSource ? 'Verification evidence' : 'Discovery source'}</td><td>{formatDate(source.researchDate || source.capturedAt)}</td><td>{source.notes || '-'}</td></tr>
                  ))}
                </tbody></table></div>
              ) : <p className="muted">No discovery sources or verification evidence are linked yet.</p>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
