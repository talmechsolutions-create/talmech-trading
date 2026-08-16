import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  CompanyFilters,
  IndustrialAccessDenied,
  IndustrialEmptyState,
  IndustrialPagination,
  IndustrialSchemaNotice,
  formatDate,
  formatIndustrialLabel,
  jsonList,
} from '@/components/industrial/IndustrialAdminComponents';
import { ADMIN_COOKIE } from '@/lib/adminSecurity';
import { listIndustrialCompanies } from '@/lib/industrialIntelligenceService';
import { parseIndustrialCompanyFilters } from '@/lib/industrialIntelligenceQuery';
import { requireIndustrialPermissionForToken } from '@/lib/security/industrialPermissions';

export const metadata: Metadata = {
  title: 'Industrial Companies | Talmech Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

function toUrlSearchParams(searchParams: Props['searchParams']) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    const resolved = Array.isArray(value) ? value[0] : value;
    if (resolved) params.set(key, resolved);
  });
  return params;
}

export default async function IndustrialCompaniesPage({ searchParams }: Props) {
  const access = requireIndustrialPermissionForToken(cookies().get(ADMIN_COOKIE)?.value, 'industrial_intelligence.view');
  if (!access.ok) return <IndustrialAccessDenied message={access.message} />;

  const filters = parseIndustrialCompanyFilters(toUrlSearchParams(searchParams));
  const result = await listIndustrialCompanies(filters);
  const { companies, pagination } = result.data;

  return (
    <main className="adminShell section">
      <div className="container industrialAdmin">
        <div className="industrialHeader">
          <div>
            <span className="eyebrow">Industrial Intelligence</span>
            <h1 className="pageTitle">Companies</h1>
            <p className="muted">Server-paginated company master with verification, priority and relation counts.</p>
          </div>
          <div className="industrialHeaderActions">
            <Link className="btn secondary" href="/admin/industrial-intelligence">Dashboard</Link>
            <Link className="btn secondary" href="/admin/industrial-intelligence/contacts">Contacts</Link>
          </div>
        </div>

        <IndustrialSchemaNotice schemaReady={result.schemaReady} />
        <CompanyFilters searchParams={searchParams} />

        <section className="panel">
          <div className="industrialPanelHead">
            <h2>Company list</h2>
            <span className="muted">{pagination.total} matching records</span>
          </div>
          {companies.length ? (
            <>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Industry</th>
                      <th>State</th>
                      <th>City / Cluster</th>
                      <th>Plants</th>
                      <th>Contacts</th>
                      <th>Verification</th>
                      <th>Priority</th>
                      <th>Score</th>
                      <th>Last Verified / Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td>
                          <b>{company.displayName || company.canonicalName}</b>
                          <br />
                          <span className="muted">{company.officialDomain || company.legalName || company.id}</span>
                        </td>
                        <td>
                          {formatIndustrialLabel(company.industryCategory)}
                          {jsonList(company.subcategories) ? <><br /><span className="muted">{jsonList(company.subcategories)}</span></> : null}
                        </td>
                        <td>{company.state || '-'}</td>
                        <td>{company.city || '-'}</td>
                        <td>{company._count.plants}</td>
                        <td>{company._count.contacts}</td>
                        <td>{formatIndustrialLabel(company.verificationStatus)}</td>
                        <td>{formatIndustrialLabel(company.priority)}</td>
                        <td>{company.opportunityScore}</td>
                        <td>{formatDate(company.updatedAt)}</td>
                        <td><Link className="btn secondary" href={`/admin/industrial-intelligence/companies/${company.id}`}>View Company</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <IndustrialPagination basePath="/admin/industrial-intelligence/companies" searchParams={searchParams} pagination={pagination} />
            </>
          ) : (
            <IndustrialEmptyState title="No industrial companies have been imported yet." />
          )}
        </section>
      </div>
    </main>
  );
}
