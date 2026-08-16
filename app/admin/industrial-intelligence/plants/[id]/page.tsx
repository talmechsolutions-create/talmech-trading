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
} from '@/components/industrial/IndustrialAdminComponents';
import { ADMIN_COOKIE } from '@/lib/adminSecurity';
import { getIndustrialPlantDetail } from '@/lib/industrialIntelligenceService';
import { requireIndustrialPermissionForToken } from '@/lib/security/industrialPermissions';

export const metadata: Metadata = {
  title: 'Industrial Plant Detail | Talmech Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function IndustrialPlantDetailPage({ params }: { params: { id: string } }) {
  const access = requireIndustrialPermissionForToken(cookies().get(ADMIN_COOKIE)?.value, 'industrial_intelligence.view');
  if (!access.ok) return <IndustrialAccessDenied message={access.message} />;

  const result = await getIndustrialPlantDetail(params.id);
  const plant = result.data;
  if (result.schemaReady && !plant) notFound();

  return (
    <main className="adminShell section">
      <div className="container industrialAdmin">
        <div className="industrialHeader">
          <div>
            <span className="eyebrow">Industrial Plant</span>
            <h1 className="pageTitle">{plant?.plantName || 'Plant record'}</h1>
            <p className="muted">Read-only facility view for location, contacts, capabilities, opportunities and source evidence.</p>
          </div>
          <div className="industrialHeaderActions">
            <Link className="btn secondary" href="/admin/industrial-intelligence/companies">Companies</Link>
            {plant?.company ? <Link className="btn secondary" href={`/admin/industrial-intelligence/companies/${plant.company.id}`}>Parent Company</Link> : null}
          </div>
        </div>
        <IndustrialSchemaNotice schemaReady={result.schemaReady} />

        {!plant ? (
          <IndustrialEmptyState title="Plant data is not available yet." />
        ) : (
          <>
            <section className="panel">
              <div className="industrialPanelHead">
                <h2>Plant overview</h2>
                <div className="industrialBadgeRow">
                  <IndustrialBadge value={plant.verificationStatus} tone={plant.verificationStatus === 'VERIFIED' ? 'green' : 'gold'} />
                  <IndustrialBadge value={plant.company.priority} />
                </div>
              </div>
              <div className="industrialDetailGrid">
                <Field label="Parent company" value={<Link href={`/admin/industrial-intelligence/companies/${plant.company.id}`}>{plant.company.canonicalName}</Link>} />
                <Field label="Plant / unit name" value={plant.plantName} />
                <Field label="Plant code" value={plant.plantCode} />
                <Field label="Region" value={plant.region} />
                <Field label="State" value={plant.state} />
                <Field label="District" value={plant.district} />
                <Field label="City" value={plant.city} />
                <Field label="Industrial cluster" value={plant.industrialCluster} />
                <Field label="Industrial area" value={plant.industrialArea} />
                <Field label="Address" value={plant.address} />
                <Field label="PIN" value={plant.pincode} />
                <Field label="Coordinates" value={plant.latitude && plant.longitude ? `${plant.latitude}, ${plant.longitude}` : '-'} />
                <Field label="Plant type" value={plant.plantType} />
                <Field label="Capacity" value={plant.capacityScale} />
                <Field label="Lifecycle" value={formatIndustrialLabel(plant.lifecycleStatus)} />
                <Field label="Opportunity score" value={plant.opportunityScore} />
                <Field label="Updated" value={formatDate(plant.updatedAt)} />
              </div>
            </section>

            <section className="panel">
              <div className="industrialPanelHead"><h2>Plant contacts</h2><span className="muted">{plant._count.contacts} total, showing latest 25</span></div>
              {plant.contacts.length ? (
                <div className="tableWrap"><table><thead><tr><th>Person</th><th>Designation</th><th>Department</th><th>Phone</th><th>Email</th><th>Verification</th></tr></thead><tbody>
                  {plant.contacts.map((contact) => (
                    <tr key={contact.id}><td><b>{contact.personName || '-'}</b></td><td>{contact.designation || '-'}</td><td>{contact.department || '-'}</td><td>{contact.phone || '-'}</td><td>{contact.email || '-'}</td><td>{formatIndustrialLabel(contact.verificationStatus)}</td></tr>
                  ))}
                </tbody></table></div>
              ) : <p className="muted">No plant-specific contacts are linked yet.</p>}
            </section>

            <section className="industrialTwoColumn">
              <div className="panel">
                <div className="industrialPanelHead"><h2>Processes / capabilities</h2><span className="muted">{plant._count.capabilities} total</span></div>
                {plant.capabilities.length ? <div className="industrialMetricList">{plant.capabilities.map((item) => <p key={item.id}><b>{item.processName || item.capabilityType}</b><span>{[item.product, item.material, item.capacityText].filter(Boolean).join(' | ') || formatIndustrialLabel(item.verificationStatus)}</span></p>)}</div> : <p className="muted">No plant capabilities have been recorded yet.</p>}
              </div>
              <div className="panel">
                <div className="industrialPanelHead"><h2>Service opportunities</h2><span className="muted">{plant._count.serviceOpportunities} total</span></div>
                {plant.serviceOpportunities.length ? <div className="industrialMetricList">{plant.serviceOpportunities.map((item) => <p key={item.id}><b>{formatIndustrialLabel(item.serviceType)}</b><span>{item.fitLevel} | score {item.score} | {formatIndustrialLabel(item.status)}</span></p>)}</div> : <p className="muted">No plant service opportunities are recorded yet.</p>}
              </div>
            </section>

            <section className="panel">
              <div className="industrialPanelHead"><h2>Sources</h2><span className="muted">{plant._count.sources} total, showing latest 25</span></div>
              {plant.sources.length ? (
                <div className="tableWrap"><table><thead><tr><th>Type</th><th>Source</th><th>Level</th><th>Evidence</th><th>Research date</th><th>Notes</th></tr></thead><tbody>
                  {plant.sources.map((source) => (
                    <tr key={source.id}><td>{formatIndustrialLabel(source.sourceType)}</td><td>{source.sourceUrl ? <a href={source.sourceUrl} rel="noreferrer" target="_blank">{source.sourceTitle || source.sourceUrl}</a> : source.sourceTitle || '-'}</td><td>{formatIndustrialLabel(source.verificationLevel)}</td><td>{source.verificationSource ? 'Verification evidence' : 'Discovery source'}</td><td>{formatDate(source.researchDate || source.capturedAt)}</td><td>{source.notes || '-'}</td></tr>
                  ))}
                </tbody></table></div>
              ) : <p className="muted">No plant sources are linked yet.</p>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
