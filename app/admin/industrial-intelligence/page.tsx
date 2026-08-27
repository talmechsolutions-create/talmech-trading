import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  IndustrialAccessDenied,
  IndustrialEmptyState,
  IndustrialKpiGrid,
  IndustrialSchemaNotice,
  formatIndustrialLabel,
} from '@/components/industrial/IndustrialAdminComponents';
import { ADMIN_COOKIE } from '@/lib/adminSecurity';
import { getIndustrialSummary, listIndustrialCompanies } from '@/lib/industrialIntelligenceService';
import { parseIndustrialCompanyFilters } from '@/lib/industrialIntelligenceQuery';
import { requireIndustrialPermissionForToken } from '@/lib/security/industrialPermissions';

export const metadata: Metadata = {
  title: 'Industrial Intelligence | Talmech Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function IndustrialIntelligencePage() {
  const access = requireIndustrialPermissionForToken(cookies().get(ADMIN_COOKIE)?.value, 'industrial_intelligence.view');
  if (!access.ok) return <IndustrialAccessDenied message={access.message} />;

  const [summaryResult, companyResult] = await Promise.all([
    getIndustrialSummary(),
    listIndustrialCompanies(parseIndustrialCompanyFilters(new URLSearchParams('limit=25'))),
  ]);
  const summary = summaryResult.data;
  const companies = companyResult.data.companies;
  const hasData = summary.metrics.totalCompanies > 0 || summary.metrics.totalPlants > 0 || summary.metrics.totalContacts > 0;

  return (
    <main className="adminShell section">
      <div className="container industrialAdmin">
        <div className="industrialHeader">
          <div>
            <span className="eyebrow">Admin</span>
            <h1 className="pageTitle">Industrial Intelligence</h1>
            <p className="muted">
              Verified manufacturing companies, plants, contacts, capabilities, sources and service opportunities.
            </p>
          </div>
          <div className="industrialHeaderActions">
            <Link className="btn secondary" href="/admin">Admin home</Link>
            <Link className="btn" href="/admin/industrial-intelligence/companies">Companies</Link>
            <Link className="btn secondary" href="/admin/industrial-intelligence/contacts">Contacts</Link>
            <Link className="btn secondary" href="/admin/industrial-intelligence/imports">Imports</Link>
          </div>
        </div>

        <IndustrialSchemaNotice schemaReady={summaryResult.schemaReady && companyResult.schemaReady} />
        <IndustrialKpiGrid metrics={summary.metrics} />

        {!hasData ? (
          <IndustrialEmptyState>
            <div className="industrialEmptyActions">
              <Link className="btn secondary" href="/admin/industrial-intelligence/companies">Open company list</Link>
              <Link className="btn secondary" href="/admin/industrial-intelligence/contacts">Open contacts</Link>
              <Link className="btn secondary" href="/admin/industrial-intelligence/imports">Import database</Link>
            </div>
          </IndustrialEmptyState>
        ) : null}

        <section className="industrialTwoColumn">
          <div className="panel">
            <div className="industrialPanelHead">
              <h2>State and region coverage</h2>
            </div>
            {summary.regionAnalytics.length ? (
              <div className="tableWrap">
                <table>
                  <thead><tr><th>Region</th><th>State</th><th>Companies</th><th>Plants</th><th>Contacts</th></tr></thead>
                  <tbody>
                    {summary.regionAnalytics.map((row) => (
                      <tr key={`${row.region}-${row.state}`}>
                        <td>{row.region}</td>
                        <td>{row.state}</td>
                        <td>{row.companyCount}</td>
                        <td>{row.plantCount}</td>
                        <td>{row.contactCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="muted">No region or state records are available yet.</p>}
          </div>

          <div className="panel">
            <div className="industrialPanelHead">
              <h2>Service opportunity analytics</h2>
            </div>
            {summary.serviceAnalytics.length ? (
              <div className="industrialMetricList">
                {summary.serviceAnalytics.map((row) => (
                  <p key={row.serviceType}><b>{formatIndustrialLabel(row.serviceType)}</b><span>{row.count}</span></p>
                ))}
              </div>
            ) : <p className="muted">No service opportunities have been recorded yet.</p>}
          </div>
        </section>

        <section className="panel">
          <div className="industrialPanelHead">
            <div>
              <h2>Companies preview</h2>
              <p className="muted">Latest industrial company records with bounded relation counts.</p>
            </div>
            <Link className="btn secondary" href="/admin/industrial-intelligence/companies">View all</Link>
          </div>
          {companies.length ? (
            <div className="tableWrap">
              <table>
                <thead><tr><th>Company</th><th>Industry</th><th>State</th><th>Plants</th><th>Contacts</th><th>Verification</th><th>Priority</th><th>Actions</th></tr></thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id}>
                      <td><b>{company.displayName || company.canonicalName}</b><br /><span className="muted">{company.legalName || company.id}</span></td>
                      <td>{formatIndustrialLabel(company.industryCategory)}</td>
                      <td>{[company.city, company.state].filter(Boolean).join(', ') || '-'}</td>
                      <td>{company._count.plants}</td>
                      <td>{company._count.contacts}</td>
                      <td>{formatIndustrialLabel(company.verificationStatus)}</td>
                      <td>{formatIndustrialLabel(company.priority)}</td>
                      <td><Link className="btn secondary" href={`/admin/industrial-intelligence/companies/${company.id}`}>View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No industrial companies have been imported yet.</p>}
        </section>
      </div>
    </main>
  );
}
