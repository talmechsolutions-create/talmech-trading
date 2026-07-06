import Link from 'next/link';
import { tmisMaterials, tmisReviewNote } from '@/data/tmis';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

export default function TmisMaterialsIndexPage() {
  return (
    <main>
      <section className="productHero section">
        <div className="container">
          <span className="eyebrow">TMIS materials</span>
          <h1 className="pageTitle">Material-family records prepared for review.</h1>
          <p className="muted">{tmisReviewNote}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="grid cards3">
            {tmisMaterials.map((material) => (
              <Link className="card" href={`/materials/${material.slug}`} key={material.id}>
                <span className="eyebrow">{material.entityType}</span>
                <h2>{material.name}</h2>
                <p className="muted">{material.shortDescription}</p>
                <TmisStatusBadges
                  contentStatus={material.contentStatus}
                  verificationStatus={material.verificationStatus}
                  confidenceLevel={material.confidenceLevel}
                />
                <span className="btn secondary">Open record</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
