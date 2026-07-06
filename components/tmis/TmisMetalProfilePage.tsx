import Link from 'next/link';
import type { TmisMetalRecord } from '@/data/tmis';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

type TmisMetalProfilePageProps = {
  metal: TmisMetalRecord;
};

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="tmisMetalChipList">
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="tmisMetalSectionCard">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

export default function TmisMetalProfilePage({ metal }: TmisMetalProfilePageProps) {
  return (
    <main className="tmisMetalShell">
      <section className="section tmisMetalHero">
        <div className="container tmisMetalHeroGrid">
          <div>
            <span className="eyebrow">{metal.metal_family}</span>
            <h1 className="pageTitle">{metal.metal_name} Metal Intelligence</h1>
            <p className="tmisMetalLead">{metal.short_description}</p>
            <TmisStatusBadges
              contentStatus={metal.content_status}
              verificationStatus={metal.verification_status}
              confidenceLevel={metal.confidence_level}
            />
            <div className="tmisMetalActionRow">
              <Link className="btn" href="/tmis/metals">All metals</Link>
              <Link className="btn secondary" href="/tmis">TMIS home</Link>
            </div>
          </div>

          <aside className="tmisMetalHeroPanel">
            <b>Draft profile boundary</b>
            <p>This page supports business planning, RFQ design, source review, and marketplace strategy. It does not verify grades, standards, or supplier claims.</p>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container tmisMetalSectionGrid">
          <SectionCard eyebrow="Executive overview" title="Business role in TMIS">
            <p>{metal.industrial_importance}</p>
          </SectionCard>

          <SectionCard eyebrow="Metal understanding" title="What this metal is">
            <p>{metal.short_description}</p>
            <div className="tmisMetalDefinitionBox">
              <b>Planning family</b>
              <span>{metal.metal_family}</span>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Grade planning" title="Common grades">
            <ChipList items={metal.common_grades} />
          </SectionCard>

          <SectionCard eyebrow="Product strategy" title="Common product forms">
            <ChipList items={metal.common_product_forms} />
          </SectionCard>

          <SectionCard eyebrow="Demand planning" title="Where it is used">
            <div className="tmisMetalTwoColumnList">
              <div>
                <b>Common uses</b>
                <ChipList items={metal.common_uses} />
              </div>
              <div>
                <b>Industry applications</b>
                <ChipList items={metal.industry_applications} />
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Buyer intelligence" title="Buyer categories">
            <ChipList items={metal.buyer_categories} />
          </SectionCard>

          <SectionCard eyebrow="Seller intelligence" title="Seller / supplier categories">
            <ChipList items={metal.seller_categories} />
          </SectionCard>

          <SectionCard eyebrow="Quality intelligence" title="Quality checks">
            <ChipList items={metal.quality_checks} />
          </SectionCard>

          <SectionCard eyebrow="Documentation" title="Certificates and documents">
            <ChipList items={metal.certificates_documents} />
          </SectionCard>

          <SectionCard eyebrow="Procurement control" title="Procurement risks">
            <ul className="tmisMetalRiskList">
              {metal.procurement_risks.map((risk) => <li key={risk}>{risk}</li>)}
            </ul>
          </SectionCard>

          <SectionCard eyebrow="Buyer planning" title="Buyer planning table">
            <div className="tableWrap tmisMetalTableWrap">
              <table className="tmisMetalTable">
                <thead>
                  <tr>
                    <th>buyer_category</th>
                    <th>what_they_buy</th>
                    <th>why_they_buy_it</th>
                    <th>quality_expectation</th>
                    <th>how_talmech_can_target_them</th>
                  </tr>
                </thead>
                <tbody>
                  {metal.buyer_planning_notes.map((row) => (
                    <tr key={row.buyer_category}>
                      <td>{row.buyer_category}</td>
                      <td>{row.what_they_buy}</td>
                      <td>{row.why_they_buy_it}</td>
                      <td>{row.quality_expectation}</td>
                      <td>{row.how_talmech_can_target_them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Seller planning" title="Seller planning table">
            <div className="tableWrap tmisMetalTableWrap">
              <table className="tmisMetalTable">
                <thead>
                  <tr>
                    <th>seller_category</th>
                    <th>what_they_supply</th>
                    <th>capability_needed</th>
                    <th>documents_needed</th>
                    <th>how_talmech_can_onboard_them</th>
                  </tr>
                </thead>
                <tbody>
                  {metal.seller_planning_notes.map((row) => (
                    <tr key={row.seller_category}>
                      <td>{row.seller_category}</td>
                      <td>{row.what_they_supply}</td>
                      <td>{row.capability_needed}</td>
                      <td>{row.documents_needed}</td>
                      <td>{row.how_talmech_can_onboard_them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Marketplace strategy" title="Marketplace opportunity map">
            <div className="tableWrap tmisMetalTableWrap">
              <table className="tmisMetalTable">
                <thead>
                  <tr>
                    <th>product_form</th>
                    <th>target_buyers</th>
                    <th>target_sellers</th>
                    <th>quality_focus</th>
                    <th>RFQ_priority</th>
                  </tr>
                </thead>
                <tbody>
                  {metal.marketplace_opportunities.map((row) => (
                    <tr key={`${row.product_form}-${row.RFQ_priority}`}>
                      <td>{row.product_form}</td>
                      <td>{row.target_buyers}</td>
                      <td>{row.target_sellers}</td>
                      <td>{row.quality_focus}</td>
                      <td>{row.RFQ_priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard eyebrow="RFQ design" title="RFQ questions">
            <ul className="tmisMetalRiskList">
              {metal.rfq_questions.map((question) => <li key={question}>{question}</li>)}
            </ul>
          </SectionCard>

          <SectionCard eyebrow="Relationship planning" title="Related metals and products">
            <div className="tmisMetalTwoColumnList">
              <div>
                <b>Related metals</b>
                <ChipList items={metal.related_metals} />
              </div>
              <div>
                <b>Related products</b>
                <ChipList items={metal.related_products} />
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Review state" title="Verification status">
            <div className="tmisMetalVerificationBox">
              <TmisStatusBadges
                contentStatus={metal.content_status}
                verificationStatus={metal.verification_status}
                confidenceLevel={metal.confidence_level}
              />
              <p>
                All metal intelligence is a Phase 2A-style public knowledge draft. It supports planning and review only. No metal profile is Verified, Published, or connected to production database writes.
              </p>
            </div>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}
