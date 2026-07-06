import type { Metadata } from 'next';
import Link from 'next/link';
import LivePriceTicker from '@/components/LivePriceTicker';
import ContextualHelpBox from '@/components/help/ContextualHelpBox';
import { productCategories } from '@/lib/marketplaceData';
import { getMetalImage, getProductImage } from '@/lib/productImages';

export const metadata: Metadata = {
  title: 'Talmech Trading | Verified Metal Marketplace in India',
  description:
    'Talmech Trading connects verified buyers, suppliers, scrap sellers, fabricators, forging units and logistics partners for steel, copper, aluminum, brass, forgings and industrial components across India.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Talmech Trading | Verified Metal Marketplace in India',
    description:
      'Post metal requirements, list stock, source verified suppliers and coordinate logistics through a local-first Indian B2B metal marketplace.',
    url: '/',
    siteName: 'Talmech Trading',
    images: [{ url: '/images/metal-categories/steel.webp', width: 1200, height: 800, alt: 'Talmech Trading metal marketplace' }],
    type: 'website'
  }
};

const featuredProducts = [
  ['TMT bars', 'Steel', 'Fe 500D / Fe 550D for construction and infrastructure demand'],
  ['Copper wire', 'Copper', 'Motor, panel, transformer and electrical manufacturing demand'],
  ['Copper scrap Millberry', 'Copper', 'Recycling and smelting-ready non-ferrous scrap category'],
  ['Aluminum ingot', 'Aluminum', 'Casting, extrusion and component manufacturing supply'],
  ['Brass rods', 'Brass', 'Machining, valves, fittings and precision turned parts']
];

const workflow = [
  ['1', 'Requirement clarity', 'Product, grade, quantity, PIN code, timeline, target price and documents are collected in a structured format.'],
  ['2', 'Verification screen', 'Talmech reviews photos, GST route, stock readiness, test certificates and commercial terms before sharing contacts.'],
  ['3', 'Local-first matching', 'Matching starts with exact PIN, industrial area and city before expanding to nearby regions and all-India supply.'],
  ['4', 'Deal closure support', 'Price-lock, payment milestone, invoice, logistics and dispatch timeline are managed through the admin workflow.']
];

const buyerKeywords = ['TMT bars supplier in Pune', 'copper scrap buyer Maharashtra', 'aluminum extrusion supplier India', 'brass component manufacturer', 'forging supplier EN24', 'metal logistics support'];

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Talmech Trading',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://talmech-trading.vercel.app',
    telephone: '+91 7389642874',
    areaServed: 'India',
    sameAs: [],
    description: 'India-focused B2B metal marketplace for verified buyer requirements, supplier listings, scrap trading and logistics coordination.'
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="homeHeroPro">
        <div className="container homeHeroGrid">
          <div className="homeHeroCopy">
            <span className="eyebrow">India-first B2B metal marketplace</span>
            <h1>Verified metal sourcing, selling and logistics support for Indian industrial markets.</h1>
            <p>
              Talmech Trading helps buyers, suppliers, scrap dealers, fabricators, forging units and component manufacturers work through a cleaner, verified workflow — from requirement posting to price-lock, documentation, dispatch and logistics coordination.
            </p>
            <div className="homeSearchCard" role="search">
              <input aria-label="Search metal product" placeholder="Search TMT bars, copper scrap, aluminum ingot, EN24 forging..." />
              <Link className="btn" href="/public-marketplace">Search marketplace</Link>
            </div>
            <div className="heroActionRow">
              <Link className="btn" href="/post-requirement">Post Requirement</Link>
              <Link className="btn secondary" href="/sell">List Supply</Link>
              <Link className="btn secondary" href="/whatsapp-upload">Upload via WhatsApp</Link>
              <Link className="btn dark" href="/public-marketplace">Browse Listings</Link>
              <Link className="btn secondary" href="/how-it-works">How it works</Link>
            </div>
            <div className="trustChips">
              <span>GST-aware workflow</span><span>Local-first matching</span><span>Photo/document verification</span><span>Price-lock ready</span>
            </div>
          </div>
          <div className="homeHeroVisual">
            <img src="/images/metal-categories/steel.webp" alt="Steel stock and metal marketplace supply" />
            <div className="heroFloatPanel">
              <b>Talmech verification workflow</b>
              <span>Product details → photos/documents → commercial screening → local supplier/buyer match → logistics support.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section compactSection">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Market confidence</span>
              <h2 className="pageTitle">Live and estimate-based metal rates with clear source labels.</h2>
              <p className="muted">The rate board shows API-backed prices when keys are configured and marks quote/estimate rows where supplier verification is required before final deal confirmation.</p>
            </div>
            <div className="heroActionRow">
              <Link className="btn secondary" href="/public-marketplace">View marketplace</Link>
              <Link className="btn secondary" href="/whatsapp-upload">Send product details on WhatsApp</Link>
              <Link className="btn dark" href="/how-it-works">Watch onboarding guide</Link>
            </div>
          </div>
          <ContextualHelpBox type="rates" label="Watch onboarding guide" />
          <LivePriceTicker />
        </div>
      </section>

      <section className="section productStripSection">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Featured product flow</span>
              <h2 className="pageTitle">Popular metal requirements your team can start matching first.</h2>
            </div>
          </div>
          <div className="featuredProductStrip">
            {featuredProducts.map(([product, metal, copy]) => (
              <Link href={`/products/${encodeURIComponent(product.toLowerCase().replaceAll(' ', '-'))}?product=${encodeURIComponent(product)}`} className="featuredProductCard" key={product}>
                <img src={getProductImage(product, metal.toLowerCase())} alt={`${product} marketplace listing`} />
                <div>
                  <small>{metal}</small>
                  <b>{product}</b>
                  <p>{copy}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Metal intelligence</span>
              <h2 className="pageTitle">From small fasteners to aerospace and precision components.</h2>
              <p className="muted">Each category opens into product forms, grades, buyer industries, supplier sources and quality checks so users can understand the material before posting or accepting a deal.</p>
            </div>
          </div>
          <div className="categoryMasonryPro">
            {productCategories.map((m) => (
              <Link className="categoryTilePro" href={`/metals/${m.slug}`} key={m.slug}>
                <img src={getMetalImage(m.slug)} alt={`${m.metal} products and suppliers`} />
                <div>
                  <h3>{m.metal}</h3>
                  <p>{m.products.slice(0, 7).join(', ')} and more.</p>
                  <span>Explore category →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section workflowSection">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Verified marketplace workflow</span>
              <h2 className="pageTitle">Built to reduce fake leads, unclear pricing and mismatched suppliers.</h2>
              <p className="muted">Talmech keeps public discovery simple while backend verification, user approval and CRM follow-up stay controlled inside the admin portal.</p>
            </div>
          </div>
          <div className="workflowGrid">
            {workflow.map(([num, title, body]) => <article className="workflowCard" key={num}><span>{num}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section audienceSection">
        <div className="container audienceGrid">
          <article className="audienceCard buyerAudience">
            <span className="eyebrow">For buyers</span>
            <h2>Post exact material requirements and get local-first supplier matching.</h2>
            <p>Share product, grade, quantity, PIN code, destination, target quote, delivery timeline and technical documents. Talmech screens supplier readiness before connecting.</p>
            <Link className="btn" href="/post-requirement">Post buying requirement</Link>
            <Link className="btn secondary" href="/whatsapp-upload">Post requirement via WhatsApp</Link>
          </article>
          <article className="audienceCard sellerAudience">
            <span className="eyebrow">For suppliers</span>
            <h2>List ready stock, scrap lots or manufacturing capability with better trust control.</h2>
            <p>Upload stock images, documents, GST details, dispatch readiness and commercial terms. Verified suppliers receive cleaner buyer demand from the marketplace funnel.</p>
            <Link className="btn secondary" href="/sell">List supply</Link>
            <Link className="btn" href="/whatsapp-upload">Upload via WhatsApp</Link>
          </article>
          <article className="audienceCard logisticsAudience">
            <span className="eyebrow">For logistics</span>
            <h2>Coordinate city-to-city transport for metal consignments.</h2>
            <p>Capture pickup city, delivery city, quantity, material type, vehicle requirement and road transit estimate so the admin team can verify transporter quotes.</p>
            <Link className="btn dark" href="/post-requirement">Request logistics support</Link>
          </article>
        </div>
      </section>

      <section className="section knowledgeSection">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Trading knowledge hub</span>
              <h2 className="pageTitle">Professional guidance for first-time and repeat metal buyers.</h2>
              <p className="muted">Content pages support search visibility and help users understand grades, documents, pricing terms, dispatch readiness and safe marketplace behaviour.</p>
            </div>
          </div>
          <div className="grid cards3">
            <article className="card blogCard"><h3>How to post a safer steel requirement</h3><p className="muted">Mention grade, dimensions, weight, delivery PIN code, tolerance, test certificate needs and delivery timeline before asking for quotes.</p></article>
            <article className="card blogCard"><h3>Ready stock vs made-to-order supply</h3><p className="muted">Ready stock can include dispatch plus road time. Made-to-order material needs production or procurement confirmation before delivery commitment.</p></article>
            <article className="card blogCard"><h3>Why Talmech verifies before contact sharing</h3><p className="muted">Verification reduces junk enquiries, unclear pricing, fake stock claims and mismatched buyer/supplier conversations.</p></article>
          </div>
          <div className="seoKeywordCloud" aria-label="Common metal marketplace searches">
            {buyerKeywords.map((k) => <span key={k}>{k}</span>)}
          </div>
        </div>
      </section>

      <section className="section contactPreview" id="contact">
        <div className="container contactPreviewGrid">
          <div>
            <span className="eyebrow">Contact Talmech</span>
            <h2 className="pageTitle">Need help with sourcing, selling, scrap, logistics or verified onboarding?</h2>
            <p className="muted">Use the professional contact page for enquiry routing, WhatsApp support, call support and business verification details.</p>
          </div>
          <div className="contactPreviewActions">
            <a className="btn" href="tel:+917389642874">Call +91 7389642874</a>
            <a className="btn secondary" href="https://wa.me/917389642874" target="_blank" rel="noreferrer">WhatsApp Talmech</a>
            <Link className="btn dark" href="/contact">Open contact page</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
