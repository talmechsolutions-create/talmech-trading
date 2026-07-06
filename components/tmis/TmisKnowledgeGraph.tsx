import type { TmisGraphEdge } from '@/data/tmis';

type TmisKnowledgeGraphProps = {
  edges: TmisGraphEdge[];
  title?: string;
};

export default function TmisKnowledgeGraph({ edges, title = 'Knowledge graph relationships' }: TmisKnowledgeGraphProps) {
  if (!edges.length) return null;

  return (
    <section className="section">
      <div className="container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">TMIS graph</span>
            <h2 className="pageTitle">{title}</h2>
            <p className="muted">Relationships are draft links for search, review, and future retrieval. They are not final technical equivalency claims.</p>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Relationship</th>
                <th>Object</th>
                <th>Confidence</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((edge, index) => (
                <tr key={`${edge.subject}-${edge.relationship}-${edge.object}-${index}`}>
                  <td><b>{edge.subject}</b></td>
                  <td>{edge.relationship}</td>
                  <td>{edge.object}</td>
                  <td>{edge.confidenceLevel}</td>
                  <td>{edge.sourceReference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
