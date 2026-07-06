import MarketingSeoConsole from '@/components/MarketingSeoConsole';

export const metadata = {
  title: 'SEO Tracker & Marketing Command Center',
  robots: { index: false, follow: false },
};

export default function SeoTrackerPage() {
  return (
    <main className="adminShell">
      <section className="section">
        <div className="container">
          <MarketingSeoConsole />
        </div>
      </section>
    </main>
  );
}
