'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  tmisBuyerPlanningRows,
  tmisMetalOpportunitySummary,
  tmisOpportunityMapRows,
  tmisPlanningConnections,
  tmisPlanningSummary,
  tmisSellerPlanningRows,
} from '@/data/tmis';
import type {
  TmisBuyerPlanningRow,
  TmisOpportunityMapRow,
  TmisPlanningPriority,
  TmisSellerPlanningRow,
} from '@/data/tmis';
import TmisStatusBadges from '@/components/tmis/TmisStatusBadges';

type TmisPlanningView = 'overview' | 'buyers' | 'sellers' | 'opportunities';

type TmisPlanningWorkspaceProps = {
  view: TmisPlanningView;
  surface?: 'public' | 'admin';
};

const allOption = 'All';
const priorities: Array<TmisPlanningPriority | typeof allOption> = [allOption, 'High', 'Medium', 'Low'];

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function listText(values: string[]) {
  return values.join(', ');
}

function hasSelected(value: string, values: string[]) {
  return value === allOption || values.includes(value);
}

function buyerConnectedToSeller(buyer: string, seller: string) {
  if (seller === allOption) return true;
  return tmisOpportunityMapRows.some(
    (row) => row.target_buyers.includes(buyer) && row.target_sellers.includes(seller),
  );
}

function sellerConnectedToBuyer(seller: string, buyer: string) {
  if (buyer === allOption) return true;
  return tmisOpportunityMapRows.some(
    (row) => row.target_sellers.includes(seller) && row.target_buyers.includes(buyer),
  );
}

function StatusBadge({ label }: { label: string }) {
  return <span className="tmisPlanningStatusBadge">{label}</span>;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function AdminActionButtons({ rowId, viewHref }: { rowId: string; viewHref: string }) {
  return (
    <div className="tmisActionGroup" aria-label="TMIS planning admin actions">
      <Link className="tmisActionLink" href={viewHref}>View</Link>
      <Link className="tmisActionLink review" href={`/admin/tmis/planning#${rowId}`}>Review</Link>
      <Link className="tmisActionLink placeholder" href={`/admin/tmis/planning#${rowId}`}>Edit Placeholder</Link>
    </div>
  );
}

export default function TmisPlanningWorkspace({ view, surface = 'public' }: TmisPlanningWorkspaceProps) {
  const [metalFilter, setMetalFilter] = useState(allOption);
  const [buyerFilter, setBuyerFilter] = useState(allOption);
  const [sellerFilter, setSellerFilter] = useState(allOption);
  const [priorityFilter, setPriorityFilter] = useState<Array<TmisPlanningPriority | typeof allOption>[number]>(allOption);

  const metalOptions = useMemo(
    () => [allOption, ...unique([
      ...tmisBuyerPlanningRows.flatMap((row) => row.metals_they_buy),
      ...tmisSellerPlanningRows.flatMap((row) => row.metals_supported),
      ...tmisOpportunityMapRows.map((row) => row.metal),
    ])],
    [],
  );

  const buyerOptions = useMemo(
    () => [allOption, ...unique([
      ...tmisBuyerPlanningRows.map((row) => row.buyer_category),
      ...tmisOpportunityMapRows.flatMap((row) => row.target_buyers),
    ])],
    [],
  );

  const sellerOptions = useMemo(
    () => [allOption, ...unique([
      ...tmisSellerPlanningRows.map((row) => row.seller_category),
      ...tmisOpportunityMapRows.flatMap((row) => row.target_sellers),
    ])],
    [],
  );

  const buyers = useMemo(
    () => tmisBuyerPlanningRows.filter((row) => {
      const metalMatch = hasSelected(metalFilter, row.metals_they_buy);
      const buyerMatch = buyerFilter === allOption || row.buyer_category === buyerFilter;
      const sellerMatch = buyerConnectedToSeller(row.buyer_category, sellerFilter);
      const priorityMatch = priorityFilter === allOption || row.priority_level === priorityFilter;
      return metalMatch && buyerMatch && sellerMatch && priorityMatch;
    }),
    [buyerFilter, metalFilter, priorityFilter, sellerFilter],
  );

  const sellers = useMemo(
    () => tmisSellerPlanningRows.filter((row) => {
      const metalMatch = hasSelected(metalFilter, row.metals_supported);
      const buyerMatch = sellerConnectedToBuyer(row.seller_category, buyerFilter);
      const sellerMatch = sellerFilter === allOption || row.seller_category === sellerFilter;
      const priorityMatch = priorityFilter === allOption || row.priority_level === priorityFilter;
      return metalMatch && buyerMatch && sellerMatch && priorityMatch;
    }),
    [buyerFilter, metalFilter, priorityFilter, sellerFilter],
  );

  const opportunities = useMemo(
    () => tmisOpportunityMapRows.filter((row) => {
      const metalMatch = metalFilter === allOption || row.metal === metalFilter;
      const buyerMatch = hasSelected(buyerFilter, row.target_buyers);
      const sellerMatch = hasSelected(sellerFilter, row.target_sellers);
      const priorityMatch = priorityFilter === allOption || row.rfq_priority === priorityFilter || row.target_priority === priorityFilter;
      return metalMatch && buyerMatch && sellerMatch && priorityMatch;
    }),
    [buyerFilter, metalFilter, priorityFilter, sellerFilter],
  );

  const connections = useMemo(
    () => tmisPlanningConnections.filter((row) => {
      const metalMatch = metalFilter === allOption || row.metal === metalFilter;
      const buyerMatch = buyerFilter === allOption || row.buyer_category.includes(buyerFilter);
      const sellerMatch = sellerFilter === allOption || row.seller_category.includes(sellerFilter);
      const priorityMatch = priorityFilter === allOption || row.rfq_priority === priorityFilter || row.target_priority === priorityFilter;
      return metalMatch && buyerMatch && sellerMatch && priorityMatch;
    }),
    [buyerFilter, metalFilter, priorityFilter, sellerFilter],
  );

  const showBuyers = view === 'overview' || view === 'buyers';
  const showSellers = view === 'overview' || view === 'sellers';
  const showOpportunities = view === 'overview' || view === 'opportunities';
  const isAdmin = surface === 'admin';

  return (
    <div className={`tmisPlanningWorkspace ${isAdmin ? 'tmisPlanningAdmin' : ''}`}>
      {!isAdmin ? (
        <section className="section tmisPlanningHero">
          <div className="container tmisPlanningHeroGrid">
            <div>
              <span className="eyebrow">TMIS Phase 3A</span>
              <h1 className="pageTitle">Buyer & Seller Planning Workspace</h1>
              <p className="tmisPlanningLead">
                Decide which buyers, sellers, metals, grades, and product forms Talmech should target first. This is a draft planning system with no production database writes.
              </p>
              <TmisStatusBadges contentStatus="Draft" verificationStatus="Needs Review" confidenceLevel="Medium" />
              <div className="tmisPlanningActionRow">
                <Link className="btn" href="/tmis/planning/buyers">Buyer plan</Link>
                <Link className="btn secondary" href="/tmis/planning/sellers">Seller plan</Link>
                <Link className="btn secondary" href="/tmis/planning/opportunities">Opportunity map</Link>
              </div>
            </div>
            <aside className="tmisPlanningHeroPanel">
              <b>Planning boundary</b>
              <p>All rows remain Draft / Needs Review. No buyer, seller, product, or opportunity is marked Published or Verified.</p>
            </aside>
          </div>
        </section>
      ) : null}

      <section className={isAdmin ? '' : 'section'}>
        <div className={isAdmin ? '' : 'container'}>
          <div className="tmisPlanningKpiGrid">
            <div><b>{tmisPlanningSummary.buyers}</b><span>total buyer categories</span></div>
            <div><b>{tmisPlanningSummary.sellers}</b><span>total seller categories</span></div>
            <div><b>{tmisPlanningSummary.opportunities}</b><span>total opportunities</span></div>
            <div><b>{tmisPlanningSummary.highPriorityOpportunities}</b><span>high-priority opportunities</span></div>
          </div>

          {isAdmin ? (
            <section className="tmisPlanningAdminNotice">
              <div>
                <span className="eyebrow">Admin planning controls</span>
                <h2>Safe View, Review and Edit Placeholder workflow</h2>
                <p>These action buttons navigate planning rows only. No database save, publish, verify, or delete action is enabled in Phase 3A.</p>
              </div>
            </section>
          ) : null}

          <section className="tmisPlanningFilterPanel">
            <div>
              <span className="eyebrow">Planning filters</span>
              <h2>Focus the workspace</h2>
              <p>Filter by metal, buyer category, seller category, and priority to find the next target plan.</p>
            </div>
            <div className="tmisPlanningFilters">
              <label>
                Metal
                <select value={metalFilter} onChange={(event) => setMetalFilter(event.target.value)}>
                  {metalOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Buyer type
                <select value={buyerFilter} onChange={(event) => setBuyerFilter(event.target.value)}>
                  {buyerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Seller type
                <select value={sellerFilter} onChange={(event) => setSellerFilter(event.target.value)}>
                  {sellerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Priority
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as TmisPlanningPriority | typeof allOption)}>
                  {priorities.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
          </section>

          {view === 'overview' ? (
            <section className="tmisPlanningSummaryGrid">
              <article>
                <span className="eyebrow">System scope</span>
                <h2>{tmisPlanningSummary.buyers} buyers, {tmisPlanningSummary.sellers} sellers, {tmisPlanningSummary.opportunities} opportunities</h2>
                <p>Phase 3A connects buyer demand, seller capabilities, metals, grades, product forms, quality requirements, certificates, RFQ priority, and target priority.</p>
              </article>
              <article>
                <span className="eyebrow">Target signal</span>
                <h2>{tmisPlanningSummary.highPriorityOpportunities} high-priority opportunities</h2>
                <p>Use high-priority rows to decide where Talmech should build RFQ flows, supplier onboarding questions, and marketplace categories first.</p>
              </article>
            </section>
          ) : null}

          {view === 'overview' ? (
            <section className="tmisPlanningPanel">
              <div className="tmisPlanningPanelHead">
                <div>
                  <span className="eyebrow">Metal-wise opportunity summary</span>
                  <h2>Opportunity focus by metal</h2>
                  <p>This summary shows where planning demand is concentrated across metals, product forms, buyers, and sellers.</p>
                </div>
                <div className="tmisPlanningQuickLinks">
                  <Link className="btn secondary" href="/tmis/planning/buyers">Buyers</Link>
                  <Link className="btn secondary" href="/tmis/planning/sellers">Sellers</Link>
                  <Link className="btn secondary" href="/tmis/planning/opportunities">Opportunities</Link>
                </div>
              </div>
              <div className="tmisPlanningMetalSummaryGrid">
                {tmisMetalOpportunitySummary.map((row) => (
                  <article key={row.metal}>
                    <div>
                      <h3>{row.metal}</h3>
                      <StatusBadge label={row.status} />
                    </div>
                    <p><b>{row.opportunity_count}</b> opportunities, <b>{row.high_priority_count}</b> high-priority signals</p>
                    <span><b>Forms</b>{listText(row.product_forms)}</span>
                    <span><b>Buyers</b>{row.target_buyers.slice(0, 4).join(', ')}</span>
                    <span><b>Sellers</b>{row.target_sellers.slice(0, 4).join(', ')}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {showOpportunities ? <OpportunityTable rows={opportunities} isAdmin={isAdmin} /> : null}
          {showBuyers ? <BuyerTable rows={buyers} isAdmin={isAdmin} /> : null}
          {showSellers ? <SellerTable rows={sellers} isAdmin={isAdmin} /> : null}

          {view === 'overview' ? (
            <section className="tmisPlanningPanel">
              <div className="tmisPlanningPanelHead">
                <div>
                  <span className="eyebrow">Connection layer</span>
                  <h2>Metal, grade, product, buyer and seller links</h2>
                  <p>These rows show how opportunity planning connects core TMIS knowledge to marketplace planning.</p>
                </div>
              </div>
              <div className="tableWrap tmisPlanningTableWrap">
                <table className="tmisPlanningTable">
                  <thead>
                    <tr>
                      <th>metal</th>
                      <th>grade</th>
                      <th>product_form</th>
                      <th>buyer_category</th>
                      <th>seller_category</th>
                      <th>quality_requirement</th>
                      <th>certificate_requirement</th>
                      <th>marketplace_opportunity</th>
                      <th>rfq_priority</th>
                      <th>target_priority</th>
                      <th>business_reason</th>
                      {isAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((row) => {
                      const rowId = `connection-${slugify(row.marketplace_opportunity)}`;
                      return (
                      <tr id={rowId} key={`${row.marketplace_opportunity}-${row.product_form}`}>
                        <td>{row.metal}</td>
                        <td>{row.grade}</td>
                        <td>{row.product_form}</td>
                        <td>{row.buyer_category}</td>
                        <td>{row.seller_category}</td>
                        <td>{row.quality_requirement}</td>
                        <td>{row.certificate_requirement}</td>
                        <td>{row.marketplace_opportunity}</td>
                        <td><StatusBadge label={row.rfq_priority} /></td>
                        <td><StatusBadge label={row.target_priority} /></td>
                        <td>{row.business_reason}</td>
                        {isAdmin && (
                          <td className="tmisActionCell">
                            <AdminActionButtons rowId={rowId} viewHref={`/tmis/planning/opportunities#opportunity-${slugify(row.marketplace_opportunity)}`} />
                          </td>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function BuyerTable({ rows, isAdmin = false }: { rows: TmisBuyerPlanningRow[]; isAdmin?: boolean }) {
  return (
    <section className="tmisPlanningPanel">
      <div className="tmisPlanningPanelHead">
        <div>
          <span className="eyebrow">Buyer planning table</span>
          <h2>{rows.length} buyer categories</h2>
          <p>Use this table to decide which buyer segments Talmech should target and what their RFQ expectations look like.</p>
        </div>
        <Link className="btn secondary" href="/tmis/planning/buyers">Open buyer page</Link>
      </div>
      <div className="tableWrap tmisPlanningTableWrap">
        <table className="tmisPlanningTable">
          <thead>
            <tr>
              <th>buyer_category</th>
              <th>industries</th>
              <th>metals_they_buy</th>
              <th>product_forms_they_buy</th>
              <th>quality_expectations</th>
              <th>certificates_needed</th>
              <th>how_talmech_can_target</th>
              <th>priority_level</th>
              <th>status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowId = `buyer-${slugify(row.buyer_category)}`;
              return (
              <tr id={rowId} key={row.buyer_category}>
                <td>{row.buyer_category}</td>
                <td>{listText(row.industries)}</td>
                <td>{listText(row.metals_they_buy)}</td>
                <td>{listText(row.product_forms_they_buy)}</td>
                <td>{row.quality_expectations}</td>
                <td>{row.certificates_needed}</td>
                <td>{row.how_talmech_can_target}</td>
                <td><StatusBadge label={row.priority_level} /></td>
                <td><StatusBadge label={row.status} /></td>
                {isAdmin && (
                  <td className="tmisActionCell">
                    <AdminActionButtons rowId={rowId} viewHref={`/tmis/planning/buyers#${rowId}`} />
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SellerTable({ rows, isAdmin = false }: { rows: TmisSellerPlanningRow[]; isAdmin?: boolean }) {
  return (
    <section className="tmisPlanningPanel">
      <div className="tmisPlanningPanelHead">
        <div>
          <span className="eyebrow">Seller planning table</span>
          <h2>{rows.length} seller categories</h2>
          <p>Use this table to decide which supplier segments Talmech should onboard and what documents or capabilities are needed.</p>
        </div>
        <Link className="btn secondary" href="/tmis/planning/sellers">Open seller page</Link>
      </div>
      <div className="tableWrap tmisPlanningTableWrap">
        <table className="tmisPlanningTable">
          <thead>
            <tr>
              <th>seller_category</th>
              <th>what_they_supply</th>
              <th>metals_supported</th>
              <th>product_forms_supported</th>
              <th>capability_needed</th>
              <th>documents_needed</th>
              <th>onboarding_questions</th>
              <th>priority_level</th>
              <th>status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowId = `seller-${slugify(row.seller_category)}`;
              return (
              <tr id={rowId} key={row.seller_category}>
                <td>{row.seller_category}</td>
                <td>{row.what_they_supply}</td>
                <td>{listText(row.metals_supported)}</td>
                <td>{listText(row.product_forms_supported)}</td>
                <td>{row.capability_needed}</td>
                <td>{row.documents_needed}</td>
                <td>{listText(row.onboarding_questions)}</td>
                <td><StatusBadge label={row.priority_level} /></td>
                <td><StatusBadge label={row.status} /></td>
                {isAdmin && (
                  <td className="tmisActionCell">
                    <AdminActionButtons rowId={rowId} viewHref={`/tmis/planning/sellers#${rowId}`} />
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OpportunityTable({ rows, isAdmin = false }: { rows: TmisOpportunityMapRow[]; isAdmin?: boolean }) {
  return (
    <section className="tmisPlanningPanel">
      <div className="tmisPlanningPanelHead">
        <div>
          <span className="eyebrow">Opportunity map</span>
          <h2>{rows.length} marketplace opportunities</h2>
          <p>Use this table to decide which metal-product markets deserve RFQ workflow and supplier onboarding first.</p>
        </div>
        <Link className="btn secondary" href="/tmis/planning/opportunities">Open opportunity page</Link>
      </div>
      <div className="tableWrap tmisPlanningTableWrap">
        <table className="tmisPlanningTable">
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Metal</th>
              <th>Product Form</th>
              <th>Buyers</th>
              <th>Sellers</th>
              <th>Quality Focus</th>
              <th>Certificate</th>
              <th>Priority</th>
              <th>Business Reason</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowId = `opportunity-${slugify(row.opportunity_name)}`;
              return (
              <tr id={rowId} key={row.opportunity_name}>
                <td>{row.opportunity_name}</td>
                <td>{row.metal}</td>
                <td>{row.product_form}</td>
                <td>{listText(row.target_buyers)}</td>
                <td>{listText(row.target_sellers)}</td>
                <td>{row.quality_focus}</td>
                <td>{row.certificate_requirement}</td>
                <td><StatusBadge label={row.rfq_priority} /></td>
                <td>{row.business_reason}</td>
                <td><StatusBadge label={row.status} /></td>
                {isAdmin && (
                  <td className="tmisActionCell">
                    <AdminActionButtons rowId={rowId} viewHref={`/tmis/planning/opportunities#${rowId}`} />
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
