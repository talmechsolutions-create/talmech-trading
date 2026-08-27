import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  IndustrialAccessDenied,
  IndustrialBadge,
  IndustrialPagination,
  IndustrialSchemaNotice,
  Field,
  formatDate,
  formatIndustrialLabel,
} from '@/components/industrial/IndustrialAdminComponents';
import { IndustrialImportActions } from '@/components/industrial/IndustrialImportClient';
import { ADMIN_COOKIE } from '@/lib/adminSecurity';
import { getIndustrialImportBatch, parseIndustrialImportRowFilters } from '@/lib/industrial/importService';
import type { IndustrialImportBatchRaw } from '@/lib/industrial/importTypes';
import { requireIndustrialPermissionForToken } from '@/lib/security/industrialPermissions';

export const metadata: Metadata = {
  title: 'Industrial Import Detail | Talmech Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { params: { id: string }; searchParams: Record<string, string | string[] | undefined> };

function toUrlSearchParams(searchParams: Props['searchParams']) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    const resolved = Array.isArray(value) ? value[0] : value;
    if (resolved) params.set(key, resolved);
  });
  return params;
}

export default async function IndustrialImportDetailPage({ params, searchParams }: Props) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const view = requireIndustrialPermissionForToken(token, 'industrial_intelligence.view');
  if (!view.ok) return <IndustrialAccessDenied message={view.message} />;
  const importAccess = requireIndustrialPermissionForToken(token, 'industrial_intelligence.import');
  const result = await getIndustrialImportBatch(params.id, parseIndustrialImportRowFilters(toUrlSearchParams(searchParams)));
  const batch = result.batch;
  const raw = batch?.raw as IndustrialImportBatchRaw | null;
  const phase4 = raw?.phase4;
  const summary = phase4?.dryRunSummary;

  return (
    <main className="adminShell section">
      <div className="container industrialAdmin">
        <div className="industrialHeader">
          <div>
            <span className="eyebrow">Import review</span>
            <h1 className="pageTitle">{batch?.fileName || params.id}</h1>
            <p className="muted">Dry-run details, mapping, duplicate signals and planned actions.</p>
          </div>
          <div className="industrialHeaderActions">
            <Link className="btn secondary" href="/admin/industrial-intelligence/imports">All imports</Link>
            {batch && importAccess.ok ? <IndustrialImportActions batchId={batch.id} status={String(batch.status)} /> : null}
          </div>
        </div>

        <IndustrialSchemaNotice schemaReady={result.schemaReady} />
        {!batch ? <p className="notice slimNotice">Import batch not found.</p> : null}
        {batch ? (
          <>
            <section className="industrialTwoColumn">
              <div className="panel">
                <h2>Batch</h2>
                <Field label="Status" value={<IndustrialBadge value={batch.status} tone={batch.status === 'COMMITTED' ? 'green' : batch.status === 'DUPLICATE_REVIEW' ? 'gold' : 'default'} />} />
                <Field label="Phase 4 status" value={phase4?.status || '-'} />
                <Field label="Mode" value={phase4?.importMode || '-'} />
                <Field label="Selected sheet" value={phase4?.selectedSheet || '-'} />
                <Field label="Uploaded" value={formatDate(batch.createdAt)} />
              </div>
              <div className="panel">
                <h2>Dry-run summary</h2>
                {summary ? (
                  <div className="industrialMetricList">
                    {Object.entries(summary).map(([key, value]) => <p key={key}><b>{formatIndustrialLabel(key)}</b><span>{String(value)}</span></p>)}
                  </div>
                ) : <p className="muted">Run dry-run after confirming mapping.</p>}
              </div>
            </section>

            <section className="panel">
              <div className="industrialPanelHead"><h2>Sheet and mapping</h2></div>
              {phase4?.sheets?.length ? (
                <div className="tableWrap">
                  <table>
                    <thead><tr><th>Sheet</th><th>Rows</th><th>Columns</th><th>Suggested mode</th><th>Import</th></tr></thead>
                    <tbody>
                      {phase4.sheets.map((sheet) => (
                        <tr key={sheet.name}>
                          <td><b>{sheet.name}</b></td>
                          <td>{sheet.rowCount}</td>
                          <td>{sheet.columnCount}</td>
                          <td>{formatIndustrialLabel(sheet.suggestedMode)}</td>
                          <td>{sheet.shouldExclude ? <IndustrialBadge value="Excluded analytics/control" tone="gold" /> : <IndustrialBadge value="Processable" tone="green" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>

            <section className="panel">
              <div className="industrialPanelHead"><h2>Review rows</h2></div>
              {result.rows.length ? (
                <div className="tableWrap">
                  <table>
                    <thead><tr><th>Row</th><th>Company</th><th>Plant</th><th>State</th><th>City</th><th>Classification</th><th>Score</th><th>Verification</th><th>Action</th><th>Issues</th></tr></thead>
                    <tbody>
                      {result.rows.map((row) => {
                        const normalized = row.normalized as any;
                        const dryRun = normalized?.dryRun || {};
                        const candidate = normalized?.normalized || {};
                        return (
                          <tr key={row.id}>
                            <td>{row.rowNumber}</td>
                            <td><b>{candidate.company?.companyName?.displayName || '-'}</b></td>
                            <td>{candidate.plant?.plantName?.displayName || '-'}</td>
                            <td>{candidate.company?.location?.state?.normalized || '-'}</td>
                            <td>{candidate.company?.location?.city?.normalized || '-'}</td>
                            <td>{(dryRun.classifications || []).map((item: string) => <IndustrialBadge key={item} value={item} tone={item === 'MANUAL_REVIEW' ? 'gold' : 'default'} />)}</td>
                            <td>{dryRun.duplicateSummary?.topScore || 0}</td>
                            <td>{formatIndustrialLabel(dryRun.verificationStatus)}</td>
                            <td>{formatIndustrialLabel(row.commitAction)}</td>
                            <td>{Array.isArray(row.validationIssues) ? row.validationIssues.length : dryRun.validationIssues?.length || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="muted">No dry-run rows have been generated yet.</p>}
              <IndustrialPagination basePath={`/admin/industrial-intelligence/imports/${params.id}`} searchParams={searchParams} pagination={result.pagination} />
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

