export type TmisContentStatus = 'Draft';
export type TmisVerificationStatus = 'Needs Review';
export type TmisConfidenceLevel = 'Medium' | 'Unknown';

export type TmisField = {
  label: string;
  value: string;
};

export type TmisSection = {
  title: string;
  body?: string;
  items?: string[];
  fields?: TmisField[];
};

export type TmisEntity = {
  id: string;
  slug: string;
  name: string;
  entityType: string;
  parent?: string;
  category?: string;
  shortDescription: string;
  fullDescription: string;
  contentStatus: TmisContentStatus;
  verificationStatus: TmisVerificationStatus;
  confidenceLevel: TmisConfidenceLevel;
  lastUpdated: string;
  sourceDocument: string;
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  fields: TmisField[];
  sections: TmisSection[];
  relatedLinks?: { label: string; href: string }[];
};

export type TmisSource = {
  sourceId: string;
  title: string;
  sourceType: string;
  entityName: string;
  factSupported: string;
  verificationStatus: 'Pending Verification' | 'Needs Review';
  confidenceLevel: TmisConfidenceLevel;
  notes: string;
};

export type TmisGraphEdge = {
  subject: string;
  relationship: string;
  object: string;
  confidenceLevel: TmisConfidenceLevel;
  sourceReference: string;
  notes?: string;
};

export type TmisProcurementChecklist = {
  id: string;
  slug: string;
  name: string;
  entityType: string;
  relatedProduct: string;
  contentStatus: TmisContentStatus;
  verificationStatus: TmisVerificationStatus;
  confidenceLevel: TmisConfidenceLevel;
  lastUpdated: string;
  sourceDocument: string;
  seoTitle: string;
  metaDescription: string;
  intro: string;
  rfqFields: TmisField[];
  qualityChecks: TmisField[];
  supplierChecks: TmisField[];
  risks: TmisField[];
  recommendedFormat: string[];
};
