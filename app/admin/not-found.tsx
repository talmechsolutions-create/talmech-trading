import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <main className="adminShell section">
      <div className="container">
        <span className="eyebrow">Not found</span>
        <h1 className="pageTitle">Admin record not found</h1>
        <div className="panel">
          <p className="muted">The requested protected admin record does not exist or is no longer available.</p>
          <div className="waActionRow">
            <Link className="btn" href="/admin">Back to admin</Link>
            <Link className="btn secondary" href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
