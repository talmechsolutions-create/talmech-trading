'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('ADMIN_SEGMENT_ERROR', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <main className="adminShell section">
      <div className="container">
        <span className="eyebrow">Admin error</span>
        <h1 className="pageTitle">This admin module could not render</h1>
        <div className="panel">
          <p className="muted">The error was caught before the production digest screen. Review server logs for the full stack trace.</p>
          {error.digest && <p><b>Digest:</b> {error.digest}</p>}
          <div className="waActionRow">
            <button className="btn" type="button" onClick={reset}>Retry</button>
            <Link className="btn secondary" href="/admin">Back to admin</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
