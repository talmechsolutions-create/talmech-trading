import Link from 'next/link';
import { tmisReviewNote } from '@/data/tmis';
import type { TmisProcurementChecklist } from '@/data/tmis';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

type TmisRfqChecklistViewProps = {
  checklist: TmisProcurementChecklist;
};

function FieldTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="tableWrap">
      <table>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TmisRfqChecklistView({ checklist }: TmisRfqChecklistViewProps) {
  return (
    <main>
      <section className="productHero section">
        <div className="container productHeroGrid">
          <div>
            <span className="eyebrow">TMIS RFQ workflow</span>
            <h1 className="pageTitle">{checklist.name}</h1>
            <p className="muted">{checklist.intro}</p>
            <TmisStatusBadges
              contentStatus={checklist.contentStatus}
              verificationStatus={checklist.verificationStatus}
              confidenceLevel={checklist.confidenceLevel}
            />
            <div className="row" style={{ justifyContent: 'flex-start', marginTop: 18 }}>
              <Link className="btn" href="/post-requirement?metal=steel&product=EN24%20Round%20Bar">Start existing Talmech requirement form</Link>
              <Link className="btn secondary" href="/products/en24-round-bar">Review product page</Link>
              <Link className="btn dark" href="/marketplace/en24-round-bar">Open marketplace draft</Link>
            </div>
          </div>
          <aside className="panel">
            <b>Not a final technical specification</b>
            <p className="muted">{tmisReviewNote}</p>
            <div className="listingMeta">
              <span className="pill">{checklist.sourceDocument}</span>
              <span className="pill">{checklist.lastUpdated}</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid cards2">
            <article className="panel">
              <h2>Buyer RFQ fields</h2>
              <FieldTable rows={checklist.rfqFields} />
            </article>
            <article className="panel">
              <h2>Recommended RFQ format</h2>
              <div className="card noShadow">
                {checklist.recommendedFormat.map((line) => <p key={line}>{line}</p>)}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid cards3">
            <article className="card">
              <h2>Quality checks</h2>
              <FieldTable rows={checklist.qualityChecks} />
            </article>
            <article className="card">
              <h2>Supplier checks</h2>
              <FieldTable rows={checklist.supplierChecks} />
            </article>
            <article className="card">
              <h2>Procurement risks</h2>
              <FieldTable rows={checklist.risks} />
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
