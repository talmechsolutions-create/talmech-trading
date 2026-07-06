import type { Metadata } from 'next';
import Link from 'next/link';
import { tmisMaterials, tmisReviewNote } from '@/lib/tmisData';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

export const metadata: Metadata = {
  title: 'TMIS Materials | Draft Manufacturing Intelligence Records',
  description:
    'Draft TMIS material records for Talmech Manufacturing Intelligence System, with review status, confidence labels, source documents, and public procurement links.',
  alternates: { canonical: '/manufacturing-intelligence/materials' },
};

export default function TmisMaterialsPage() {
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
              <Link className="card" href={`/manufacturing-intelligence/materials/${material.slug}`} key={material.id}>
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
