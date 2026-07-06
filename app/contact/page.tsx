import type { Metadata } from 'next';
import Link from 'next/link';
import RequirementForm from '@/components/RequirementForm';

export const metadata: Metadata = {
  title: 'Contact Talmech Trading | Metal Marketplace Support India',
  description: 'Contact Talmech Trading for verified metal buying, selling, scrap trading, supplier onboarding, logistics support and marketplace assistance across India.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Talmech Trading',
    description: 'Reach Talmech Trading for metal sourcing, supplier verification, scrap listings, logistics coordination and admin-supported marketplace workflows.',
    images: [{ url: '/images/metal-categories/steel.webp', width: 1200, height: 800, alt: 'Contact Talmech Trading' }]
  }
};

const contactOptions = [
  { title: 'Buying requirement', copy: 'Share product, grade, quantity, destination and delivery timeline for local-first supplier matching.', cta: 'Post requirement', href: '/post-requirement' },
  { title: 'Supplier onboarding', copy: 'List ready stock, manufacturing capability, scrap lots or dispatch-ready inventory for verification.', cta: 'Sell on Talmech', href: '/sell' },
  { title: 'Logistics coordination', copy: 'Coordinate pickup, delivery, weight, route and transporter quote support for metal consignments.', cta: 'Request logistics', href: '/post-requirement' }
];

export default function ContactPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Talmech Trading',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://talmech-trading.vercel.app'}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Talmech Trading',
      telephone: '+91 7389642874',
      contactPoint: [{ '@type': 'ContactPoint', telephone: '+91 7389642874', contactType: 'customer support', areaServed: 'IN', availableLanguage: ['English', 'Hindi', 'Marathi'] }]
    }
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="contactHeroPro">
        <div className="container contactHeroGrid">
          <div>
            <span className="eyebrow">Contact Talmech Trading</span>
            <h1>Talk to Talmech for verified metal sourcing, selling, scrap and logistics support.</h1>
            <p>
              Use this page to route your enquiry to the correct workflow. Talmech verifies requirements, stock details, GST route, product photos, delivery timelines and commercial terms before connecting marketplace parties.
            </p>
            <div className="contactActionRow">
              <a className="btn" href="tel:+917389642874">Call +91 7389642874</a>
              <a className="btn secondary" href="https://wa.me/917389642874" target="_blank" rel="noreferrer">WhatsApp Talmech</a>
              <Link className="btn dark" href="/public-marketplace">Browse marketplace</Link>
            </div>
          </div>
          <div className="contactInfoCard">
            <b>Support hours</b>
            <p>Business enquiries are reviewed by the Talmech team before lead routing.</p>
            <div className="contactInfoRows">
              <span>Phone / WhatsApp</span><strong>+91 7389642874</strong>
              <span>Marketplace focus</span><strong>Steel, scrap, copper, aluminum, brass, forgings</strong>
              <span>Coverage</span><strong>India-wide, local-first matching</strong>
              <span>Response workflow</span><strong>Verification → matching → commercial discussion</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section contactCardsSection">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Choose the right action</span>
              <h2 className="pageTitle">Route your enquiry into the correct Talmech workflow.</h2>
            </div>
          </div>
          <div className="grid cards3">
            {contactOptions.map((x) => <article className="card contactRouteCard" key={x.title}><h3>{x.title}</h3><p className="muted">{x.copy}</p><Link className="btn secondary" href={x.href}>{x.cta}</Link></article>)}
          </div>
        </div>
      </section>

      <section className="section contactFormSection">
        <div className="container contactSplitGrid">
          <div className="contactTrustPanel">
            <span className="eyebrow">Why verification matters</span>
            <h2>Cleaner conversations, fewer fake leads and better deal control.</h2>
            <p>Talmech keeps contact data protected until requirements, material evidence and commercial feasibility are reviewed. This protects buyers and suppliers from spam, mismatched enquiries and unclear pricing.</p>
            <ul>
              <li>GST and company detail review</li>
              <li>Two or more images/documents for product clarity</li>
              <li>PIN/city-based matching before expanding nearby</li>
              <li>Admin-controlled lead and CRM follow-up</li>
              <li>Price-lock and invoice workflow when payment gateway is connected</li>
            </ul>
          </div>
          <RequirementForm initialIntent="BUY" />
        </div>
      </section>
    </main>
  );
}
