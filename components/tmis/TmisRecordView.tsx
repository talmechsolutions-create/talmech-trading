import Link from 'next/link';
import { tmisKnowledgeGraph, tmisReviewNote } from '@/data/tmis';
import type { TmisEntity } from '@/data/tmis';
import TmisKnowledgeGraph from '@/components/tmis/TmisKnowledgeGraph';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

type TmisRecordViewProps = {
  entity: TmisEntity;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
};

function graphFor(name: string) {
  return tmisKnowledgeGraph.filter((edge) => edge.subject === name || edge.object === name).slice(0, 14);
}

export default function TmisRecordView({ entity, primaryAction, secondaryAction }: TmisRecordViewProps) {
  const edges = graphFor(entity.name);

  return (
    <main>
      <section className="productHero section">
        <div className="container productHeroGrid">
          <div>
            <span className="eyebrow">Talmech Manufacturing Intelligence System</span>
            <h1 className="pageTitle">{entity.name}</h1>
            <p className="muted">{entity.shortDescription}</p>
            <TmisStatusBadges
              contentStatus={entity.contentStatus}
              verificationStatus={entity.verificationStatus}
              confidenceLevel={entity.confidenceLevel}
            />
            <div className="row" style={{ justifyContent: 'flex-start', marginTop: 18 }}>
              {primaryAction && <Link className="btn" href={primaryAction.href}>{primaryAction.label}</Link>}
              {secondaryAction && <Link className="btn secondary" href={secondaryAction.href}>{secondaryAction.label}</Link>}
              <Link className="btn dark" href="/tmis">TMIS home</Link>
            </div>
          </div>
          <aside className="panel">
            <b>Review boundary</b>
            <p className="muted">{tmisReviewNote}</p>
            <div className="listingMeta">
              <span className="pill">Source: {entity.sourceDocument}</span>
              <span className="pill">Updated: {entity.lastUpdated}</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid cards2">
            <article className="panel">
              <span className="eyebrow">{entity.entityType}</span>
              <h2>Record overview</h2>
              <p className="muted">{entity.fullDescription}</p>
              <div className="listingMeta">
                {entity.parent && <span className="pill">{entity.parent}</span>}
                {entity.category && <span className="pill">{entity.category}</span>}
                <span className="pill">{entity.primaryKeyword}</span>
              </div>
            </article>
            <article className="panel">
              <h2>SEO and source metadata</h2>
              <p><b>SEO title:</b> {entity.seoTitle}</p>
              <p className="muted">{entity.metaDescription}</p>
              <div className="productChipCloud">
                {entity.secondaryKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
              </div>
            </article>
          </div>

          <div className="panel" style={{ marginTop: 22 }}>
            <h2>Database-ready fields</h2>
            <div className="tableWrap">
              <table>
                <tbody>
                  {entity.fields.map((field) => (
                    <tr key={field.label}>
                      <th>{field.label}</th>
                      <td>{field.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid cards2">
            {entity.sections.map((section) => (
              <article className="card" key={section.title}>
                <h2>{section.title}</h2>
                {section.body && <p className="muted">{section.body}</p>}
                {section.items && (
                  <div className="listingMeta">
                    {section.items.map((item) => <span className="pill" key={item}>{item}</span>)}
                  </div>
                )}
                {section.fields && (
                  <div className="tableWrap">
                    <table>
                      <tbody>
                        {section.fields.map((field) => (
                          <tr key={field.label}>
                            <th>{field.label}</th>
                            <td>{field.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {entity.relatedLinks?.length ? (
        <section className="section">
          <div className="container panel">
            <div className="sectionHead">
              <div>
                <span className="eyebrow">TMIS cross-links</span>
                <h2>Related intelligence records</h2>
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-start' }}>
              {entity.relatedLinks.map((link) => (
                <Link className="btn secondary" href={link.href} key={link.href}>{link.label}</Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <TmisKnowledgeGraph edges={edges} title={`${entity.name} relationship map`} />
    </main>
  );
}
