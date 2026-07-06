import Link from 'next/link';

export type TmisAdminKey =
  | 'dashboard'
  | 'materials'
  | 'grades'
  | 'products'
  | 'quality'
  | 'marketplace'
  | 'sources'
  | 'knowledge-graph'
  | 'review'
  | 'planning';

type TmisAdminShellProps = {
  active: TmisAdminKey;
  title: string;
  description: string;
  children: React.ReactNode;
};

const adminLinks: { key: TmisAdminKey; label: string; href: string }[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/tmis' },
  { key: 'materials', label: 'Materials', href: '/admin/tmis/materials' },
  { key: 'grades', label: 'Grades', href: '/admin/tmis/grades' },
  { key: 'products', label: 'Products', href: '/admin/tmis/products' },
  { key: 'quality', label: 'Quality', href: '/admin/tmis/quality' },
  { key: 'marketplace', label: 'Marketplace', href: '/admin/tmis/marketplace' },
  { key: 'sources', label: 'Sources', href: '/admin/tmis/sources' },
  { key: 'knowledge-graph', label: 'Knowledge Graph', href: '/admin/tmis/knowledge-graph' },
  { key: 'review', label: 'Review Queue', href: '/admin/tmis/review' },
  { key: 'planning', label: 'Planning', href: '/admin/tmis/planning' },
];

export default function TmisAdminShell({ active, title, description, children }: TmisAdminShellProps) {
  return (
    <main className="adminShell tmisAdminShell">
      <section className="section tmisAdminPage">
        <div className="container">
          <div className="sectionHead tmisAdminHero">
            <div>
              <span className="eyebrow">TMIS admin</span>
              <h1 className="pageTitle">{title}</h1>
              <p className="muted">{description}</p>
            </div>
            <div className="row tmisAdminHeaderActions">
              <Link className="btn secondary" href="/tmis">Open TMIS Public</Link>
              <Link className="btn secondary" href="/admin/tmis/review">Open Review Queue</Link>
              <Link className="btn secondary" href="/admin/tmis/knowledge-graph">Open Knowledge Graph</Link>
              <Link className="btn secondary" href="/admin/tmis/sources">Open Source Tracker</Link>
            </div>
          </div>

          <div className="tmisAdminLayout">
            <aside className="panel tmisAdminSidebar" aria-label="TMIS admin sections">
              <div className="tmisSidebarTitle">Review workspace</div>
              <p className="muted">Phase 1 is read-only seed data. No publish, verify, or delete actions are available.</p>
              <nav className="tmisAdminNav">
                {adminLinks.map((link) => (
                  <Link className={active === link.key ? 'active' : ''} href={link.href} key={link.key}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <div className="tmisAdminContent">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
