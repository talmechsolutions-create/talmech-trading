'use client';

import { useMemo, useState } from 'react';
import { tmisAdminGroups, tmisKnowledgeGraph, tmisReviewNote, tmisSources } from '@/data/tmis';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

const tabs = [
  ...tmisAdminGroups.map((group) => ({ key: group.key, label: group.label })),
  { key: 'sources', label: 'Sources' },
  { key: 'graph', label: 'Knowledge Graph' },
];

export default function TmisAdminConsole() {
  const [active, setActive] = useState<string>('materials');
  const [query, setQuery] = useState('');

  const activeGroup = tmisAdminGroups.find((group) => group.key === active);

  const entityRows = useMemo(() => {
    const q = query.toLowerCase().trim();
    const rows = activeGroup?.rows || [];
    if (!q) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [activeGroup, query]);

  const sourceRows = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return tmisSources;
    return tmisSources.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [query]);

  const graphRows = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return tmisKnowledgeGraph;
    return tmisKnowledgeGraph.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [query]);

  return (
    <section className="adminShell">
      <div className="container section">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">TMIS admin</span>
            <h1 className="pageTitle">Manufacturing intelligence review dashboard</h1>
            <p className="muted">{tmisReviewNote}</p>
          </div>
        </div>

        <div className="grid cards4">
          <div className="card"><b>{tmisAdminGroups.reduce((sum, group) => sum + group.rows.length, 0)}</b><p className="muted">entity records</p></div>
          <div className="card"><b>{tmisSources.length}</b><p className="muted">source rows</p></div>
          <div className="card"><b>{tmisKnowledgeGraph.length}</b><p className="muted">graph edges</p></div>
          <div className="card"><b>0</b><p className="muted">verified records</p></div>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <div className="sectionHead">
            <div>
              <h2>Review tables</h2>
              <p className="muted">Phase 1 is read-only seed intelligence. Edit workflow and persistence can be added after the content model is approved.</p>
            </div>
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search TMIS records..." style={{ maxWidth: 340 }} />
          </div>

          <div className="adminTabs">
            {tabs.map((tab) => (
              <button type="button" className={active === tab.key ? 'active' : ''} onClick={() => setActive(tab.key)} key={tab.key}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeGroup && (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Parent / Category</th>
                    <th>Status</th>
                    <th>Source document</th>
                    <th>SEO keyword</th>
                  </tr>
                </thead>
                <tbody>
                  {entityRows.map((row) => (
                    <tr key={row.id}>
                      <td><b>{row.name}</b><br /><small className="muted">{row.shortDescription}</small></td>
                      <td>{row.entityType}</td>
                      <td>{[row.parent, row.category].filter(Boolean).join(' / ') || '-'}</td>
                      <td>
                        <TmisStatusBadges
                          contentStatus={row.contentStatus}
                          verificationStatus={row.verificationStatus}
                          confidenceLevel={row.confidenceLevel}
                        />
                      </td>
                      <td><code>{row.sourceDocument}</code></td>
                      <td>{row.primaryKeyword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === 'sources' && (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Source ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Entity</th>
                    <th>Fact supported</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceRows.map((row) => (
                    <tr key={row.sourceId}>
                      <td><b>{row.sourceId}</b></td>
                      <td>{row.title}</td>
                      <td>{row.sourceType}</td>
                      <td>{row.entityName}</td>
                      <td>{row.factSupported}</td>
                      <td><span className="pill gold">{row.verificationStatus}</span><span className="pill green">{row.confidenceLevel} confidence</span></td>
                      <td>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === 'graph' && (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Relationship</th>
                    <th>Object</th>
                    <th>Confidence</th>
                    <th>Source</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {graphRows.map((row, index) => (
                    <tr key={`${row.subject}-${row.relationship}-${row.object}-${index}`}>
                      <td><b>{row.subject}</b></td>
                      <td>{row.relationship}</td>
                      <td>{row.object}</td>
                      <td>{row.confidenceLevel}</td>
                      <td>{row.sourceReference}</td>
                      <td>{row.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
