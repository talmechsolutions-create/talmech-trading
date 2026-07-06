import Link from 'next/link';
import { tmisMetalRecords } from '@/data/tmis';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

function previewList(items: string[], count = 3) {
  return items.slice(0, count).join(', ');
}

export default function TmisMetalsIndexPage() {
  return (
    <main className="tmisMetalShell">
      <section className="section tmisMetalHero">
        <div className="container tmisMetalHeroGrid">
          <div>
            <span className="eyebrow">Metal Intelligence Workspace</span>
            <h1 className="pageTitle">Understand metals, buyers, sellers, quality needs, and marketplace opportunities.</h1>
            <p className="tmisMetalLead">
              TMIS is expanding from record review into a business-friendly knowledge system for metal planning. Every profile is still a draft intelligence record and requires review before commercial or technical reliance.
            </p>
            <TmisStatusBadges contentStatus="Draft" verificationStatus="Needs Review" confidenceLevel="Medium" />
            <div className="tmisMetalActionRow">
              <Link className="btn" href="/tmis">TMIS home</Link>
              <Link className="btn secondary" href="/admin/tmis">Admin review</Link>
            </div>
          </div>
          <aside className="tmisMetalHeroPanel">
            <b>{tmisMetalRecords.length} metal intelligence profiles</b>
            <p>Steel, copper, aluminium, stainless steel, and brass are structured for buyer planning, seller onboarding, RFQ design, and marketplace mapping.</p>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">Draft metal profiles</span>
              <h2 className="pageTitle">Open a metal intelligence profile.</h2>
              <p className="tmisMetalText">Each card shows the business view first: product forms, buyer categories, quality focus, and review status.</p>
            </div>
          </div>

          <div className="tmisMetalCardGrid">
            {tmisMetalRecords.map((metal) => (
              <article className="tmisMetalCard" key={metal.slug}>
                <div>
                  <span className="eyebrow">{metal.metal_family}</span>
                  <h3>{metal.metal_name}</h3>
                  <p>{metal.short_description}</p>
                </div>

                <div className="tmisMetalCardFacts">
                  <span><b>Top product forms</b>{previewList(metal.common_product_forms)}</span>
                  <span><b>Top buyer categories</b>{previewList(metal.buyer_categories)}</span>
                  <span><b>Quality focus</b>{previewList(metal.quality_checks, 2)}</span>
                </div>

                <div>
                  <TmisStatusBadges
                    contentStatus={metal.content_status}
                    verificationStatus={metal.verification_status}
                    confidenceLevel={metal.confidence_level}
                  />
                  <Link className="btn secondary tmisMetalCardButton" href={`/tmis/metals/${metal.slug}`}>
                    Open intelligence profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
