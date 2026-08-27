import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  IndustrialAccessDenied,
  IndustrialBadge,
  IndustrialPagination,
  IndustrialSchemaNotice,
  formatDate,
} from '@/components/industrial/IndustrialAdminComponents';
import { IndustrialImportUpload } from '@/components/industrial/IndustrialImportClient';
import { ADMIN_COOKIE } from '@/lib/adminSecurity';
import { listIndustrialImportBatches, parseIndustrialImportListFilters } from '@/lib/industrial/importService';
import { requireIndustrialPermissionForToken } from '@/lib/security/industrialPermissions';

export const metadata: Metadata = {
  title: 'Industrial Imports | Talmech Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Record<string, string | string[] | undefined> };

function toUrlSearchParams(searchParams: Props['searchParams']) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    const resolved = Array.isArray(value) ? value[0] : value;
    if (resolved) params.set(key, resolved);
  });
  return params;
}

export default async function IndustrialImportsPage({ searchParams }: Props) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const view = requireIndustrialPermissionForToken(token, 'industrial_intelligence.view');
  if (!view.ok) return <IndustrialAccessDenied message={view.message} />;

  const importAccess = requireIndustrialPermissionForToken(token, 'industrial_intelligence.import');
  const filters = parseIndustrialImportListFilters(toUrlSearchParams(searchParams));
  const result = await listIndustrialImportBatches(filters);

  return (
    <main className="adminShell section">
      <div className="container industrialAdmin">
        <div className="industrialHeader">
          <div>
            <span className="eyebrow">Industrial Intelligence</span>
            <h1 className="pageTitle">Import management</h1>
            <p className="muted">Controlled CSV/XLSX upload, mapping, dry-run review and approved commit workflow.</p>
          </div>
          <div className="industrialHeaderActions">
            <Link className="btn secondary" href="/admin/industrial-intelligence">Dashboard</Link>
            <Link className="btn secondary" href="/admin">Admin home</Link>
          </div>
        </div>

        <IndustrialSchemaNotice schemaReady={result.schemaReady} />
        {importAccess.ok ? <IndustrialImportUpload /> : <p className="notice slimNotice">Upload requires industrial_intelligence.import permission.</p>}

        <section className="panel">
          <div className="industrialPanelHead">
            <h2>Import batches</h2>
          </div>
          {result.batches.length ? (
            <div className="tableWrap">
              <table>
                <thead><tr><th>Batch</th><th>File</th><th>Status</th><th>Rows</th><th>Valid</th><th>Invalid</th><th>Duplicates</th><th>Uploaded</th><th>Action</th></tr></thead>
                <tbody>
                  {result.batches.map((batch) => (
                    <tr key={batch.id}>
                      <td><b>{batch.id}</b><br /><span className="muted">{batch.createdBy || 'admin'}</span></td>
                      <td>{batch.fileName || '-'}<br /><span className="muted">{batch.fileType || '-'}</span></td>
                      <td><IndustrialBadge value={batch.status} tone={batch.status === 'COMMITTED' ? 'green' : batch.status === 'DUPLICATE_REVIEW' ? 'gold' : 'default'} /></td>
                      <td>{batch.totalRows}</td>
                      <td>{batch.validRows}</td>
                      <td>{batch.invalidRows}</td>
                      <td>{batch.duplicateCandidates}</td>
                      <td>{formatDate(batch.createdAt)}</td>
                      <td><Link className="btn secondary" href={`/admin/industrial-intelligence/imports/${batch.id}`}>Review</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No import batches have been created yet.</p>}
          <IndustrialPagination basePath="/admin/industrial-intelligence/imports" searchParams={searchParams} pagination={result.pagination} />
        </section>
      </div>
    </main>
  );
}

