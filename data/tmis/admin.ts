import {
  tmisAllEntityRecords,
  tmisKnowledgeGraph,
  tmisMarketplaceListings,
  tmisSources,
} from '@/data/tmis/seed';
import type {
  TmisConfidenceLevel,
  TmisContentStatus,
  TmisEntity,
  TmisField,
  TmisGraphEdge,
  TmisSource,
  TmisVerificationStatus,
} from '@/data/tmis/types';

export type TmisAdminArea =
  | 'materials'
  | 'grades'
  | 'products'
  | 'quality'
  | 'marketplace'
  | 'sources'
  | 'knowledge-graph'
  | 'review';

export type TmisAdminRecord = {
  key: string;
  area: TmisAdminArea;
  slug: string;
  reviewSlug: string;
  name: string;
  entityType: string;
  contentStatus?: TmisContentStatus;
  verificationStatus: TmisVerificationStatus | TmisSource['verificationStatus'];
  confidenceLevel: TmisConfidenceLevel;
  sourceDocument: string;
  sourceReference: string;
  primaryKeyword: string;
  summary: string;
  seoTitle: string;
  metaDescription: string;
  fields: TmisField[];
  graphEdges: TmisGraphEdge[];
  sourceReferences: TmisSource[];
  verificationNotes: string[];
  originalityCheck: string[];
  reasonReviewNeeded: string;
  nextReviewAction: string;
  viewHref: string;
  reviewHref: string;
  editHref: string;
  entity?: TmisEntity;
  source?: TmisSource;
};

type EntityRouteSpec = {
  id: string;
  area: Exclude<TmisAdminArea, 'sources' | 'knowledge-graph' | 'review'>;
  slug: string;
  reviewSlug: string;
  viewHref: string;
  reasonReviewNeeded: string;
  nextReviewAction: string;
};

const entityRouteSpecs: EntityRouteSpec[] = [
  {
    id: 'mat-steel',
    area: 'materials',
    slug: 'steel',
    reviewSlug: 'steel',
    viewHref: '/admin/tmis/materials/steel',
    reasonReviewNeeded: 'Parent material-family record influences grade, product, quality, marketplace, and graph relationships.',
    nextReviewAction: 'Confirm material-family taxonomy, common forms, quality checks, and source support before Phase 2B CRUD modeling.',
  },
  {
    id: 'grade-en24',
    area: 'grades',
    slug: 'en24',
    reviewSlug: 'en24',
    viewHref: '/admin/tmis/grades/en24',
    reasonReviewNeeded: 'EN24 aliases, application notes, and equivalent-grade wording must stay conditional until standards review.',
    nextReviewAction: 'Review grade aliases, application wording, procurement fields, and quality requirements against accepted references.',
  },
  {
    id: 'prod-mild-steel-round-bar',
    area: 'products',
    slug: 'mild-steel-round-bar',
    reviewSlug: 'mild-steel-round-bar',
    viewHref: '/admin/tmis/products/mild-steel-round-bar',
    reasonReviewNeeded: 'Broad product naming can hide grade-specific requirements and buyer specification gaps.',
    nextReviewAction: 'Confirm required buyer fields, quality checkpoints, and whether the product taxonomy needs grade-level variants.',
  },
  {
    id: 'prod-en24-round-bar',
    area: 'products',
    slug: 'en24-round-bar',
    reviewSlug: 'en24-round-bar',
    viewHref: '/admin/tmis/products/en24-round-bar',
    reasonReviewNeeded: 'Buyer-facing EN24 Round Bar guidance must preserve RFQ and quality caveats before any publishing workflow.',
    nextReviewAction: 'Review product claims, RFQ fields, MTC requirements, and supplier capability language.',
  },
  {
    id: 'quality-hardness-testing',
    area: 'quality',
    slug: 'hardness-testing',
    reviewSlug: 'hardness-testing',
    viewHref: '/admin/tmis/quality/hardness-testing',
    reasonReviewNeeded: 'Hardness method, scale, sampling, and acceptance wording must not imply unverified inspection standards.',
    nextReviewAction: 'Confirm method and scale language, sampling notes, and buyer requirement boundaries.',
  },
  {
    id: 'quality-material-test-certificate',
    area: 'quality',
    slug: 'material-test-certificate',
    reviewSlug: 'material-test-certificate',
    viewHref: '/admin/tmis/quality/material-test-certificate',
    reasonReviewNeeded: 'Certificate wording has traceability and compliance implications and must remain review-gated.',
    nextReviewAction: 'Review certificate fields, traceability risks, source authority, and legal/compliance caveats.',
  },
  {
    id: 'listing-en24-round-bar',
    area: 'marketplace',
    slug: 'en24-round-bar',
    reviewSlug: 'en24-round-bar-marketplace',
    viewHref: '/admin/tmis/marketplace/en24-round-bar',
    reasonReviewNeeded: 'Marketplace wording must avoid verified supplier, availability, lead-time, MOQ, and pricing claims.',
    nextReviewAction: 'Review marketplace filters, RFQ fields, supplier capability claims, and listing disclaimers.',
  },
];

const defaultVerificationNotes = [
  'Confirm source authority and whether the referenced document supports each technical claim.',
  'Check that all equivalency, standards, certificate, and suitability language remains conditional.',
  'Validate buyer-facing wording against procurement and quality review requirements.',
];

const defaultOriginalityCheck = [
  'Original TMIS wording is used for admin review.',
  'No paid standards tables or supplier paragraphs are copied into the admin workflow.',
  'Unverified technical claims remain marked Draft, Needs Review, or Pending Verification.',
];

function graphFor(name: string) {
  return tmisKnowledgeGraph.filter((edge) => edge.subject === name || edge.object === name);
}

function sourceRefsFor(entity: TmisEntity, edges: TmisGraphEdge[]) {
  const sourceIds = new Set(edges.map((edge) => edge.sourceReference).filter((id) => /^S\d+/i.test(id)));
  return tmisSources.filter(
    (source) =>
      source.entityName === entity.name ||
      source.entityName === entity.parent ||
      sourceIds.has(source.sourceId),
  );
}

function entityRecordFromSpec(spec: EntityRouteSpec): TmisAdminRecord {
  const entity = tmisAllEntityRecords.find((item) => item.id === spec.id);
  if (!entity) throw new Error(`Missing TMIS entity for admin spec ${spec.id}`);

  const edges = graphFor(entity.name);
  const sources = sourceRefsFor(entity, edges);
  return {
    key: entity.id,
    area: spec.area,
    slug: spec.slug,
    reviewSlug: spec.reviewSlug,
    name: entity.name,
    entityType: entity.entityType,
    contentStatus: entity.contentStatus,
    verificationStatus: entity.verificationStatus,
    confidenceLevel: entity.confidenceLevel,
    sourceDocument: entity.sourceDocument,
    sourceReference: sources.map((source) => source.sourceId).join(', ') || entity.sourceDocument,
    primaryKeyword: entity.primaryKeyword,
    summary: entity.fullDescription,
    seoTitle: entity.seoTitle,
    metaDescription: entity.metaDescription,
    fields: entity.fields,
    graphEdges: edges,
    sourceReferences: sources,
    verificationNotes: defaultVerificationNotes,
    originalityCheck: defaultOriginalityCheck,
    reasonReviewNeeded: spec.reasonReviewNeeded,
    nextReviewAction: spec.nextReviewAction,
    viewHref: spec.viewHref,
    reviewHref: `/admin/tmis/review/${spec.reviewSlug}`,
    editHref: `/admin/tmis/edit/${entity.id}`,
    entity,
  };
}

function sourceRecordFromSource(source: TmisSource): TmisAdminRecord {
  const sourceSlug = source.sourceId.toLowerCase();
  const edges = tmisKnowledgeGraph.filter((edge) => edge.sourceReference === source.sourceId);
  return {
    key: `source-${sourceSlug}`,
    area: 'sources',
    slug: sourceSlug,
    reviewSlug: sourceSlug,
    name: `Source Tracker ${source.sourceId}`,
    entityType: 'Source Tracker Row',
    verificationStatus: source.verificationStatus,
    confidenceLevel: source.confidenceLevel,
    sourceDocument: '03_Research_Tracker/TMIS_Source_Tracker.xlsx',
    sourceReference: source.sourceId,
    primaryKeyword: source.entityName,
    summary: `${source.title}. ${source.factSupported}`,
    seoTitle: 'Not applicable for source tracker row',
    metaDescription: source.notes,
    fields: [
      { label: 'Source ID', value: source.sourceId },
      { label: 'Source title', value: source.title },
      { label: 'Source type', value: source.sourceType },
      { label: 'Entity', value: source.entityName },
      { label: 'Fact supported', value: source.factSupported },
      { label: 'Notes', value: source.notes },
    ],
    graphEdges: edges,
    sourceReferences: [source],
    verificationNotes: [
      'Confirm the actual source document or URL exists and is accessible.',
      'Check whether this source directly supports the listed fact.',
      'Decide whether the source is authoritative enough for Phase 2B data modeling.',
    ],
    originalityCheck: [
      'Source row is a reference pointer only.',
      'No source text is copied into the admin workflow.',
      'The supported fact remains Pending Verification.',
    ],
    reasonReviewNeeded: 'Source tracker rows must be reviewed before they can support technical, marketplace, or knowledge graph claims.',
    nextReviewAction: 'Verify source authority, capture missing URL/document details, and map the supported fact to the correct TMIS record.',
    viewHref: `/admin/tmis/sources/${sourceSlug}`,
    reviewHref: `/admin/tmis/review/${sourceSlug}`,
    editHref: `/admin/tmis/edit/source-${sourceSlug}`,
    source,
  };
}

export const tmisEntityAdminRecords: TmisAdminRecord[] = entityRouteSpecs.map(entityRecordFromSpec);

export const tmisSourceAdminRecords: TmisAdminRecord[] = tmisSources.map(sourceRecordFromSource);

export const tmisKnowledgeGraphAdminRecord: TmisAdminRecord = {
  key: 'knowledge-graph-relationships',
  area: 'knowledge-graph',
  slug: 'knowledge-graph',
  reviewSlug: 'knowledge-graph',
  name: 'Knowledge Graph Relationships',
  entityType: 'Knowledge Graph Relationship Set',
  contentStatus: 'Draft',
  verificationStatus: 'Needs Review',
  confidenceLevel: 'Medium',
  sourceDocument: '02_Technical_Architecture/Knowledge_Graph/tmis_knowledge_graph_blueprint.md',
  sourceReference: 'TMIS graph blueprint',
  primaryKeyword: 'manufacturing intelligence knowledge graph',
  summary: 'Draft relationship set connecting materials, grades, products, quality records, RFQ needs, and marketplace discovery.',
  seoTitle: 'Not applicable for internal graph review',
  metaDescription: 'Internal TMIS Phase 2A knowledge graph review record.',
  fields: [
    { label: 'Relationship count', value: String(tmisKnowledgeGraph.length) },
    { label: 'Relationship state', value: 'Draft relationship set. Not verified.' },
    { label: 'Primary use', value: 'Search, review, retrieval, and future marketplace matching.' },
  ],
  graphEdges: tmisKnowledgeGraph,
  sourceReferences: tmisSources,
  verificationNotes: [
    'Review every relationship for direction, controlled relationship type, and source evidence.',
    'Do not treat aliases or alternatives as direct substitutions without standards review.',
    'Keep supplier and buyer private data separated from graph claims.',
  ],
  originalityCheck: [
    'Relationship labels are TMIS-authored review records.',
    'Graph edges are not copied standards or supplier claims.',
    'Every edge remains draft until source review is complete.',
  ],
  reasonReviewNeeded: 'Graph relationships will influence search and future automation, so relationship direction and source support must be checked first.',
  nextReviewAction: 'Review controlled relationship types, source IDs, duplicate entities, and confidence labels before Phase 2B.',
  viewHref: '/admin/tmis/knowledge-graph',
  reviewHref: '/admin/tmis/review/knowledge-graph',
  editHref: '/admin/tmis/edit/knowledge-graph-relationships',
};

export const tmisEditableAdminRecords = [
  ...tmisEntityAdminRecords,
  ...tmisSourceAdminRecords,
  tmisKnowledgeGraphAdminRecord,
];

export const tmisReviewQueueItems = [
  ...tmisEntityAdminRecords,
  ...tmisSourceAdminRecords,
  tmisKnowledgeGraphAdminRecord,
];

export function findTmisAdminEntityRecordById(id: string) {
  return tmisEntityAdminRecords.find((record) => record.key === id);
}

export function findTmisAdminRecordByAreaSlug(area: TmisAdminArea, slug: string) {
  return tmisEntityAdminRecords.find((record) => record.area === area && record.slug === slug);
}

export function findTmisAdminSourceRecord(sourceId: string) {
  const normalized = sourceId.toLowerCase();
  return tmisSourceAdminRecords.find((record) => record.slug === normalized);
}

export function findTmisAdminRecordByKey(key: string) {
  return tmisEditableAdminRecords.find((record) => record.key === key);
}

export function findTmisReviewRecord(reviewSlug: string) {
  return tmisReviewQueueItems.find((record) => record.reviewSlug === reviewSlug);
}

export function findTmisMarketplaceAdminRecord(slug: string) {
  const normalized = slug.toLowerCase();
  return tmisEntityAdminRecords.find((record) => {
    if (record.area !== 'marketplace') return false;
    const marketplaceEntity = tmisMarketplaceListings.find((item) => item.id === record.key);
    return record.slug === normalized || marketplaceEntity?.slug === normalized;
  });
}
