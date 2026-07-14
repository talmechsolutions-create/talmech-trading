import Link from 'next/link';
import type { AdminDataErrorInfo } from '@/lib/adminSsr';

type Props = {
  title: string;
  route: string;
  error: AdminDataErrorInfo;
  backHref?: string;
  backLabel?: string;
};

export default function AdminDataLoadError({
  title,
  route,
  error,
  backHref = '/admin',
  backLabel = 'Back to admin',
}: Props) {
  return (
    <main className="adminShell section">
      <div className="container">
        <span className="eyebrow">Admin data unavailable</span>
        <h1 className="pageTitle">{title}</h1>
        <div className="panel">
          <span className="pill gold">{error.code}</span>
          <h2>Live data could not be loaded</h2>
          <p className="muted">{error.message}</p>
          <div className="userDetailGrid">
            <p><b>Route:</b> {route}</p>
            <p><b>Status:</b> {error.status}</p>
          </div>
          <p className="notice slimNotice">
            The page is protected from a generic Next.js server exception. Check DATABASE_POSTGRES_URL or DATABASE_URL,
            Prisma migrations, and Vercel runtime logs, then reload this module.
          </p>
          <div className="waActionRow">
            <Link className="btn" href={backHref}>{backLabel}</Link>
            <Link className="btn secondary" href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
