import Link from 'next/link';
import LivePriceTicker from '@/components/LivePriceTicker';

const tools = [
  ['Website Leads','/admin-leads','Public buy/sell/scrap/logistics posts and CSV export.'],
  ['TMIS Review','/admin/tmis','Review draft manufacturing intelligence records, source rows and knowledge graph relationships.'],
  ['User Approvals','/admin-users','Approve, reject and suspend buyer/seller/trader accounts.'],
  ['SEO & Marketing Tracker','/seo-tracker','Track SEO pages, APIs, campaigns, UTM events, devices and buyer/seller/trader growth channels.'],
  ['Price Locks','/admin-price-locks','Monitor advance, service fee, logistics, payment and balance-before-dispatch records.'],
  ['Payment Tracker','/admin-payments','Track Razorpay receipts, full/partial payments, seller settlements, logistics payouts and payout vouchers.'],
  ['Trading CRM','/crm','Private buyer, supplier, logistics and commission pipeline.'],
  ['Supplier Finder','/supplier-search','Find manufacturers, stockists, scrap yards and vendors.'],
  ['Buyer Finder','/industry-search','Find buyers by metal use-case and location.'],
  ['Logistics Vendors','/admin-logistics','Manage logistics partners, contracts, service areas and pricing.'],
  ['Small Deal AI','/small-deals','₹10k no-inventory deal planner.'],
  ['AI Strategy','/strategy','Daily market action plan.'],
  ['Knowledge Hub','/knowledge','Metal trading knowledge and quality checks.'],
];

export const metadata = { title: 'Admin Dashboard', robots: { index: false, follow: false } };

export default function Dashboard() {
  return (
    <main className="adminShell">
      <section className="section">
        <div className="container">
          <span className="eyebrow">Locked admin portal</span>
          <h1 className="pageTitle">Talmech internal command center</h1>
          <p className="muted">This area is hidden from public users and search engines. Public website leads, campaigns, SEO signals and payments flow into protected admin tools.</p>
          <div className="grid cards4" style={{ marginTop: 24 }}>
            {tools.map(([title, href, desc]) => (
              <Link href={href} className="card" key={href}>
                <h3>{title}</h3>
                <p className="muted">{desc}</p>
                <span className="btn secondary">Open</span>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 28 }}><LivePriceTicker /></div>
        </div>
      </section>
    </main>
  );
}
