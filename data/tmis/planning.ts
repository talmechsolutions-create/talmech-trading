export type TmisPlanningPriority = 'High' | 'Medium' | 'Low';
export type TmisPlanningStatus = 'Draft / Needs Review';

export type TmisPlanningConnection = {
  metal: string;
  grade: string;
  product_form: string;
  buyer_category: string;
  seller_category: string;
  quality_requirement: string;
  certificate_requirement: string;
  marketplace_opportunity: string;
  rfq_priority: TmisPlanningPriority;
  target_priority: TmisPlanningPriority;
  business_reason: string;
  status: TmisPlanningStatus;
};

export type TmisBuyerPlanningRow = {
  buyer_category: string;
  industries: string[];
  metals_they_buy: string[];
  product_forms_they_buy: string[];
  quality_expectations: string;
  certificates_needed: string;
  how_talmech_can_target: string;
  priority_level: TmisPlanningPriority;
  status: TmisPlanningStatus;
};

export type TmisSellerPlanningRow = {
  seller_category: string;
  what_they_supply: string;
  metals_supported: string[];
  product_forms_supported: string[];
  capability_needed: string;
  documents_needed: string;
  onboarding_questions: string[];
  priority_level: TmisPlanningPriority;
  status: TmisPlanningStatus;
};

export type TmisOpportunityMapRow = {
  opportunity_name: string;
  metal: string;
  grade: string;
  product_form: string;
  target_buyers: string[];
  target_sellers: string[];
  quality_focus: string;
  certificate_requirement: string;
  rfq_priority: TmisPlanningPriority;
  target_priority: TmisPlanningPriority;
  business_reason: string;
  status: TmisPlanningStatus;
};

export type TmisMetalOpportunitySummaryRow = {
  metal: string;
  opportunity_count: number;
  high_priority_count: number;
  product_forms: string[];
  target_buyers: string[];
  target_sellers: string[];
  status: TmisPlanningStatus;
};

export const tmisBuyerPlanningRows: TmisBuyerPlanningRow[] = [
  {
    buyer_category: 'Wire manufacturers',
    industries: ['Electrical', 'Cable manufacturing', 'Industrial supply'],
    metals_they_buy: ['Copper', 'Aluminium'],
    product_forms_they_buy: ['Wire rod', 'Rod', 'Coil'],
    quality_expectations: 'Consistent input form, correct metal family, surface condition, and document support where required.',
    certificates_needed: 'Material certificate or test report where the buyer specifies it.',
    how_talmech_can_target: 'Create RFQs around metal, rod size, coil or bundle preference, monthly quantity, and delivery location.',
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'Transformer manufacturers',
    industries: ['Power equipment', 'Electrical infrastructure', 'Industrial projects'],
    metals_they_buy: ['Copper', 'Aluminium', 'Steel'],
    product_forms_they_buy: ['Busbar', 'Wire', 'Sheet', 'Strip', 'Core-adjacent steel forms'],
    quality_expectations: 'Clear material identity, dimensional control, surface condition, and traceable documents for critical inputs.',
    certificates_needed: 'Material certificate, inspection report, and buyer-specific document pack where required.',
    how_talmech_can_target: 'Use application-led RFQs for busbar, winding, sheet, and fabricated electrical inputs.',
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'Motor rewinders',
    industries: ['Electrical repair', 'Maintenance', 'Industrial services'],
    metals_they_buy: ['Copper', 'Aluminium'],
    product_forms_they_buy: ['Wire', 'Strip', 'Small electrical inputs'],
    quality_expectations: 'Right metal family, size, insulation or finishing context where applicable, and practical delivery speed.',
    certificates_needed: 'Invoice and basic material document where available; formal documents only when specified.',
    how_talmech_can_target: 'Build quick enquiry flows for urgent repair, wire size, quantity, and city-level delivery.',
    priority_level: 'Medium',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'Electrical panel builders',
    industries: ['Electrical panels', 'Industrial automation', 'Power distribution'],
    metals_they_buy: ['Copper', 'Aluminium', 'Steel', 'Stainless Steel'],
    product_forms_they_buy: ['Busbar', 'Sheet', 'Plate', 'Channel', 'Fabricated enclosure parts'],
    quality_expectations: 'Accurate busbar size, sheet thickness, finish, fabrication fit, and documentation where specified.',
    certificates_needed: 'Material certificate where required, drawing approval for fabricated parts, and inspection report if requested.',
    how_talmech_can_target: 'Target panel builders with busbar, enclosure sheet, punching, bending, and fabrication RFQ fields.',
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'Machining companies',
    industries: ['Machine shops', 'Component manufacturing', 'Maintenance'],
    metals_they_buy: ['Steel', 'Stainless Steel', 'Brass', 'Aluminium'],
    product_forms_they_buy: ['Round bar', 'Flat bar', 'Plate', 'Rod', 'Cut blank'],
    quality_expectations: 'Grade clarity, machinability context, dimensions, tolerance, surface condition, and certificate where required.',
    certificates_needed: 'MTC or test report when the buyer asks for traceability.',
    how_talmech_can_target: 'Build RFQs by grade, diameter or thickness, cut length, application, and certificate need.',
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'Gear manufacturers',
    industries: ['Automotive', 'Machinery', 'Transmission parts', 'Heavy engineering'],
    metals_they_buy: ['Steel'],
    product_forms_they_buy: ['EN24 Round Bar', 'Forging', 'Gear blank', 'Machined blank'],
    quality_expectations: 'Grade, heat treatment context, hardness requirement, traceability, and inspection plan where specified.',
    certificates_needed: 'MTC, hardness report, heat treatment document, and inspection report where required.',
    how_talmech_can_target: 'Target with EN24, forging, heat treatment, hardness, and drawing-led RFQ flows.',
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'Fabrication companies',
    industries: ['Industrial fabrication', 'Equipment fabrication', 'Repair and maintenance'],
    metals_they_buy: ['Steel', 'Stainless Steel', 'Aluminium'],
    product_forms_they_buy: ['Sheet', 'Plate', 'Angle', 'Channel', 'Pipe', 'Tube'],
    quality_expectations: 'Correct grade family, size, surface condition, weld or finish context, and reliable delivery.',
    certificates_needed: 'Material certificate where specified and inspection note for critical work.',
    how_talmech_can_target: 'Create form-led RFQs for plate, sheet, pipe, tube, angle, channel, cutting, and delivery.',
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'Construction material buyers',
    industries: ['Construction', 'Infrastructure', 'Contracting'],
    metals_they_buy: ['Steel', 'Stainless Steel', 'Aluminium'],
    product_forms_they_buy: ['Plate', 'Sheet', 'Angle', 'Channel', 'Pipe', 'Tube', 'Profile'],
    quality_expectations: 'Size, quantity, delivery reliability, surface condition, and project specification alignment.',
    certificates_needed: 'Invoice, delivery documents, and material certificate only when project specification requires it.',
    how_talmech_can_target: 'Use project-location, quantity, delivery date, and product-form RFQ filters.',
    priority_level: 'Medium',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'EV component manufacturers',
    industries: ['EV components', 'Electrical mobility', 'Lightweight assemblies'],
    metals_they_buy: ['Copper', 'Aluminium', 'Steel', 'Stainless Steel'],
    product_forms_they_buy: ['Busbar', 'Extrusion', 'Sheet', 'Machined component', 'Fastener'],
    quality_expectations: 'Drawing review, dimensional control, repeatability, traceability, and supplier capability evidence.',
    certificates_needed: 'Material certificate, inspection report, drawing approval, and process document where needed.',
    how_talmech_can_target: 'Build higher-control RFQs with drawing upload, repeat quantity, process needs, and document readiness.',
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    buyer_category: 'Scrap refiners',
    industries: ['Recycling', 'Metal recovery', 'Secondary raw material'],
    metals_they_buy: ['Copper', 'Aluminium', 'Brass', 'Steel', 'Stainless Steel'],
    product_forms_they_buy: ['Segregated scrap', 'Turnings', 'Offcuts', 'Rejected lots'],
    quality_expectations: 'Clear segregation, contamination risk review, approximate composition context, and honest quantity details.',
    certificates_needed: 'Weighment, invoice, transport document, and compliance documents where required.',
    how_talmech_can_target: 'Create scrap RFQs around metal type, segregation, quantity, location, photos, and pickup terms.',
    priority_level: 'Medium',
    status: 'Draft / Needs Review',
  },
];

export const tmisSellerPlanningRows: TmisSellerPlanningRow[] = [
  {
    seller_category: 'Steel stockists',
    what_they_supply: 'Steel bars, plates, sheets, pipes, tubes, angles, channels, and cut-to-size material.',
    metals_supported: ['Steel'],
    product_forms_supported: ['Round bar', 'Plate', 'Sheet', 'Pipe', 'Tube', 'Angle', 'Channel'],
    capability_needed: 'Inventory visibility, size range clarity, cut-to-length support, packaging, and dispatch discipline.',
    documents_needed: 'Invoice, delivery challan, material certificate where available, and batch or heat details where relevant.',
    onboarding_questions: ['Which grades are stocked?', 'What size range is normally available?', 'Can material be cut to length?', 'Can MTC be supplied when required?'],
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Copper stockists',
    what_they_supply: 'Copper rods, busbars, sheets, strips, tubes, and general electrical input forms.',
    metals_supported: ['Copper'],
    product_forms_supported: ['Busbar', 'Rod', 'Sheet', 'Strip', 'Tube', 'Wire rod'],
    capability_needed: 'Form availability, cut-to-size support, careful packaging, and document readiness.',
    documents_needed: 'Invoice, material certificate where available, test report where required, and dispatch documents.',
    onboarding_questions: ['Which copper forms are supplied?', 'Can busbar be cut or punched?', 'What document support is available?', 'Which cities can be served?'],
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Aluminium stockists',
    what_they_supply: 'Aluminium sheets, plates, rods, tubes, bars, and standard profiles.',
    metals_supported: ['Aluminium'],
    product_forms_supported: ['Sheet', 'Plate', 'Rod', 'Tube', 'Extrusion', 'Profile'],
    capability_needed: 'Thickness range, profile availability, finish support, cutting, and surface protection.',
    documents_needed: 'Invoice, dispatch documents, certificate where available, and finish document where required.',
    onboarding_questions: ['Which forms and finishes are available?', 'Can cut-to-size be supplied?', 'Are standard profiles stocked?', 'What packaging is used?'],
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Rolling mills',
    what_they_supply: 'Rolled bars, flats, strips, sheets, and mill-supplied product forms.',
    metals_supported: ['Steel', 'Copper', 'Aluminium', 'Brass'],
    product_forms_supported: ['Bar', 'Flat', 'Strip', 'Sheet', 'Rod'],
    capability_needed: 'Production route clarity, MOQ, lead time, size capability, and quality documentation process.',
    documents_needed: 'Mill certificate where available, test report where specified, invoice, and dispatch document.',
    onboarding_questions: ['What forms can be rolled?', 'What MOQ and lead time apply?', 'Can material certificates be issued?', 'Which grades or alloy families are supported?'],
    priority_level: 'Medium',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Forging suppliers',
    what_they_supply: 'Forgings, gear blanks, shafts, rings, flanges, and heavy-duty component blanks.',
    metals_supported: ['Steel', 'Stainless Steel', 'Brass'],
    product_forms_supported: ['Forging', 'Gear blank', 'Shaft blank', 'Ring', 'Flange'],
    capability_needed: 'Drawing review, forging range, heat treatment coordination, inspection support, and traceability.',
    documents_needed: 'Material certificate, heat treatment document where required, inspection report, and drawing approval.',
    onboarding_questions: ['What forging size range is possible?', 'Is heat treatment available?', 'Can hardness testing be arranged?', 'What drawing review process is used?'],
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Machining suppliers',
    what_they_supply: 'Machined components, turned parts, milled parts, shafts, bushes, and custom parts.',
    metals_supported: ['Steel', 'Stainless Steel', 'Brass', 'Aluminium', 'Copper'],
    product_forms_supported: ['Machined component', 'Turned part', 'Gear shaft', 'Bush', 'Cut blank'],
    capability_needed: 'Machine capacity, drawing review, tolerance discipline, inspection, and repeat production support.',
    documents_needed: 'Drawing approval, inspection report, material certificate when required, and process note where needed.',
    onboarding_questions: ['Which materials are machined?', 'What tolerance style is comfortable?', 'Can inspection reports be shared?', 'What batch sizes are preferred?'],
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Scrap suppliers',
    what_they_supply: 'Segregated scrap, turnings, offcuts, rejected lots, and reusable surplus material.',
    metals_supported: ['Steel', 'Copper', 'Aluminium', 'Stainless Steel', 'Brass'],
    product_forms_supported: ['Scrap', 'Turnings', 'Offcuts', 'Rejected lots'],
    capability_needed: 'Segregation discipline, quantity visibility, photo evidence, pickup coordination, and contamination disclosure.',
    documents_needed: 'Invoice, weighment, pickup document, and compliance documents where required.',
    onboarding_questions: ['Which scrap metals are available?', 'How is material segregated?', 'What quantity and location are available?', 'Can photos and weighment be shared?'],
    priority_level: 'Medium',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Distributors',
    what_they_supply: 'Multi-metal inventory, product bundles, and local delivery support.',
    metals_supported: ['Steel', 'Copper', 'Aluminium', 'Stainless Steel', 'Brass'],
    product_forms_supported: ['Bar', 'Sheet', 'Plate', 'Tube', 'Pipe', 'Rod', 'Busbar'],
    capability_needed: 'Product range clarity, city coverage, quote speed, document readiness, and logistics coordination.',
    documents_needed: 'Invoice, dispatch documents, product certificate where available, and GST/compliance details.',
    onboarding_questions: ['Which metals and cities are covered?', 'What stock is ready?', 'Can mixed RFQs be quoted?', 'What document support is standard?'],
    priority_level: 'Medium',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Exporters',
    what_they_supply: 'Export-ready metals, processed forms, components, and documentation-heavy orders.',
    metals_supported: ['Steel', 'Copper', 'Aluminium', 'Stainless Steel', 'Brass'],
    product_forms_supported: ['Bar', 'Sheet', 'Plate', 'Machined component', 'Forging', 'Profile'],
    capability_needed: 'Packaging, documentation, inspection coordination, logistics support, and buyer communication.',
    documents_needed: 'Invoice, packing list, test certificate where required, inspection document, and export documents.',
    onboarding_questions: ['Which countries or regions are served?', 'What packaging is offered?', 'Can inspection be arranged?', 'Which product forms are export-ready?'],
    priority_level: 'Low',
    status: 'Draft / Needs Review',
  },
  {
    seller_category: 'Manufacturers',
    what_they_supply: 'Finished or semi-finished industrial products, fabricated assemblies, components, and repeat production items.',
    metals_supported: ['Steel', 'Copper', 'Aluminium', 'Stainless Steel', 'Brass'],
    product_forms_supported: ['Finished component', 'Fabrication', 'Assembly', 'Machined part', 'Extrusion'],
    capability_needed: 'Process control, capacity clarity, quality documentation, drawing review, and repeat order discipline.',
    documents_needed: 'Drawing approval, inspection report, material certificate where needed, and process or test report.',
    onboarding_questions: ['Which products are made in-house?', 'What process capability exists?', 'Can repeat production be handled?', 'What quality documents can be shared?'],
    priority_level: 'High',
    status: 'Draft / Needs Review',
  },
];

export const tmisOpportunityMapRows: TmisOpportunityMapRow[] = [
  {
    opportunity_name: 'Copper Busbar',
    metal: 'Copper',
    grade: 'Buyer-specified copper family',
    product_form: 'Busbar',
    target_buyers: ['Electrical panel builders', 'Transformer manufacturers', 'EV component manufacturers'],
    target_sellers: ['Copper stockists', 'Distributors', 'Manufacturers'],
    quality_focus: 'Size, surface condition, bending or punching need, and document support.',
    certificate_requirement: 'Material certificate or test report where buyer specifies it.',
    rfq_priority: 'High',
    target_priority: 'High',
    business_reason: 'Strong connection to electrical buyers and clear RFQ fields for size, quantity, and fabrication.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'Copper Wire Rod',
    metal: 'Copper',
    grade: 'Buyer-specified copper family',
    product_form: 'Wire rod',
    target_buyers: ['Wire manufacturers', 'Motor rewinders'],
    target_sellers: ['Copper stockists', 'Rolling mills', 'Distributors'],
    quality_focus: 'Correct metal family, surface condition, quantity, and supply continuity.',
    certificate_requirement: 'Material certificate where required by buyer.',
    rfq_priority: 'High',
    target_priority: 'High',
    business_reason: 'Good fit for repeat demand and buyer categories that can be segmented by size and quantity.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'EN24 Round Bar',
    metal: 'Steel',
    grade: 'EN24',
    product_form: 'Round bar',
    target_buyers: ['Machining companies', 'Gear manufacturers'],
    target_sellers: ['Steel stockists', 'Forging suppliers', 'Distributors'],
    quality_focus: 'Grade, diameter, supply condition, hardness requirement, and MTC requirement.',
    certificate_requirement: 'MTC and hardness or heat treatment document where specified.',
    rfq_priority: 'High',
    target_priority: 'High',
    business_reason: 'Already connected to TMIS pilot content and has strong buyer planning value.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'Mild Steel Round Bar',
    metal: 'Steel',
    grade: 'Mild Steel family',
    product_form: 'Round bar',
    target_buyers: ['Machining companies', 'Fabrication companies', 'Construction material buyers'],
    target_sellers: ['Steel stockists', 'Rolling mills', 'Distributors'],
    quality_focus: 'Grade clarity, diameter, length, finish, and certificate need where specified.',
    certificate_requirement: 'Certificate only where buyer specifies traceability.',
    rfq_priority: 'High',
    target_priority: 'Medium',
    business_reason: 'Broad demand and easy buyer onboarding, but grade ambiguity needs careful RFQ capture.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'Stainless Steel Sheet',
    metal: 'Stainless Steel',
    grade: 'SS304 or buyer-specified stainless family',
    product_form: 'Sheet',
    target_buyers: ['Fabrication companies', 'Construction material buyers', 'EV component manufacturers'],
    target_sellers: ['Steel stockists', 'Distributors', 'Manufacturers'],
    quality_focus: 'Grade, finish, thickness, surface condition, and certificate support.',
    certificate_requirement: 'MTC where required; finish note where specified.',
    rfq_priority: 'High',
    target_priority: 'High',
    business_reason: 'Useful across fabrication, visible surfaces, and equipment applications.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'Aluminium Extrusion',
    metal: 'Aluminium',
    grade: 'Buyer-specified extrusion family',
    product_form: 'Extrusion',
    target_buyers: ['Fabrication companies', 'EV component manufacturers', 'Construction material buyers'],
    target_sellers: ['Aluminium stockists', 'Manufacturers', 'Distributors'],
    quality_focus: 'Profile drawing, finish, length, quantity, and packaging.',
    certificate_requirement: 'Material certificate or finish document where specified.',
    rfq_priority: 'High',
    target_priority: 'High',
    business_reason: 'Clear fit for profile-based RFQs and supplier capability matching.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'Brass Rod',
    metal: 'Brass',
    grade: 'Buyer-specified brass family',
    product_form: 'Rod',
    target_buyers: ['Machining companies', 'Electrical panel builders'],
    target_sellers: ['Distributors', 'Rolling mills', 'Machining suppliers'],
    quality_focus: 'Rod size, surface condition, machinability context, and document support.',
    certificate_requirement: 'Certificate where required for traceability.',
    rfq_priority: 'Medium',
    target_priority: 'Medium',
    business_reason: 'Good bridge between raw material supply and turned component planning.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'Steel Plate',
    metal: 'Steel',
    grade: 'Buyer-specified steel family',
    product_form: 'Plate',
    target_buyers: ['Fabrication companies', 'Construction material buyers', 'Machining companies'],
    target_sellers: ['Steel stockists', 'Rolling mills', 'Distributors'],
    quality_focus: 'Grade, thickness, size, surface condition, flatness context, and certificate need.',
    certificate_requirement: 'MTC where project or buyer specification requires it.',
    rfq_priority: 'High',
    target_priority: 'High',
    business_reason: 'High-volume form that supports fabrication, cutting, and project supply.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'Gear Shaft',
    metal: 'Steel',
    grade: 'EN24 or buyer-specified engineering steel',
    product_form: 'Gear shaft',
    target_buyers: ['Gear manufacturers', 'Machining companies', 'EV component manufacturers'],
    target_sellers: ['Forging suppliers', 'Machining suppliers', 'Manufacturers'],
    quality_focus: 'Drawing review, grade, heat treatment context, hardness, dimensional inspection, and traceability.',
    certificate_requirement: 'MTC, inspection report, hardness report, and heat treatment document where specified.',
    rfq_priority: 'High',
    target_priority: 'High',
    business_reason: 'Higher-value component opportunity with strong need for supplier capability matching.',
    status: 'Draft / Needs Review',
  },
  {
    opportunity_name: 'Machined Steel Component',
    metal: 'Steel',
    grade: 'Buyer-specified steel family',
    product_form: 'Machined component',
    target_buyers: ['Machining companies', 'EV component manufacturers', 'Manufacturers'],
    target_sellers: ['Machining suppliers', 'Manufacturers', 'Steel stockists'],
    quality_focus: 'Drawing, material, tolerance, inspection, finish, and delivery schedule.',
    certificate_requirement: 'Material certificate and inspection report where specified.',
    rfq_priority: 'Medium',
    target_priority: 'High',
    business_reason: 'Good planning path for moving from raw material supply toward value-added marketplace work.',
    status: 'Draft / Needs Review',
  },
];

export const tmisPlanningConnections: TmisPlanningConnection[] = tmisOpportunityMapRows.map((opportunity) => ({
  metal: opportunity.metal,
  grade: opportunity.grade,
  product_form: opportunity.product_form,
  buyer_category: opportunity.target_buyers.join(', '),
  seller_category: opportunity.target_sellers.join(', '),
  quality_requirement: opportunity.quality_focus,
  certificate_requirement: opportunity.certificate_requirement,
  marketplace_opportunity: opportunity.opportunity_name,
  rfq_priority: opportunity.rfq_priority,
  target_priority: opportunity.target_priority,
  business_reason: opportunity.business_reason,
  status: opportunity.status,
}));

type TmisMetalOpportunitySummaryAccumulator = {
  metal: string;
  opportunity_count: number;
  high_priority_count: number;
  product_forms: Set<string>;
  target_buyers: Set<string>;
  target_sellers: Set<string>;
  status: TmisPlanningStatus;
};

const tmisMetalOpportunitySummaryMap = tmisOpportunityMapRows.reduce<Map<string, TmisMetalOpportunitySummaryAccumulator>>(
  (summary, opportunity) => {
    const current = summary.get(opportunity.metal) || {
      metal: opportunity.metal,
      opportunity_count: 0,
      high_priority_count: 0,
      product_forms: new Set<string>(),
      target_buyers: new Set<string>(),
      target_sellers: new Set<string>(),
      status: 'Draft / Needs Review' as TmisPlanningStatus,
    };

    current.opportunity_count += 1;
    if (opportunity.rfq_priority === 'High' || opportunity.target_priority === 'High') {
      current.high_priority_count += 1;
    }
    current.product_forms.add(opportunity.product_form);
    opportunity.target_buyers.forEach((buyer) => current.target_buyers.add(buyer));
    opportunity.target_sellers.forEach((seller) => current.target_sellers.add(seller));
    summary.set(opportunity.metal, current);
    return summary;
  },
  new Map<string, TmisMetalOpportunitySummaryAccumulator>(),
);

export const tmisMetalOpportunitySummary: TmisMetalOpportunitySummaryRow[] = Array.from(tmisMetalOpportunitySummaryMap.values()).map((row) => ({
  metal: row.metal,
  opportunity_count: row.opportunity_count,
  high_priority_count: row.high_priority_count,
  product_forms: Array.from(row.product_forms).sort(),
  target_buyers: Array.from(row.target_buyers).sort(),
  target_sellers: Array.from(row.target_sellers).sort(),
  status: row.status,
}));

export const tmisPlanningSummary = {
  buyers: tmisBuyerPlanningRows.length,
  sellers: tmisSellerPlanningRows.length,
  opportunities: tmisOpportunityMapRows.length,
  highPriorityOpportunities: tmisOpportunityMapRows.filter((row) => row.target_priority === 'High').length,
  status: 'Draft / Needs Review' as TmisPlanningStatus,
};
