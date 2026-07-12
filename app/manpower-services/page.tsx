import type { Metadata } from 'next';
import Link from 'next/link';

const pageTitle = 'Skilled Manpower Services for Manufacturing, Metal Inspection & Industrial Jobs | Talmech Trading';
const pageDescription = 'Hire skilled industrial manpower for metal inspection, NDT support, grinding, fabrication, quality inspection, loading supervision, plant support, and manufacturing operations through Talmech Trading.';
const canonicalUrl = 'https://www.talmechtrading.in/manpower-services';

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  keywords: [
    'skilled manpower services India',
    'industrial manpower services',
    'manufacturing manpower',
    'NDT manpower',
    'metal inspection services',
    'quality inspection manpower',
    'fabrication manpower',
    'grinding manpower',
    'plant maintenance manpower',
    'metal industry manpower',
    'inspection services for manufacturing',
    'Talmech manpower services',
  ],
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    type: 'website',
    siteName: 'Talmech Trading',
    images: [
      {
        url: '/images/products/fabricated-structures.webp',
        width: 1200,
        height: 800,
        alt: 'Industrial fabrication and skilled manpower services by Talmech Trading',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: ['/images/products/fabricated-structures.webp'],
  },
};

const trustPoints = [
  'Skilled industrial workers',
  'Metal and manufacturing focus',
  'Site-ready manpower support',
  'Quality and safety-oriented execution',
];

const services = [
  {
    title: 'NDT Support Manpower',
    copy: 'Talmech can support projects requiring manpower for non-destructive testing coordination, surface preparation, inspection assistance, documentation support, and site-level NDT workflow assistance.',
    points: ['UT support', 'DPT support', 'MPT support', 'Visual inspection assistance', 'Weld inspection coordination', 'Reporting and document collection support'],
    note: 'Actual certified testing should be performed by qualified or certified professionals as required by the client or project.',
  },
  {
    title: 'Metal Inspection Manpower',
    copy: 'Support for checking material condition, dimensions, grade markings, heat numbers, surface condition, rust or damage, packing condition, quantity verification, loading condition, and dispatch readiness.',
    points: ['Material condition checks', 'Heat number and grade marking review', 'Packing and loading condition checks', 'Quantity verification support'],
  },
  {
    title: 'Quality Inspection Support',
    copy: 'Quality manpower for manufacturing and metal supply workflows where a structured checklist, photo evidence, and dispatch discipline matter.',
    points: ['Pre-dispatch inspection', 'Incoming material inspection', 'Visual quality checks', 'Dimensional verification support', 'Checklist-based inspection', 'Documentation and photo evidence collection'],
  },
  {
    title: 'Metal Grinding & Finishing Manpower',
    copy: 'Skilled manpower for grinding, edge cleaning, burr removal, weld dressing, surface preparation, cutting support, polishing assistance, and finishing work for metal components, fabrication, and maintenance jobs.',
    points: ['Grinding support', 'Burr removal', 'Weld dressing', 'Surface preparation', 'Polishing assistance'],
  },
  {
    title: 'Fabrication & Workshop Support',
    copy: 'Manpower support for fabrication shops and industrial units that need dependable hands for daily workshop execution.',
    points: ['Helper manpower', 'Fitter support', 'Welder support coordination', 'Cutting and grinding support', 'Assembly assistance', 'Material movement support', 'Workshop operations support'],
  },
  {
    title: 'Loading, Unloading & Dispatch Supervision',
    copy: 'Manpower for safe material handling, loading supervision, dispatch verification, truck loading photo evidence, bundle or lot counting, and logistics coordination.',
    points: ['Loading supervision', 'Dispatch verification', 'Photo evidence', 'Lot counting', 'Logistics coordination'],
  },
  {
    title: 'Plant Maintenance Support',
    copy: 'Manpower for planned shutdown support, maintenance assistance, cleaning, dismantling support, fitting support, machine-area support, and industrial site coordination.',
    points: ['Shutdown assistance', 'Dismantling support', 'Cleaning support', 'Fitting assistance', 'Site coordination'],
  },
  {
    title: 'Warehouse & Inventory Support',
    copy: 'Manpower for stock counting, material segregation, tagging, binning, stockyard support, scrap sorting, bundle verification, and inventory documentation.',
    points: ['Stock counting', 'Material segregation', 'Tagging and binning', 'Stockyard support', 'Inventory documentation'],
  },
  {
    title: 'Scrap Sorting & Segregation Manpower',
    copy: 'Support for sorting ferrous and non-ferrous scrap, copper, aluminium, brass, stainless scrap segregation, lot preparation, weight verification support, and dispatch documentation.',
    points: ['Ferrous and non-ferrous sorting', 'Copper, aluminium, brass, and stainless segregation', 'Lot preparation', 'Weight verification support'],
  },
  {
    title: 'Safety & Site Support Manpower',
    copy: 'Site helper support, safety-aware manpower coordination, PPE-based job execution, supervisor coordination, and shift-based manpower planning.',
    points: ['Site helper support', 'PPE-based execution', 'Supervisor coordination', 'Shift planning'],
  },
];

const industries = [
  'Steel stockyards',
  'Aluminium and copper traders',
  'Foundries',
  'Fabrication units',
  'Machine shops',
  'Automotive component manufacturers',
  'Engineering companies',
  'Warehouses and logistics yards',
  'Scrap yards and recyclers',
  'EPC and project sites',
  'Heavy fabrication units',
  'Maintenance contractors',
];

const categories = [
  'Welders',
  'Fitters',
  'Grinders',
  'Fabrication helpers',
  'Inspection assistants',
  'Quality inspectors',
  'Loading supervisors',
  'Warehouse workers',
  'Scrap sorting workers',
  'Plant maintenance helpers',
  'Machine shop helpers',
  'Site supervisors',
  'Documentation assistants',
];

const steps = [
  ['Share manpower requirement', 'Client shares location, work type, manpower count, duration, skill requirement, shift timing, safety requirements, and site contact.'],
  ['Talmech reviews job scope', 'We review skill category, manpower count, availability, work risk, location, and timeline.'],
  ['Shortlist manpower / service partner', 'Talmech coordinates suitable manpower or service partner availability.'],
  ['Client confirmation', 'Client confirms scope, commercial terms, reporting time, safety/PPE requirement, and work duration.'],
  ['Execution and follow-up', 'Talmech supports coordination, reporting, updates, and follow-up.'],
];

const requestFields = [
  'Company name',
  'Contact person',
  'Mobile/email',
  'Location',
  'Type of manpower needed',
  'Number of workers',
  'Duration',
  'Shift timing',
  'Skill level',
  'Safety/PPE requirement',
  'Work description',
  'Photos/documents if any',
];

const faqs = [
  ['Does Talmech provide skilled manpower for manufacturing companies?', 'Yes, Talmech helps coordinate skilled and semi-skilled manpower for manufacturing, metal handling, inspection, grinding, fabrication support, quality checks, warehouse support, and site operations.'],
  ['Can I request NDT manpower support?', 'Yes, you can request manpower support for NDT-related workflow assistance such as preparation, inspection coordination, documentation support, and visual inspection assistance. Certified testing requirements should be handled by qualified/certified professionals as required.'],
  ['Can Talmech support metal inspection before dispatch?', 'Yes, Talmech can help coordinate pre-dispatch inspection support, photo evidence, quantity checks, surface condition checks, material marking checks, and loading verification.'],
  ['Can I hire manpower for short-term industrial work?', 'Yes, requirements may be short-term, project-based, shift-based, or recurring depending on location and availability.'],
  ['Does Talmech provide manpower for grinding and finishing?', 'Yes, Talmech can coordinate grinding, finishing, burr removal, surface preparation, edge cleaning, weld dressing, and related support manpower.'],
  ['Which locations are supported?', 'Talmech can review requirements across India and coordinate based on manpower availability, job type, duration, and commercial feasibility.'],
  ['What details should I share for manpower request?', 'Share location, work type, number of people required, duration, shift timing, skill requirement, safety/PPE needs, and site contact details.'],
  ['How do I request manpower support?', 'You can contact Talmech through WhatsApp, post a requirement, or submit your details through the platform.'],
];

const seoSections = [
  {
    title: 'Why manufacturers need reliable skilled manpower',
    copy: 'Manufacturing teams often lose time when skilled workers, inspection support, or site helpers are not available at the right moment. Talmech helps reduce that gap by reviewing the work scope, location, duration, and skill level before coordinating suitable industrial manpower or service support.',
  },
  {
    title: 'Skilled manpower for metal and industrial workflows',
    copy: 'Metal trading and manufacturing jobs need people who understand handling risk, material condition, dispatch discipline, surface preparation, and workshop coordination. Talmech manpower services are built around these practical metal industry workflows rather than generic staffing language.',
  },
  {
    title: 'Inspection and quality support for metal businesses',
    copy: 'Before material moves from a stockyard, shop floor, supplier yard, or project site, clients may need visual checks, measurement support, marking review, photo evidence, and document collection. Talmech can coordinate inspection support manpower for these verification-first workflows.',
  },
  {
    title: 'How Talmech helps reduce coordination gaps',
    copy: 'Clients can share one clear manpower requirement with location, timing, safety needs, work description, and supporting photos. Talmech then reviews fit, availability, and execution requirements so the next conversation starts with a clearer scope.',
  },
];

function jsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Talmech Skilled Manpower Services',
      serviceType: 'Skilled industrial manpower services for manufacturing, metal inspection, NDT support, fabrication, grinding, warehouse, dispatch, and plant maintenance work',
      provider: {
        '@type': 'Organization',
        name: 'Talmech Trading',
        url: 'https://www.talmechtrading.in',
      },
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      url: canonicalUrl,
      description: pageDescription,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Industrial manpower service categories',
        itemListElement: services.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.title,
            description: service.copy,
          },
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.talmechtrading.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Manpower Services',
          item: canonicalUrl,
        },
      ],
    },
  ];
}

export default function ManpowerServicesPage() {
  return (
    <main className="manpowerPage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />

      <section className="manpowerHero">
        <div className="container manpowerHeroGrid">
          <div className="manpowerHeroCopy">
            <span className="eyebrow">Talmech Skilled Manpower Services</span>
            <h1>Skilled Manpower Services for Manufacturing, Metal &amp; Industrial Operations</h1>
            <p>
              Talmech helps manufacturers, traders, suppliers, foundries, fabrication units, warehouses, and project teams
              access reliable skilled manpower for inspection, processing, handling, quality checks, and site execution.
            </p>
            <div className="manpowerActions">
              <Link className="btn" href="/contact">Request Manpower Support</Link>
              <a className="btn secondary" href="https://wa.me/917389642874?text=I%20need%20skilled%20manpower%20support%20for%20an%20industrial%20job" target="_blank" rel="noreferrer">Talk to Talmech on WhatsApp</a>
              <Link className="btn dark" href="/post-requirement">Post Your Requirement</Link>
            </div>
          </div>
          <div className="manpowerHeroVisual" aria-label="Industrial manpower support">
            <img src="/images/products/fabricated-structures.webp" alt="Industrial fabrication and site manpower support" />
            <div>
              <b>Inspection, fabrication, grinding, dispatch and plant support</b>
              <span>Coordinated for location, duration, skill level and compliance needs.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="manpowerTrust">
        <div className="container manpowerTrustGrid">
          {trustPoints.map((point) => <article key={point}>{point}</article>)}
        </div>
      </section>

      <section className="manpowerSection">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Services</span>
              <h2>Industrial manpower services for metal and manufacturing teams</h2>
            </div>
            <p className="muted">From inspection assistance to stockyard work, Talmech coordinates manpower around real site conditions.</p>
          </div>
          <div className="manpowerServiceGrid">
            {services.map((service) => (
              <article className="manpowerCard" key={service.title}>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
                <ul>
                  {service.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
                {service.note && <p className="manpowerNote">{service.note}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="manpowerBand">
        <div className="container manpowerSplit">
          <div>
            <span className="eyebrow">Industries served</span>
            <h2>Built for industrial yards, workshops and project sites</h2>
            <p>
              Talmech reviews each manpower requirement by work type, location, duration, shift planning, skill level,
              safety requirements, and coordination complexity.
            </p>
          </div>
          <div className="manpowerListGrid">
            {industries.map((industry) => <span key={industry}>{industry}</span>)}
          </div>
        </div>
      </section>

      <section className="manpowerSection">
        <div className="container manpowerCategoryLayout">
          <div className="manpowerPanel">
            <span className="eyebrow">Manpower categories</span>
            <h2>Coordinate the right skill category before the job starts</h2>
            <p>
              Talmech coordinates skilled manpower availability based on client requirement, location, duration,
              skill level, and compliance needs.
            </p>
          </div>
          <div className="manpowerCategoryGrid">
            {categories.map((category) => <span key={category}>{category}</span>)}
          </div>
        </div>
      </section>

      <section className="manpowerSteps">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>Simple coordination for site-based manpower requirements</h2>
            </div>
          </div>
          <div className="manpowerStepGrid">
            {steps.map(([title, copy], index) => (
              <article key={title}>
                <span>{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="manpowerCta">
        <div className="container manpowerCtaBox">
          <div>
            <span className="eyebrow">Request manpower support</span>
            <h2>Share the job scope and Talmech will review the requirement</h2>
            <p>
              Use the existing Talmech requirement flow or WhatsApp upload to share manpower type, worker count,
              location, duration, shift timing, safety/PPE needs, and work description.
            </p>
            <div className="manpowerActions">
              <Link className="btn" href="/post-requirement">Post Requirement</Link>
              <Link className="btn secondary" href="/whatsapp-upload">WhatsApp Upload</Link>
              <Link className="btn dark" href="/contact">Contact Talmech</Link>
            </div>
          </div>
          <div className="manpowerFieldGrid">
            {requestFields.map((field) => <span key={field}>{field}</span>)}
          </div>
        </div>
      </section>

      <section className="manpowerSection">
        <div className="container manpowerSeoGrid">
          {seoSections.map((section) => (
            <article key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="manpowerBand light">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">FAQ</span>
              <h2>Skilled manpower services FAQ</h2>
            </div>
          </div>
          <div className="manpowerFaqGrid">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="manpowerSection">
        <div className="container manpowerCompliance">
          <div>
            <span className="eyebrow">Compliance note</span>
            <h2>Scope, safety and statutory checks should be confirmed before work starts</h2>
            <p>
              Talmech coordinates manpower/service support based on client requirements and available partners.
              Final scope, safety compliance, statutory compliance, certifications, insurance, and site permissions
              should be confirmed between the client and service provider before work starts.
            </p>
          </div>
          <div className="manpowerInternalLinks">
            <Link href="/post-requirement">Post Requirement</Link>
            <Link href="/whatsapp-upload">WhatsApp Upload</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/logistics">Logistics</Link>
            <Link href="/sell">Sell on Talmech</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
