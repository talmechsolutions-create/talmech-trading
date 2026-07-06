import type { TmisEntity, TmisGraphEdge, TmisProcurementChecklist, TmisSource } from '@/data/tmis/types';
import { tmisMetalPublicRoutes } from '@/data/tmis/metals';

export const tmisReviewNote =
  'TMIS Phase 1 records are draft intelligence records. Technical values, standards, equivalency notes, supplier claims, and certificate details require source review before procurement or engineering use.';

export const tmisMaterials: TmisEntity[] = [
  {
    id: 'mat-steel',
    slug: 'steel',
    name: 'Steel',
    entityType: 'Material Family',
    parent: 'Industrial Materials',
    category: 'Metal',
    shortDescription:
      'Steel is an iron-carbon based industrial material family used across manufacturing, construction, machinery, transport, energy, tools, and general engineering.',
    fullDescription:
      'Steel is a parent material family that includes carbon steel, alloy steel, stainless steel, tool steel, structural steel, and many grade-specific subcategories. In TMIS it connects product forms, material grades, manufacturing processes, quality checks, procurement requirements, supplier capabilities, buyer industries, marketplace listings, and knowledge graph relationships.',
    contentStatus: 'Draft',
    verificationStatus: 'Needs Review',
    confidenceLevel: 'Medium',
    lastUpdated: '2026-07-05',
    sourceDocument: '06_Database_Records/Materials/steel_material_record.md',
    seoTitle: 'Steel Material Guide: Types, Products, Uses, Quality and Procurement',
    metaDescription:
      'Explore steel as a draft TMIS material family record covering product forms, grades, quality checks, procurement requirements, supplier capabilities, and marketplace intelligence.',
    primaryKeyword: 'steel material',
    secondaryKeywords: ['steel grades', 'steel products', 'steel procurement', 'carbon steel', 'alloy steel', 'stainless steel'],
    fields: [
      { label: 'Material type', value: 'Metal' },
      { label: 'Parent category', value: 'Industrial Materials' },
      { label: 'Common families', value: 'Carbon Steel, Alloy Steel, Stainless Steel, Tool Steel, Structural Steel' },
      { label: 'Common grades', value: 'EN24, EN19, EN8, C45, SS304, SS316' },
      { label: 'Verification state', value: 'Draft record. Needs source review before final use.' },
    ],
    sections: [
      {
        title: 'Common forms',
        items: ['Round Bar', 'Flat Bar', 'Sheet', 'Plate', 'Pipe', 'Tube', 'Forging', 'Machined Component'],
      },
      {
        title: 'Common processes',
        items: ['Steelmaking', 'Rolling', 'Forging', 'CNC Machining', 'Heat Treatment', 'Surface Finishing'],
      },
      {
        title: 'Industries served',
        items: ['Automotive', 'Construction', 'Machinery', 'Energy', 'Railways', 'Agriculture', 'General Engineering'],
      },
      {
        title: 'Quality checks to review',
        items: ['Chemical Composition Test', 'Tensile Test', 'Hardness Test', 'Dimensional Inspection', 'Surface Inspection', 'MTC Review'],
      },
      {
        title: 'Procurement guidance',
        body:
          'Buyers should specify grade, standard, form, size, tolerance, finish, heat treatment condition, certificate requirement, quantity, application, and delivery location.',
      },
    ],
    relatedLinks: [
      { label: 'EN24 grade', href: '/grades/en24' },
      { label: 'EN24 Round Bar', href: '/products/en24-round-bar' },
      { label: 'Hardness Testing', href: '/quality/hardness-testing' },
    ],
  },
];

export const tmisGrades: TmisEntity[] = [
  {
    id: 'grade-en24',
    slug: 'en24',
    name: 'EN24',
    entityType: 'Material Grade',
    parent: 'Steel',
    category: 'Alloy Steel / Engineering Steel',
    shortDescription:
      'EN24 is an alloy engineering steel commonly associated with high-strength components such as shafts, gears, axles, studs, bolts, and heavy-duty machine parts.',
    fullDescription:
      'EN24 is commonly described in supplier datasheets as a nickel-chromium-molybdenum alloy engineering steel used where strength, toughness, hardenability, and durability are required. Final suitability depends on the applicable standard, supply condition, heat treatment, section size, mechanical requirements, and buyer specification.',
    contentStatus: 'Draft',
    verificationStatus: 'Needs Review',
    confidenceLevel: 'Medium',
    lastUpdated: '2026-07-05',
    sourceDocument: '06_Database_Records/Grades/en24_grade_record.md',
    seoTitle: 'EN24 Steel Guide: Uses, Quality Checks and Procurement Requirements',
    metaDescription:
      'Draft TMIS record for EN24 alloy steel covering common applications, procurement fields, supplier capability checks, quality guidance, and review notes.',
    primaryKeyword: 'EN24 steel',
    secondaryKeywords: ['EN24 alloy steel', 'EN24 round bar', '817M40 steel', 'EN24T', 'EN24 shaft material'],
    fields: [
      { label: 'Parent material', value: 'Steel' },
      { label: 'Material family', value: 'Alloy Steel' },
      { label: 'Grade category', value: 'Engineering Steel' },
      { label: 'Common aliases', value: '817M40; EN24T when supplied in hardened and tempered condition. Needs verification.' },
      { label: 'Verification state', value: 'Exact standard, properties, heat treatment, and equivalent grades require review.' },
    ],
    sections: [
      {
        title: 'Common forms',
        items: ['Round Bar', 'Flat Bar', 'Plate', 'Forged Part', 'Machined Component'],
      },
      {
        title: 'Common applications',
        items: ['Shafts', 'Gears', 'Axles', 'Studs', 'Bolts', 'Machine Parts', 'Heavy-Duty Components'],
      },
      {
        title: 'Quality intelligence',
        items: ['Chemical Composition Test', 'Tensile Test', 'Hardness Test', 'Dimensional Inspection', 'Surface Inspection', 'MTC Review'],
      },
      {
        title: 'Procurement fields',
        items: ['Grade', 'Standard', 'Diameter or size', 'Length', 'Quantity', 'Heat treatment condition', 'Hardness requirement', 'Finish', 'Tolerance', 'Certificate requirement', 'Application', 'Delivery location'],
      },
      {
        title: 'Risk notes',
        items: ['Wrong grade', 'Incorrect heat treatment condition', 'Missing certificate', 'Hardness mismatch', 'Surface cracks', 'Decarburization', 'Dimensional mismatch', 'Unverified equivalent grade'],
      },
    ],
    relatedLinks: [
      { label: 'Steel material', href: '/materials/steel' },
      { label: 'EN24 Round Bar', href: '/products/en24-round-bar' },
      { label: 'EN24 RFQ', href: '/rfq/en24-round-bar' },
    ],
  },
];

export const tmisProducts: TmisEntity[] = [
  {
    id: 'prod-mild-steel-round-bar',
    slug: 'mild-steel-round-bar',
    name: 'Mild Steel Round Bar',
    entityType: 'Product',
    parent: 'Steel',
    category: 'Bars and Rods',
    shortDescription:
      'Mild Steel Round Bar is a cylindrical steel product commonly used for fabrication, machining, construction, repair work, supports, pins, fixtures, and general engineering components.',
    fullDescription:
      'Mild Steel Round Bar is a round-section steel product used across industrial fabrication, machining, construction, maintenance, and general engineering applications. The term mild steel is broad, so buyers should specify exact grade, standard, diameter, length, tolerance, finish, certificate requirement, and end use before ordering.',
    contentStatus: 'Draft',
    verificationStatus: 'Needs Review',
    confidenceLevel: 'Medium',
    lastUpdated: '2026-07-05',
    sourceDocument: '06_Database_Records/Products/mild_steel_round_bar_product_record.md',
    seoTitle: 'Mild Steel Round Bar: Uses, Quality Checks and Buying Guide',
    metaDescription:
      'Draft TMIS product record for Mild Steel Round Bar with RFQ fields, quality checks, supplier capability notes, and procurement guidance.',
    primaryKeyword: 'mild steel round bar',
    secondaryKeywords: ['MS round bar', 'steel round bar', 'round bar supplier', 'steel bar procurement'],
    fields: [
      { label: 'Product category', value: 'Bars and Rods' },
      { label: 'Product subcategory', value: 'Round Bar' },
      { label: 'Parent material', value: 'Steel' },
      { label: 'Grade name', value: 'Buyer-specific; must be specified.' },
      { label: 'Verification state', value: 'Size range, finish options, grade and certificate requirements need source review.' },
    ],
    sections: [
      { title: 'Common forms', items: ['Round Bar', 'Cut-to-Length Bar', 'Bright Bar', 'Black Bar'] },
      { title: 'Applications', items: ['Fabrication', 'Light-Duty Shafts', 'Pins', 'Supports', 'Fixtures', 'Brackets', 'General Machined Parts'] },
      { title: 'Quality checks', items: ['Dimensional Inspection', 'Surface Inspection', 'Chemical Composition Check', 'Straightness Check', 'Weight Check', 'MTC Review where required'] },
      { title: 'Buyer RFQ fields', items: ['Product name', 'Material grade', 'Diameter', 'Length', 'Quantity', 'Finish', 'Tolerance', 'Certificate required', 'Application', 'Delivery location', 'Packaging requirement'] },
    ],
    relatedLinks: [
      { label: 'Steel material', href: '/materials/steel' },
      { label: 'Steel round bar checklist', href: '/rfq/en24-round-bar' },
    ],
  },
  {
    id: 'prod-en24-round-bar',
    slug: 'en24-round-bar',
    name: 'EN24 Round Bar',
    entityType: 'Product Page Draft',
    parent: 'EN24',
    category: 'Bars and Rods',
    shortDescription:
      'EN24 Round Bar is an alloy engineering steel bar commonly used for high-strength components such as shafts, gears, axles, studs, bolts, forged parts, and heavy-duty machined components.',
    fullDescription:
      'EN24 Round Bar should be purchased with a clear technical specification. Buyers should confirm the exact grade, standard, diameter, length, supply condition, hardness requirement, surface finish, tolerance, certificate requirement, and application before placing an order.',
    contentStatus: 'Draft',
    verificationStatus: 'Needs Review',
    confidenceLevel: 'Medium',
    lastUpdated: '2026-07-05',
    sourceDocument: '07_Marketplace_Content/Product_Listings/en24_round_bar_public_page_draft.md',
    seoTitle: 'EN24 Round Bar Supplier Draft: RFQ, Quality Checks and Procurement Guide',
    metaDescription:
      'Draft TMIS EN24 Round Bar page with buyer specification checklist, supplier capability checks, quality notes, procurement risks, and RFQ links.',
    primaryKeyword: 'EN24 round bar',
    secondaryKeywords: ['EN24 steel bar', 'EN24 alloy steel', '817M40 round bar', 'EN24 shaft material', 'EN24 bar supplier'],
    fields: [
      { label: 'Material family', value: 'Alloy Steel' },
      { label: 'Grade', value: 'EN24' },
      { label: 'Common alias', value: '817M40. Equivalency requires review.' },
      { label: 'Product form', value: 'Round Bar' },
      { label: 'RFQ state', value: 'RFQ required. Supplier sizes, pricing, lead time, and certificate support must be confirmed.' },
    ],
    sections: [
      {
        title: 'Common applications',
        fields: [
          { label: 'Gear shafts', value: 'Strength, toughness, and controlled material condition may be required.' },
          { label: 'Axles', value: 'Used where load-bearing strength is important. Engineering review required.' },
          { label: 'Gears', value: 'May be selected for power transmission components.' },
          { label: 'Studs and bolts', value: 'Used in high-strength fastening applications where specification supports it.' },
          { label: 'Heavy-duty machine parts', value: 'Selection depends on design, standard, heat treatment, and inspection requirements.' },
        ],
      },
      {
        title: 'Buyer specification checklist',
        items: ['Grade', 'Standard', 'Diameter', 'Length', 'Quantity', 'Supply condition', 'Hardness requirement', 'Surface finish', 'Tolerance', 'MTC requirement', 'Application', 'Delivery location', 'Drawing upload if required'],
      },
      {
        title: 'Supplier capability to check',
        items: ['EN24 availability', 'Diameter range', 'Stock or make-to-order status', 'Cut-to-length facility', 'Heat treatment access', 'Hardness testing support', 'Chemical test support', 'MTC support', 'Heat number traceability', 'Packaging capability', 'Export capability'],
      },
      {
        title: 'Procurement risks',
        items: ['Wrong grade', 'Unverified equivalent', 'Missing certificate', 'Incorrect condition', 'Hardness mismatch', 'Size mismatch', 'Surface damage', 'Supplier overclaim'],
      },
    ],
    relatedLinks: [
      { label: 'Open TMIS marketplace record', href: '/marketplace/en24-round-bar' },
      { label: 'Post EN24 RFQ', href: '/rfq/en24-round-bar' },
      { label: 'Material Test Certificate', href: '/quality/material-test-certificate' },
    ],
  },
];

export const tmisQualityRecords: TmisEntity[] = [
  {
    id: 'quality-hardness-testing',
    slug: 'hardness-testing',
    name: 'Hardness Testing',
    entityType: 'Quality Test',
    parent: 'Mechanical Testing',
    category: 'Material / Product Quality Test',
    shortDescription:
      'Hardness testing is used to evaluate the resistance of a material surface to indentation or penetration under a defined test method.',
    fullDescription:
      'Hardness testing is a common quality check used for metals and engineering components. It helps evaluate whether a material or part is within the expected hardness condition after manufacturing, heat treatment, or supply. The correct method and scale depend on material, product form, thickness, surface condition, and buyer requirement.',
    contentStatus: 'Draft',
    verificationStatus: 'Needs Review',
    confidenceLevel: 'Medium',
    lastUpdated: '2026-07-05',
    sourceDocument: '06_Database_Records/Quality/hardness_testing_quality_record.md',
    seoTitle: 'Hardness Testing in Manufacturing: Draft TMIS Quality Guide',
    metaDescription:
      'Draft TMIS guide to hardness testing, buyer RFQ fields, supplier capability checks, quality risks, and procurement guidance.',
    primaryKeyword: 'hardness testing',
    secondaryKeywords: ['hardness test', 'Rockwell hardness', 'Brinell hardness', 'Vickers hardness', 'steel hardness testing'],
    fields: [
      { label: 'Test category', value: 'Mechanical Testing' },
      { label: 'Common methods', value: 'Brinell, Rockwell, Vickers. Exact method must be specified.' },
      { label: 'Measured output', value: 'Hardness value according to selected method and scale.' },
      { label: 'Verification state', value: 'Method, scale, acceptance range, sampling plan, and standard must be confirmed.' },
    ],
    sections: [
      { title: 'Typical use cases', items: ['Heat treatment verification', 'Incoming material inspection', 'Grade or condition confirmation', 'Quality control', 'Process validation'] },
      { title: 'Applicable products', items: ['Round Bars', 'Shafts', 'Gears', 'Forgings', 'Machined Components', 'Plates', 'Heat-Treated Parts'] },
      { title: 'Buyer RFQ fields', items: ['Hardness required', 'Hardness method', 'Hardness scale', 'Required range', 'Test location', 'Sample quantity', 'Certificate required', 'Test standard', 'Application'] },
      { title: 'Quality risks', items: ['Wrong method', 'Wrong scale', 'Poor surface preparation', 'Wrong test location', 'Incorrect heat treatment', 'No traceability', 'Over-reliance on hardness'] },
    ],
    relatedLinks: [
      { label: 'EN24 grade', href: '/grades/en24' },
      { label: 'EN24 Round Bar', href: '/products/en24-round-bar' },
    ],
  },
  {
    id: 'quality-material-test-certificate',
    slug: 'material-test-certificate',
    name: 'Material Test Certificate',
    entityType: 'Quality Certificate',
    parent: 'Quality Documentation',
    category: 'Material Traceability / Inspection Documentation',
    shortDescription:
      'A Material Test Certificate is a document used to support material traceability, grade confirmation, and test result review for supplied material or products.',
    fullDescription:
      'A Material Test Certificate, commonly called MTC, is used in industrial procurement to document material details, heat or batch traceability, test results, grade information, supplier information, and conformity-related information. The exact certificate format and technical meaning depend on the applicable standard, purchase order, supplier system, and buyer requirement.',
    contentStatus: 'Draft',
    verificationStatus: 'Needs Review',
    confidenceLevel: 'Medium',
    lastUpdated: '2026-07-05',
    sourceDocument: '06_Database_Records/Quality/material_test_certificate_quality_record.md',
    seoTitle: 'Material Test Certificate Guide: Draft TMIS MTC Review Checklist',
    metaDescription:
      'Draft TMIS guide to Material Test Certificate meaning, buyer RFQ fields, supplier checks, traceability risks, and MTC review workflow.',
    primaryKeyword: 'material test certificate',
    secondaryKeywords: ['MTC certificate', 'material certificate', 'inspection certificate', 'steel MTC', 'material traceability'],
    fields: [
      { label: 'Common short name', value: 'MTC' },
      { label: 'Certificate category', value: 'Material Traceability / Inspection Documentation' },
      { label: 'Related documents', value: 'Inspection certificate, test report, chemical analysis report, mechanical test report, hardness report' },
      { label: 'Verification state', value: 'Certificate type, standard reference, format, and legal meaning need source review.' },
    ],
    sections: [
      { title: 'What an MTC may help confirm', items: ['Material grade', 'Heat number or batch number', 'Chemical composition where included', 'Mechanical properties where included', 'Hardness result where required', 'Standard reference', 'Supplier or manufacturer details', 'Quantity, size, and description'] },
      { title: 'Buyer RFQ fields', items: ['MTC required', 'Certificate type', 'Standard reference', 'Chemical results required', 'Mechanical results required', 'Hardness results required', 'Heat number traceability', 'Third-party inspection required', 'Certificate submission stage'] },
      { title: 'Certificate review checkpoints', items: ['Supplier name', 'Buyer or PO reference', 'Product description', 'Grade and standard', 'Heat number or batch number', 'Chemical composition', 'Mechanical properties', 'Hardness result', 'Certificate type', 'Signature or stamp', 'Date', 'Traceability'] },
      { title: 'Risk notes', items: ['Missing MTC', 'Wrong certificate', 'Heat number mismatch', 'Incomplete test results', 'Wrong grade reference', 'Unverified equivalent', 'Unclear certificate type', 'Altered document risk', 'Supplier overclaim'] },
    ],
    relatedLinks: [
      { label: 'EN24 Round Bar', href: '/products/en24-round-bar' },
      { label: 'EN24 RFQ', href: '/rfq/en24-round-bar' },
    ],
  },
];

export const tmisMarketplaceListings: TmisEntity[] = [
  {
    id: 'listing-en24-round-bar',
    slug: 'en24-alloy-steel-round-bar',
    name: 'EN24 Alloy Steel Round Bar',
    entityType: 'Marketplace Listing Draft',
    parent: 'EN24 Round Bar',
    category: 'Bars and Rods',
    shortDescription:
      'Draft marketplace listing for EN24 Alloy Steel Round Bar intended for RFQ-based sourcing and supplier capability matching.',
    fullDescription:
      'EN24 Alloy Steel Round Bar is commonly used for high-strength engineering components such as shafts, gears, axles, studs, bolts, and heavy-duty machined parts. Final suitability depends on applicable standard, supply condition, heat treatment, hardness requirement, and buyer specification.',
    contentStatus: 'Draft',
    verificationStatus: 'Needs Review',
    confidenceLevel: 'Medium',
    lastUpdated: '2026-07-05',
    sourceDocument: '07_Marketplace_Content/Product_Listings/en24_round_bar_marketplace_record.md',
    seoTitle: 'EN24 Round Bar Supplier Draft for Shafts, Gears and Components',
    metaDescription:
      'Draft TMIS marketplace listing record for EN24 Round Bar with RFQ fields, marketplace filters, quality checks, and verification notes.',
    primaryKeyword: 'EN24 round bar supplier',
    secondaryKeywords: ['EN24 steel bar', '817M40 round bar', 'EN24 supplier', 'alloy steel round bar'],
    fields: [
      { label: 'Listing status', value: 'Draft only' },
      { label: 'RFQ enabled', value: 'Yes' },
      { label: 'Available sizes', value: 'Supplier-specific; must be confirmed.' },
      { label: 'Lead time', value: 'Supplier-specific; must be confirmed.' },
      { label: 'Minimum order quantity', value: 'Supplier-specific; must be confirmed.' },
    ],
    sections: [
      { title: 'Marketplace filters', items: ['Steel', 'Alloy Steel', 'EN24', 'Bars and Rods', 'Round Bar', 'Shafts', 'Gears', 'Automotive', 'Machinery', 'MTC if supported'] },
      { title: 'Buyer RFQ fields', items: ['Buyer name', 'Contact person', 'Email', 'Phone', 'Product name', 'Grade', 'Standard', 'Diameter', 'Length', 'Quantity', 'Supply condition', 'Hardness requirement', 'Surface finish', 'Tolerance', 'Certificate required', 'Application', 'Delivery location'] },
      { title: 'Quality and inspection notes', items: ['Grade verification', 'Chemical composition test', 'Hardness test', 'Tensile test', 'Dimensional inspection', 'Surface inspection', 'Straightness check', 'MTC review', 'Heat number check'] },
    ],
    relatedLinks: [
      { label: 'Open product page', href: '/products/en24-round-bar' },
      { label: 'Create RFQ', href: '/rfq/en24-round-bar' },
    ],
  },
];

export const tmisProcurementChecklists: TmisProcurementChecklist[] = [
  {
    id: 'rfq-en24-round-bar',
    slug: 'en24-round-bar',
    name: 'EN24 Round Bar RFQ Checklist',
    entityType: 'RFQ / Procurement Checklist',
    relatedProduct: 'EN24 Round Bar',
    contentStatus: 'Draft',
    verificationStatus: 'Needs Review',
    confidenceLevel: 'Medium',
    lastUpdated: '2026-07-05',
    sourceDocument: '07_Marketplace_Content/RFQ_Templates/steel_round_bar_procurement_checklist.md',
    seoTitle: 'EN24 Round Bar RFQ Checklist: Draft TMIS Buyer Guide',
    metaDescription:
      'Draft EN24 Round Bar RFQ checklist for grade, standard, diameter, length, quantity, certificate, quality, supplier capability, and procurement risk review.',
    intro:
      'Use this Phase 1 checklist to prepare a cleaner EN24 Round Bar enquiry. It is a procurement aid, not a final engineering specification.',
    rfqFields: [
      { label: 'Product', value: 'EN24 Round Bar' },
      { label: 'Grade', value: 'EN24' },
      { label: 'Standard', value: 'Specify if known; must be verified.' },
      { label: 'Diameter', value: 'Required for round bar identification.' },
      { label: 'Length', value: 'Standard length or cut length.' },
      { label: 'Quantity', value: 'Pieces, kg, metric tons, or total length.' },
      { label: 'Supply condition', value: 'Annealed, hardened and tempered, or buyer-specific condition.' },
      { label: 'Hardness requirement', value: 'Required if application or drawing specifies it.' },
      { label: 'Surface finish', value: 'Black, bright, peeled, ground, or machined.' },
      { label: 'Certificate required', value: 'MTC or inspection certificate if traceability is required.' },
      { label: 'Application', value: 'Shaft, gear, axle, fastener, machine part, or other use.' },
      { label: 'Delivery location', value: 'Required for logistics and landed quotation.' },
    ],
    qualityChecks: [
      { label: 'Grade verification', value: 'Confirms material is EN24 as required.' },
      { label: 'Diameter and length inspection', value: 'Confirms supplied dimensions match the order.' },
      { label: 'Hardness test', value: 'Required when hardness or heat treatment is specified.' },
      { label: 'Surface inspection', value: 'Checks rust, cracks, dents, scale, or visible damage.' },
      { label: 'MTC review', value: 'Confirms traceability and test documentation where required.' },
      { label: 'Heat number check', value: 'Links supplied material to certificate and batch.' },
    ],
    supplierChecks: [
      { label: 'EN24 availability', value: 'Supplier must confirm exact grade availability.' },
      { label: 'Diameter range', value: 'Supplier must confirm required size availability.' },
      { label: 'Stock or make-to-order', value: 'Affects price, lead time, and delivery commitment.' },
      { label: 'Testing support', value: 'Supplier should confirm chemical, hardness, tensile, and dimensional support where required.' },
      { label: 'MTC support', value: 'Supplier should confirm certificate and heat number traceability.' },
      { label: 'Packaging and delivery', value: 'Supplier must protect material from damage and confirm delivery capability.' },
    ],
    risks: [
      { label: 'Wrong grade', value: 'Supplier may quote or supply a similar alloy steel instead of EN24.' },
      { label: 'Unverified equivalent', value: 'Equivalent grades need engineering and standards review before substitution.' },
      { label: 'Missing certificate', value: 'Buyer cannot confirm traceability when MTC was required.' },
      { label: 'Hardness mismatch', value: 'Heat treatment or condition may not match application needs.' },
      { label: 'Size mismatch', value: 'Diameter, length, or tolerance may not match the purchase order.' },
      { label: 'Supplier overclaim', value: 'Capabilities must be supported with documentation and inspection.' },
    ],
    recommendedFormat: [
      'Product: EN24 Round Bar',
      'Grade: EN24',
      'Standard: [Specify if known]',
      'Diameter: [Specify]',
      'Length: [Specify]',
      'Quantity: [Pieces / kg / tons / total length]',
      'Supply Condition: [Specify]',
      'Hardness Requirement: [Specify if applicable]',
      'Surface Finish: [Black / Bright / Peeled / Ground / Machined]',
      'Tolerance: [Specify if applicable]',
      'Certificate Required: [Yes / No]',
      'Application: [Shaft / Gear / Axle / Machine Part / Other]',
      'Delivery Location: [Specify]',
      'Expected Delivery Date: [Specify if required]',
      'Additional Notes: [Any buyer-specific requirement]',
    ],
  },
];

export const tmisSources: TmisSource[] = [
  { sourceId: 'S001', title: 'What is Steel?', sourceType: 'Internal pilot source row', entityName: 'Steel', factSupported: 'Steel context and material-family framing', verificationStatus: 'Pending Verification', confidenceLevel: 'Medium', notes: 'Source tracker row requires review before final publishing.' },
  { sourceId: 'S002', title: 'Steel material family research note', sourceType: 'Internal pilot source row', entityName: 'Steel', factSupported: 'Steel family and application context', verificationStatus: 'Pending Verification', confidenceLevel: 'Medium', notes: 'Use as a draft pointer only.' },
  { sourceId: 'S003', title: 'Engineering Steel EN24 / 817M40T Datasheet', sourceType: 'Supplier-level datasheet reference', entityName: 'EN24', factSupported: 'EN24 alloy family and application context', verificationStatus: 'Pending Verification', confidenceLevel: 'Medium', notes: 'Supplier-level context. Official standard review still required.' },
  { sourceId: 'S004', title: 'EN24 Steel Information', sourceType: 'Supplier-level reference', entityName: 'EN24', factSupported: 'EN24 application context', verificationStatus: 'Pending Verification', confidenceLevel: 'Medium', notes: 'Do not treat supplier wording as final standard text.' },
  { sourceId: 'S005', title: 'EN24 / 817M40 Steel Reference', sourceType: 'Supplier-level reference', entityName: 'EN24', factSupported: 'EN24, 817M40, and EN24T context', verificationStatus: 'Pending Verification', confidenceLevel: 'Medium', notes: 'Equivalency requires standards review.' },
  { sourceId: 'S006', title: 'Engineering Steel EN19 / 709M40T Datasheet', sourceType: 'Supplier-level reference', entityName: 'EN19', factSupported: 'Future EN24 vs EN19 comparison support', verificationStatus: 'Pending Verification', confidenceLevel: 'Medium', notes: 'Included for future comparison work.' },
  { sourceId: 'S007', title: 'Hardness Testing Part 1', sourceType: 'Testing reference', entityName: 'Hardness Testing', factSupported: 'Hardness testing concept and method overview', verificationStatus: 'Pending Verification', confidenceLevel: 'Medium', notes: 'Method and scale details must be checked.' },
  { sourceId: 'S008', title: 'Hardness Testing Knowledge Page', sourceType: 'Testing reference', entityName: 'Hardness Testing', factSupported: 'Hardness interpretation caution', verificationStatus: 'Pending Verification', confidenceLevel: 'Medium', notes: 'Use for draft quality explanation only.' },
  { sourceId: 'S009', title: 'Material Test Certificate / EN 10204 Notes', sourceType: 'Certificate reference placeholder', entityName: 'Material Test Certificate', factSupported: 'Certificate requirement and inspection-document context', verificationStatus: 'Pending Verification', confidenceLevel: 'Unknown', notes: 'Source link still needs completion in tracker.' },
  { sourceId: 'S010', title: 'MS Round Bar Application Reference', sourceType: 'Product-form reference placeholder', entityName: 'Mild Steel Round Bar', factSupported: 'Product form, usage, and specification examples', verificationStatus: 'Pending Verification', confidenceLevel: 'Unknown', notes: 'Source link still needs completion in tracker.' },
];

export const tmisKnowledgeGraph: TmisGraphEdge[] = [
  { subject: 'Steel', relationship: 'has_family', object: 'Carbon Steel', confidenceLevel: 'Medium', sourceReference: 'S001' },
  { subject: 'Steel', relationship: 'has_family', object: 'Alloy Steel', confidenceLevel: 'Medium', sourceReference: 'S001' },
  { subject: 'Steel', relationship: 'has_family', object: 'Stainless Steel', confidenceLevel: 'Medium', sourceReference: 'S001' },
  { subject: 'Steel', relationship: 'available_as', object: 'Round Bar', confidenceLevel: 'Medium', sourceReference: 'S001' },
  { subject: 'Steel', relationship: 'processed_by', object: 'Rolling', confidenceLevel: 'Medium', sourceReference: 'S001' },
  { subject: 'Steel', relationship: 'processed_by', object: 'Forging', confidenceLevel: 'Medium', sourceReference: 'S001' },
  { subject: 'Steel', relationship: 'requires_quality_test', object: 'Hardness Testing', confidenceLevel: 'Medium', sourceReference: 'S007' },
  { subject: 'Steel', relationship: 'used_in', object: 'Automotive Industry', confidenceLevel: 'Medium', sourceReference: 'S001' },
  { subject: 'EN24', relationship: 'belongs_to', object: 'Steel', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24', relationship: 'belongs_to', object: 'Alloy Steel', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24', relationship: 'has_alias', object: '817M40', confidenceLevel: 'Medium', sourceReference: 'S005', notes: 'Alias requires standard verification before final publishing.' },
  { subject: 'EN24', relationship: 'has_condition_variant', object: 'EN24T', confidenceLevel: 'Medium', sourceReference: 'S005', notes: 'Condition meaning requires review.' },
  { subject: 'EN24', relationship: 'available_as', object: 'Round Bar', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24', relationship: 'used_for', object: 'Gear Shaft', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24', relationship: 'used_for', object: 'Axle', confidenceLevel: 'Medium', sourceReference: 'S004' },
  { subject: 'EN24', relationship: 'processed_by', object: 'Heat Treatment', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24', relationship: 'requires_quality_test', object: 'Hardness Testing', confidenceLevel: 'Medium', sourceReference: 'S007' },
  { subject: 'EN24', relationship: 'may_require_certificate', object: 'Material Test Certificate', confidenceLevel: 'Medium', sourceReference: 'S009' },
  { subject: 'EN24 Round Bar', relationship: 'belongs_to', object: 'Bars and Rods', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24 Round Bar', relationship: 'made_from', object: 'EN24', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24 Round Bar', relationship: 'used_for', object: 'Gear Shaft', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24 Round Bar', relationship: 'requires_quality_test', object: 'Dimensional Inspection', confidenceLevel: 'Medium', sourceReference: 'S003' },
  { subject: 'EN24 Round Bar', relationship: 'may_require_quality_test', object: 'Hardness Testing', confidenceLevel: 'Medium', sourceReference: 'S007' },
  { subject: 'EN24 Round Bar', relationship: 'may_require_certificate', object: 'Material Test Certificate', confidenceLevel: 'Medium', sourceReference: 'S009' },
  { subject: 'EN24 Round Bar', relationship: 'requested_through', object: 'RFQ Form', confidenceLevel: 'Medium', sourceReference: 'Internal' },
  { subject: 'EN24 Round Bar', relationship: 'listed_in', object: 'Marketplace', confidenceLevel: 'Medium', sourceReference: 'Internal' },
  { subject: 'Hardness Testing', relationship: 'belongs_to', object: 'Mechanical Testing', confidenceLevel: 'Medium', sourceReference: 'S007' },
  { subject: 'Hardness Testing', relationship: 'used_for', object: 'Heat Treatment Verification', confidenceLevel: 'Medium', sourceReference: 'S007' },
  { subject: 'Material Test Certificate', relationship: 'belongs_to', object: 'Quality Documentation', confidenceLevel: 'Medium', sourceReference: 'S009' },
  { subject: 'Material Test Certificate', relationship: 'used_for', object: 'Material Traceability', confidenceLevel: 'Medium', sourceReference: 'S009' },
  { subject: 'Material Test Certificate', relationship: 'may_include', object: 'Chemical Composition Results', confidenceLevel: 'Medium', sourceReference: 'S009' },
  { subject: 'Material Test Certificate', relationship: 'may_include', object: 'Mechanical Test Results', confidenceLevel: 'Medium', sourceReference: 'S009' },
];

export const tmisPublicRoutes = [
  { path: '/tmis', title: 'Talmech Manufacturing Intelligence System' },
  { path: '/tmis/metals', title: 'TMIS Metal Intelligence Workspace' },
  ...tmisMetalPublicRoutes,
  { path: '/tmis/planning', title: 'TMIS Buyer and Seller Planning Workspace' },
  { path: '/tmis/planning/buyers', title: 'TMIS Buyer Planning' },
  { path: '/tmis/planning/sellers', title: 'TMIS Seller Planning' },
  { path: '/tmis/planning/opportunities', title: 'TMIS Opportunity Map' },
  { path: '/materials', title: 'TMIS Materials' },
  { path: '/materials/steel', title: 'Steel Material Intelligence' },
  { path: '/grades/en24', title: 'EN24 Grade Intelligence' },
  { path: '/products/en24-round-bar', title: 'EN24 Round Bar Intelligence' },
  { path: '/quality/hardness-testing', title: 'Hardness Testing Guide' },
  { path: '/quality/material-test-certificate', title: 'Material Test Certificate Guide' },
  { path: '/marketplace/en24-round-bar', title: 'EN24 Round Bar Marketplace Draft' },
  { path: '/rfq/en24-round-bar', title: 'EN24 Round Bar RFQ Checklist' },
];

export function findTmisMaterial(slug: string) {
  return tmisMaterials.find((item) => item.slug === slug);
}

export function findTmisGrade(slug: string) {
  return tmisGrades.find((item) => item.slug === slug);
}

export function findTmisProduct(slug: string) {
  return tmisProducts.find((item) => item.slug === slug);
}

export function findTmisQualityRecord(slug: string) {
  return tmisQualityRecords.find((item) => item.slug === slug);
}

export function findTmisMarketplaceListing(slug: string) {
  return tmisMarketplaceListings.find((item) => item.slug === slug || item.parent?.toLowerCase().replaceAll(' ', '-') === slug);
}

export function findTmisProcurementChecklist(slug: string) {
  return tmisProcurementChecklists.find((item) => item.slug === slug);
}

export const tmisAdminGroups = [
  { key: 'materials', label: 'Materials', rows: tmisMaterials },
  { key: 'grades', label: 'Grades', rows: tmisGrades },
  { key: 'products', label: 'Products', rows: tmisProducts },
  { key: 'quality', label: 'Quality Records', rows: tmisQualityRecords },
  { key: 'marketplace', label: 'Marketplace Listings', rows: tmisMarketplaceListings },
] as const;

export const tmisAllEntityRecords = [
  ...tmisMaterials,
  ...tmisGrades,
  ...tmisProducts,
  ...tmisQualityRecords,
  ...tmisMarketplaceListings,
];

export const tmisAdminSummary = {
  totalMaterials: tmisMaterials.length,
  totalGrades: tmisGrades.length,
  totalProducts: tmisProducts.length,
  totalQualityRecords: tmisQualityRecords.length,
  totalMarketplaceRecords: tmisMarketplaceListings.length,
  totalSourceRecords: tmisSources.length,
  totalKnowledgeGraphRelationships: tmisKnowledgeGraph.length,
  itemsNeedingReview:
    tmisAllEntityRecords.filter((item) => item.verificationStatus === 'Needs Review').length +
    tmisSources.filter((item) => item.verificationStatus === 'Needs Review' || item.verificationStatus === 'Pending Verification').length +
    tmisKnowledgeGraph.length +
    tmisProcurementChecklists.filter((item) => item.verificationStatus === 'Needs Review').length,
  verificationStatusSummary: [
    { label: 'Draft content records', value: tmisAllEntityRecords.filter((item) => item.contentStatus === 'Draft').length + tmisProcurementChecklists.filter((item) => item.contentStatus === 'Draft').length },
    { label: 'Needs Review', value: tmisAllEntityRecords.filter((item) => item.verificationStatus === 'Needs Review').length + tmisProcurementChecklists.filter((item) => item.verificationStatus === 'Needs Review').length },
    { label: 'Pending Verification source rows', value: tmisSources.filter((item) => item.verificationStatus === 'Pending Verification').length },
    { label: 'Published records', value: 0 },
    { label: 'Verified records', value: 0 },
  ],
} as const;
