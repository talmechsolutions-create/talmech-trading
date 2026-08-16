import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ContactFilters,
  IndustrialAccessDenied,
  IndustrialEmptyState,
  IndustrialPagination,
  IndustrialSchemaNotice,
  formatDate,
  formatIndustrialLabel,
} from '@/components/industrial/IndustrialAdminComponents';
import { ADMIN_COOKIE } from '@/lib/adminSecurity';
import { listIndustrialContacts } from '@/lib/industrialIntelligenceService';
import { parseIndustrialContactFilters } from '@/lib/industrialIntelligenceQuery';
import { requireIndustrialPermissionForToken } from '@/lib/security/industrialPermissions';

export const metadata: Metadata = {
  title: 'Industrial Contacts | Talmech Admin',
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

export default async function IndustrialContactsPage({ searchParams }: Props) {
  const access = requireIndustrialPermissionForToken(cookies().get(ADMIN_COOKIE)?.value, 'industrial_intelligence.view');
  if (!access.ok) return <IndustrialAccessDenied message={access.message} />;

  const filters = parseIndustrialContactFilters(toUrlSearchParams(searchParams));
  const result = await listIndustrialContacts(filters);
  const { contacts, pagination } = result.data;

  return (
    <main className="adminShell section">
      <div className="container industrialAdmin">
        <div className="industrialHeader">
          <div>
            <span className="eyebrow">Industrial Intelligence</span>
            <h1 className="pageTitle">Contacts</h1>
            <p className="muted">Admin-only plant and company contact directory with server-side pagination.</p>
          </div>
          <div className="industrialHeaderActions">
            <Link className="btn secondary" href="/admin/industrial-intelligence">Dashboard</Link>
            <Link className="btn secondary" href="/admin/industrial-intelligence/companies">Companies</Link>
          </div>
        </div>

        <IndustrialSchemaNotice schemaReady={result.schemaReady} />
        <ContactFilters searchParams={searchParams} />

        <section className="panel">
          <div className="industrialPanelHead">
            <h2>Contact list</h2>
            <span className="muted">{pagination.total} matching records</span>
          </div>
          {contacts.length ? (
            <>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Company</th>
                      <th>Plant</th>
                      <th>State</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Verification</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td><b>{contact.personName || '-'}</b><br /><span className="muted">{formatIndustrialLabel(contact.contactScope)}</span></td>
                        <td><Link href={`/admin/industrial-intelligence/companies/${contact.company.id}`}>{contact.company.canonicalName}</Link></td>
                        <td>{contact.plant ? <Link href={`/admin/industrial-intelligence/plants/${contact.plant.id}`}>{contact.plant.plantName}</Link> : 'Company level'}</td>
                        <td>{contact.plant?.state || contact.company.state || '-'}</td>
                        <td>{contact.designation || '-'}</td>
                        <td>{contact.department || '-'}</td>
                        <td>{contact.phone || '-'}</td>
                        <td>{contact.email || '-'}</td>
                        <td>{formatIndustrialLabel(contact.verificationStatus)}</td>
                        <td>{formatDate(contact.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <IndustrialPagination basePath="/admin/industrial-intelligence/contacts" searchParams={searchParams} pagination={pagination} />
            </>
          ) : (
            <IndustrialEmptyState title="No industrial contacts have been imported yet." />
          )}
        </section>
      </div>
    </main>
  );
}
