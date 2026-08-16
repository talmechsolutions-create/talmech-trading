import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  industrialIndustryValues,
  industrialPageSizeOptions,
  industrialPriorityValues,
  industrialVerificationValues,
} from '@/lib/industrialIntelligenceQuery';

type SearchParams = Record<string, string | string[] | undefined>;

export function formatIndustrialLabel(value: unknown) {
  return String(value || 'Unspecified')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value: unknown) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function jsonList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(', ');
  if (value && typeof value === 'object') return Object.values(value).flat().map(String).filter(Boolean).join(', ');
  return String(value || '');
}

export function IndustrialBadge({ value, tone = 'default' }: { value: unknown; tone?: 'default' | 'green' | 'gold' }) {
  const className = tone === 'green' ? 'pill green' : tone === 'gold' ? 'pill gold' : 'pill';
  return <span className={className}>{formatIndustrialLabel(value)}</span>;
}

export function IndustrialEmptyState({ title = 'No industrial records yet', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="industrialEmpty panel">
      <h2>{title}</h2>
      <p className="muted">
        Industrial Intelligence is ready. Importing and verification will be enabled in the next rollout phase.
      </p>
      {children}
    </div>
  );
}

export function IndustrialSchemaNotice({ schemaReady }: { schemaReady: boolean }) {
  if (schemaReady) return null;
  return (
    <p className="notice slimNotice">
      The read-only module is deployed, but the Industrial Intelligence database tables are not available in this environment yet.
      Apply the reviewed Phase 1 migration in staging before live data appears here.
    </p>
  );
}

export function IndustrialAccessDenied({ message }: { message: string }) {
  return (
    <main className="adminShell section">
      <div className="container">
        <span className="eyebrow">Industrial Intelligence</span>
        <h1 className="pageTitle">Access restricted</h1>
        <div className="panel">
          <h2>View permission required</h2>
          <p className="muted">{message}</p>
          <Link className="btn secondary" href="/admin">Back to admin</Link>
        </div>
      </div>
    </main>
  );
}

export function IndustrialKpiGrid({ metrics }: { metrics: Record<string, number> }) {
  const rows = [
    ['Total Companies', metrics.totalCompanies],
    ['Total Plants', metrics.totalPlants],
    ['Total Contacts', metrics.totalContacts],
    ['Verified Companies', metrics.verifiedCompanies],
    ['Verification Pending', metrics.verificationPending],
    ['Forging', metrics.forgingCompanies],
    ['Steel / Rolling', metrics.steelCompanies],
    ['High Priority', metrics.highPriorityCompanies],
    ['A+ Prospects', metrics.topScoringProspects],
    ['Contact Coverage', `${metrics.existingContactCoverage || 0}%`],
  ];
  return (
    <div className="industrialKpis">
      {rows.map(([label, value]) => (
        <div className="card kpi" key={label}>
          <b>{value}</b>
          <span className="muted">{label}</span>
        </div>
      ))}
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function queryWith(searchParams: SearchParams, updates: Record<string, string | number>) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    const resolved = firstParam(value);
    if (resolved) params.set(key, resolved);
  });
  Object.entries(updates).forEach(([key, value]) => {
    if (value === '') params.delete(key);
    else params.set(key, String(value));
  });
  return `?${params.toString()}`;
}

export function IndustrialPagination({
  basePath,
  searchParams,
  pagination,
}: {
  basePath: string;
  searchParams: SearchParams;
  pagination: { page: number; totalPages: number; total: number; hasNextPage: boolean; hasPreviousPage: boolean };
}) {
  return (
    <div className="industrialPager">
      <span className="muted">
        Page {pagination.page} of {pagination.totalPages} | {pagination.total} records
      </span>
      <div>
        {pagination.hasPreviousPage ? (
          <Link className="btn secondary" href={`${basePath}${queryWith(searchParams, { page: pagination.page - 1 })}`}>Previous</Link>
        ) : null}
        {pagination.hasNextPage ? (
          <Link className="btn secondary" href={`${basePath}${queryWith(searchParams, { page: pagination.page + 1 })}`}>Next</Link>
        ) : null}
      </div>
    </div>
  );
}

export function CompanyFilters({ searchParams }: { searchParams: SearchParams }) {
  return (
    <form className="industrialFilters panel" action="/admin/industrial-intelligence/companies">
      <label>Search<input className="input" name="search" defaultValue={firstParam(searchParams.search)} placeholder="company, domain, GSTIN" /></label>
      <label>Region<input className="input" name="region" defaultValue={firstParam(searchParams.region)} placeholder="West, North, East..." /></label>
      <label>State<input className="input" name="state" defaultValue={firstParam(searchParams.state)} placeholder="State" /></label>
      <label>Industry<select name="industry" defaultValue={firstParam(searchParams.industry)}><option value="">All</option>{industrialIndustryValues.map((item) => <option key={item} value={item}>{formatIndustrialLabel(item)}</option>)}</select></label>
      <label>Subcategory<input className="input" name="subcategory" defaultValue={firstParam(searchParams.subcategory)} placeholder="Rolling Mill, Forging..." /></label>
      <label>Verification<select name="verificationStatus" defaultValue={firstParam(searchParams.verificationStatus)}><option value="">All</option>{industrialVerificationValues.map((item) => <option key={item} value={item}>{formatIndustrialLabel(item)}</option>)}</select></label>
      <label>Priority<select name="priority" defaultValue={firstParam(searchParams.priority)}><option value="">All</option>{industrialPriorityValues.map((item) => <option key={item} value={item}>{formatIndustrialLabel(item)}</option>)}</select></label>
      <label>Active<select name="activeStatus" defaultValue={firstParam(searchParams.activeStatus) || 'active'}><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All</option></select></label>
      <label>Limit<select name="limit" defaultValue={firstParam(searchParams.limit) || '25'}>{industrialPageSizeOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <div className="industrialFilterActions">
        <button className="btn" type="submit">Apply</button>
        <Link className="btn secondary" href="/admin/industrial-intelligence/companies">Reset</Link>
      </div>
    </form>
  );
}

export function ContactFilters({ searchParams }: { searchParams: SearchParams }) {
  return (
    <form className="industrialFilters panel" action="/admin/industrial-intelligence/contacts">
      <label>Search<input className="input" name="search" defaultValue={firstParam(searchParams.search)} placeholder="person, company, designation" /></label>
      <label>Company ID<input className="input" name="companyId" defaultValue={firstParam(searchParams.companyId)} /></label>
      <label>Plant ID<input className="input" name="plantId" defaultValue={firstParam(searchParams.plantId)} /></label>
      <label>State<input className="input" name="state" defaultValue={firstParam(searchParams.state)} /></label>
      <label>Department<input className="input" name="department" defaultValue={firstParam(searchParams.department)} placeholder="Quality, Purchase, NDT..." /></label>
      <label>Verification<select name="verificationStatus" defaultValue={firstParam(searchParams.verificationStatus)}><option value="">All</option>{industrialVerificationValues.map((item) => <option key={item} value={item}>{formatIndustrialLabel(item)}</option>)}</select></label>
      <label>Limit<select name="limit" defaultValue={firstParam(searchParams.limit) || '25'}>{industrialPageSizeOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <div className="industrialFilterActions">
        <button className="btn" type="submit">Apply</button>
        <Link className="btn secondary" href="/admin/industrial-intelligence/contacts">Reset</Link>
      </div>
    </form>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p>
      <b>{label}</b>
      <span>{value || '-'}</span>
    </p>
  );
}
