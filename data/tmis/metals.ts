import type { TmisConfidenceLevel, TmisContentStatus, TmisVerificationStatus } from '@/data/tmis/types';

export type TmisMetalBuyerPlanningNote = {
  buyer_category: string;
  what_they_buy: string;
  why_they_buy_it: string;
  quality_expectation: string;
  how_talmech_can_target_them: string;
};

export type TmisMetalSellerPlanningNote = {
  seller_category: string;
  what_they_supply: string;
  capability_needed: string;
  documents_needed: string;
  how_talmech_can_onboard_them: string;
};

export type TmisMetalMarketplaceOpportunity = {
  product_form: string;
  target_buyers: string;
  target_sellers: string;
  quality_focus: string;
  RFQ_priority: string;
};

export type TmisMetalRecord = {
  metal_name: string;
  slug: string;
  metal_family: string;
  short_description: string;
  industrial_importance: string;
  common_grades: string[];
  common_product_forms: string[];
  common_uses: string[];
  industry_applications: string[];
  buyer_categories: string[];
  seller_categories: string[];
  quality_checks: string[];
  certificates_documents: string[];
  procurement_risks: string[];
  supplier_capability_checks: string[];
  buyer_planning_notes: TmisMetalBuyerPlanningNote[];
  seller_planning_notes: TmisMetalSellerPlanningNote[];
  marketplace_opportunities: TmisMetalMarketplaceOpportunity[];
  rfq_questions: string[];
  related_metals: string[];
  related_products: string[];
  content_status: TmisContentStatus;
  confidence_level: TmisConfidenceLevel;
  verification_status: TmisVerificationStatus;
};

export const tmisMetalRecords: TmisMetalRecord[] = [
  {
    metal_name: 'Steel',
    slug: 'steel',
    metal_family: 'Ferrous metal family',
    short_description:
      'Steel is a broad iron-based metal family used for structural, fabrication, machining, automotive, tooling, construction, and general engineering requirements.',
    industrial_importance:
      'Steel is a core industrial material because it can support many product forms, grades, processing routes, buyer specifications, and supplier capabilities. TMIS should treat steel as a parent planning category, not as one single product.',
    common_grades: ['Mild Steel', 'EN24', 'EN19', 'EN8', 'C45', 'Tool steel families', 'Structural steel families'],
    common_product_forms: ['Round bar', 'Flat bar', 'Plate', 'Sheet', 'Pipe', 'Tube', 'Angle', 'Channel', 'Forging'],
    common_uses: ['Fabrication', 'Machining', 'Shafts', 'Gears', 'Structural work', 'Frames', 'Fasteners', 'Repair and maintenance'],
    industry_applications: ['Automotive', 'Construction', 'Machinery', 'Railways', 'Energy', 'Agriculture', 'General engineering'],
    buyer_categories: ['Fabricators', 'Machine shops', 'OEM purchase teams', 'Construction contractors', 'Maintenance teams'],
    seller_categories: ['Steel stockists', 'Rolling mills', 'Forging suppliers', 'Cutting service centers', 'Heat treatment partners'],
    quality_checks: ['Grade confirmation', 'Dimensional inspection', 'Surface inspection', 'Hardness testing where specified', 'MTC review where required'],
    certificates_documents: ['Material Test Certificate', 'Heat number traceability document', 'Inspection report', 'Purchase order specification', 'Test report where required'],
    procurement_risks: ['Wrong grade selection', 'Missing certificate', 'Unclear heat treatment condition', 'Size or tolerance mismatch', 'Supplier overclaim'],
    supplier_capability_checks: ['Grade availability', 'Size range', 'Cut-to-length support', 'Testing support', 'Certificate support', 'Delivery capability'],
    buyer_planning_notes: [
      {
        buyer_category: 'Machine shops',
        what_they_buy: 'Round bars, flats, plates, and cut blanks',
        why_they_buy_it: 'Machining shafts, pins, gears, fixtures, and custom components',
        quality_expectation: 'Clear grade, size, tolerance, finish, and certificate requirement when needed',
        how_talmech_can_target_them: 'Create RFQ flows by product form, grade, size, machining use, and delivery location',
      },
      {
        buyer_category: 'Fabricators',
        what_they_buy: 'Sheets, plates, angles, channels, pipes, and tubes',
        why_they_buy_it: 'Frames, structures, brackets, supports, and fabrication jobs',
        quality_expectation: 'Dimensional consistency, surface condition, weldability context, and practical delivery support',
        how_talmech_can_target_them: 'Build quote bundles for common fabrication forms and local logistics needs',
      },
      {
        buyer_category: 'OEM purchase teams',
        what_they_buy: 'Grade-specific bars, plates, forgings, and processed components',
        why_they_buy_it: 'Repeat production, spare parts, and supplier qualification',
        quality_expectation: 'Documentation, repeatability, traceability, and supplier capability evidence',
        how_talmech_can_target_them: 'Use supplier capability profiles and document readiness as matching filters',
      },
    ],
    seller_planning_notes: [
      {
        seller_category: 'Steel stockists',
        what_they_supply: 'Ready stock in common grades and forms',
        capability_needed: 'Inventory visibility, cutting support, packaging, and dispatch coordination',
        documents_needed: 'Invoice, delivery note, material certificate where available, and batch details where relevant',
        how_talmech_can_onboard_them: 'Collect product forms, grade list, size range, certificate support, and service locations',
      },
      {
        seller_category: 'Processing partners',
        what_they_supply: 'Cutting, heat treatment, machining, and surface preparation services',
        capability_needed: 'Process clarity, machine capacity, inspection support, and lead-time discipline',
        documents_needed: 'Process report, test report where needed, and inspection checklist',
        how_talmech_can_onboard_them: 'Map service capabilities to buyer RFQ fields and quality checkpoints',
      },
    ],
    marketplace_opportunities: [
      {
        product_form: 'Round bar',
        target_buyers: 'Machine shops and maintenance teams',
        target_sellers: 'Stockists, mills, and cutting centers',
        quality_focus: 'Grade, diameter, length, finish, certificate, and hardness requirement where specified',
        RFQ_priority: 'High',
      },
      {
        product_form: 'Plate and sheet',
        target_buyers: 'Fabricators, contractors, and OEM buyers',
        target_sellers: 'Stockists and service centers',
        quality_focus: 'Thickness, size, flatness, surface condition, grade, and certificate need',
        RFQ_priority: 'High',
      },
      {
        product_form: 'Forging or machined blank',
        target_buyers: 'OEMs and heavy engineering buyers',
        target_sellers: 'Forging suppliers and machining partners',
        quality_focus: 'Grade, heat treatment condition, traceability, drawing review, and inspection plan',
        RFQ_priority: 'Medium',
      },
    ],
    rfq_questions: [
      'Which grade or standard does the buyer require?',
      'Which product form, size, tolerance, finish, and quantity are needed?',
      'Is MTC, hardness testing, heat treatment, or inspection documentation required?',
      'What is the application and delivery location?',
      'Is the buyer open to equivalent material only after review?',
    ],
    related_metals: ['Stainless Steel', 'Aluminium', 'Brass'],
    related_products: ['Mild Steel Round Bar', 'EN24 Round Bar', 'Steel Plate', 'Steel Pipe'],
    content_status: 'Draft',
    confidence_level: 'Medium',
    verification_status: 'Needs Review',
  },
  {
    metal_name: 'Copper',
    slug: 'copper',
    metal_family: 'Non-ferrous metal family',
    short_description:
      'Copper is a non-ferrous metal commonly associated with electrical, thermal, plumbing, fabrication, and industrial component applications.',
    industrial_importance:
      'Copper matters to TMIS because buyers often need it for conductivity, heat transfer, corrosion context, and formed products. Planning should separate electrical buyers, plumbing buyers, industrial fabricators, and scrap or recycling channels.',
    common_grades: ['Commercial copper families', 'Electrolytic copper families', 'Copper alloy families', 'Buyer-specified copper grades'],
    common_product_forms: ['Wire', 'Rod', 'Busbar', 'Sheet', 'Plate', 'Tube', 'Pipe', 'Strip'],
    common_uses: ['Electrical conductors', 'Busbars', 'Earthing components', 'Heat transfer parts', 'Plumbing lines', 'Fabricated components'],
    industry_applications: ['Electrical', 'Power distribution', 'HVAC', 'Plumbing', 'Electronics', 'Industrial maintenance'],
    buyer_categories: ['Electrical contractors', 'Panel builders', 'HVAC fabricators', 'Plumbing contractors', 'OEM electrical teams'],
    seller_categories: ['Copper stockists', 'Wire and cable suppliers', 'Busbar fabricators', 'Tube suppliers', 'Scrap and recycling partners'],
    quality_checks: ['Grade and purity context review', 'Dimensional inspection', 'Surface condition check', 'Conductivity requirement review where specified', 'Document review'],
    certificates_documents: ['Material certificate where available', 'Test report where required', 'Invoice and packing list', 'Inspection report', 'Traceability document where applicable'],
    procurement_risks: ['Wrong copper family', 'Unclear purity claim', 'Size mismatch', 'Surface damage', 'Unsupported conductivity claim', 'Scrap mixing risk'],
    supplier_capability_checks: ['Form availability', 'Cutting or bending support', 'Document support', 'Packaging for soft material', 'Delivery capability'],
    buyer_planning_notes: [
      {
        buyer_category: 'Panel builders',
        what_they_buy: 'Copper busbars, strips, rods, and fabricated conductors',
        why_they_buy_it: 'Power distribution and electrical panel assembly',
        quality_expectation: 'Correct size, surface condition, bendability context, and document support where specified',
        how_talmech_can_target_them: 'Create RFQ prompts for busbar dimensions, hole pattern, finish, and drawing upload',
      },
      {
        buyer_category: 'HVAC and heat-transfer buyers',
        what_they_buy: 'Copper tubes, pipes, sheets, and coils',
        why_they_buy_it: 'Thermal transfer, plumbing, and service installation',
        quality_expectation: 'Form, wall or size requirement, surface condition, and application suitability review',
        how_talmech_can_target_them: 'Group copper RFQs by application, size, length, and delivery urgency',
      },
    ],
    seller_planning_notes: [
      {
        seller_category: 'Copper stockists',
        what_they_supply: 'Sheets, rods, busbars, tubes, and general copper forms',
        capability_needed: 'Size range clarity, cut-to-size support, packaging care, and document readiness',
        documents_needed: 'Invoice, test certificate where available, and dispatch documents',
        how_talmech_can_onboard_them: 'Collect product forms, common size bands, cutting support, and certificate availability',
      },
      {
        seller_category: 'Fabricators',
        what_they_supply: 'Bent, punched, cut, or formed copper components',
        capability_needed: 'Drawing review, fabrication process capability, inspection support, and lead-time clarity',
        documents_needed: 'Drawing approval, inspection report, and material certificate where required',
        how_talmech_can_onboard_them: 'Map process capability against buyer drawing and document needs',
      },
    ],
    marketplace_opportunities: [
      {
        product_form: 'Busbar',
        target_buyers: 'Panel builders and electrical contractors',
        target_sellers: 'Copper stockists and busbar fabricators',
        quality_focus: 'Size, surface, bend or punching requirement, and document support',
        RFQ_priority: 'High',
      },
      {
        product_form: 'Tube and pipe',
        target_buyers: 'HVAC, plumbing, and maintenance teams',
        target_sellers: 'Tube suppliers and stockists',
        quality_focus: 'Size, wall requirement, surface condition, and packaging',
        RFQ_priority: 'Medium',
      },
    ],
    rfq_questions: [
      'Which copper form is required?',
      'What size, length, thickness, or drawing detail is needed?',
      'Is conductivity, certificate, or test documentation required?',
      'Does the buyer need cutting, bending, punching, or fabrication?',
      'How should soft material be packed and delivered?',
    ],
    related_metals: ['Brass', 'Aluminium', 'Stainless Steel'],
    related_products: ['Copper Busbar', 'Copper Tube', 'Copper Sheet', 'Copper Rod'],
    content_status: 'Draft',
    confidence_level: 'Medium',
    verification_status: 'Needs Review',
  },
  {
    metal_name: 'Aluminium',
    slug: 'aluminium',
    metal_family: 'Non-ferrous light metal family',
    short_description:
      'Aluminium is a lightweight non-ferrous metal used in fabrication, extrusion, transport, electrical, construction, packaging, and general engineering applications.',
    industrial_importance:
      'Aluminium is important for buyers who need lower weight, formed sections, corrosion context, and extruded or sheet products. TMIS should separate extrusion, sheet, plate, fabrication, and casting opportunities.',
    common_grades: ['Commercial aluminium families', 'Extrusion grade families', 'Sheet and plate grade families', 'Casting alloy families', 'Buyer-specified grades'],
    common_product_forms: ['Extrusion profile', 'Sheet', 'Plate', 'Rod', 'Bar', 'Tube', 'Channel', 'Angle', 'Casting'],
    common_uses: ['Fabrication', 'Frames', 'Panels', 'Electrical enclosures', 'Transport parts', 'Machine guards', 'Lightweight components'],
    industry_applications: ['Construction', 'Electrical enclosures', 'Automotive', 'Aerospace-adjacent fabrication', 'Packaging', 'Machinery'],
    buyer_categories: ['Fabricators', 'Extrusion buyers', 'Electrical panel makers', 'Vehicle body builders', 'Maintenance teams'],
    seller_categories: ['Aluminium stockists', 'Extrusion suppliers', 'Sheet and plate suppliers', 'Fabricators', 'Casting suppliers'],
    quality_checks: ['Grade and temper context review', 'Dimensional inspection', 'Surface finish check', 'Coating or anodizing review where specified', 'Document review'],
    certificates_documents: ['Material certificate where available', 'Coating or finish document where required', 'Inspection report', 'Drawing approval', 'Dispatch documents'],
    procurement_risks: ['Wrong alloy family', 'Unclear temper or condition', 'Profile mismatch', 'Surface scratches', 'Finish mismatch', 'Unsupported substitution'],
    supplier_capability_checks: ['Profile availability', 'Extrusion or fabrication support', 'Finish support', 'Packaging care', 'Document readiness'],
    buyer_planning_notes: [
      {
        buyer_category: 'Extrusion buyers',
        what_they_buy: 'Profiles, channels, angles, tubes, and custom sections',
        why_they_buy_it: 'Frames, panels, machine guards, enclosures, and lightweight structures',
        quality_expectation: 'Correct profile, length, finish, tolerance context, and approved drawing',
        how_talmech_can_target_them: 'Use drawing upload, profile type, finish, quantity, and repeat-order fields',
      },
      {
        buyer_category: 'Fabricators',
        what_they_buy: 'Sheets, plates, angles, and cut-to-size pieces',
        why_they_buy_it: 'Panels, covers, brackets, lightweight assemblies, and repair jobs',
        quality_expectation: 'Surface condition, thickness, flatness context, finish, and packaging care',
        how_talmech_can_target_them: 'Offer RFQ flows by thickness, sheet size, finish, cutting, and delivery city',
      },
    ],
    seller_planning_notes: [
      {
        seller_category: 'Extrusion suppliers',
        what_they_supply: 'Standard and custom aluminium profiles',
        capability_needed: 'Profile tooling context, size range, finish support, and lead-time clarity',
        documents_needed: 'Drawing approval, material certificate where available, and finish report where required',
        how_talmech_can_onboard_them: 'Capture profile families, tooling limits, finish options, and MOQ style',
      },
      {
        seller_category: 'Sheet and plate stockists',
        what_they_supply: 'Sheets, plates, rods, tubes, and bars',
        capability_needed: 'Inventory visibility, cutting support, surface protection, and packaging',
        documents_needed: 'Invoice, dispatch document, certificate where available, and inspection note if needed',
        how_talmech_can_onboard_them: 'Build catalog filters for form, thickness, finish, cut-to-size, and service area',
      },
    ],
    marketplace_opportunities: [
      {
        product_form: 'Extrusion profile',
        target_buyers: 'Fabricators, panel makers, and equipment builders',
        target_sellers: 'Extrusion suppliers and fabricators',
        quality_focus: 'Profile drawing, finish, length, quantity, and packaging',
        RFQ_priority: 'High',
      },
      {
        product_form: 'Sheet and plate',
        target_buyers: 'Fabricators and maintenance teams',
        target_sellers: 'Stockists and service centers',
        quality_focus: 'Grade, thickness, surface condition, finish, and cut size',
        RFQ_priority: 'High',
      },
    ],
    rfq_questions: [
      'Is the buyer asking for sheet, plate, extrusion, tube, rod, or casting?',
      'What grade, condition, finish, and drawing details are known?',
      'Is anodizing, coating, cutting, or fabrication required?',
      'What surface protection and packaging are needed?',
      'Is repeat supply or tooling support expected?',
    ],
    related_metals: ['Steel', 'Copper', 'Stainless Steel'],
    related_products: ['Aluminium Profile', 'Aluminium Sheet', 'Aluminium Plate', 'Aluminium Tube'],
    content_status: 'Draft',
    confidence_level: 'Medium',
    verification_status: 'Needs Review',
  },
  {
    metal_name: 'Stainless Steel',
    slug: 'stainless-steel',
    metal_family: 'Ferrous corrosion-resistant alloy family',
    short_description:
      'Stainless steel is a corrosion-resistant steel family used for fabrication, food equipment, process equipment, architecture, fasteners, and hygienic industrial applications.',
    industrial_importance:
      'Stainless steel is a high-value planning category because buyers often care about grade family, finish, hygiene, corrosion context, fabrication method, and documentation. TMIS should keep grade and application suitability review-gated.',
    common_grades: ['SS304 family', 'SS316 family', 'SS410 family', 'SS430 family', 'Buyer-specified stainless grades'],
    common_product_forms: ['Sheet', 'Plate', 'Pipe', 'Tube', 'Round bar', 'Flat bar', 'Angle', 'Fastener', 'Fabricated component'],
    common_uses: ['Food equipment', 'Chemical equipment', 'Architectural work', 'Piping', 'Tanks', 'Fasteners', 'Fabricated assemblies'],
    industry_applications: ['Food processing', 'Pharma-adjacent fabrication', 'Chemical handling', 'Architecture', 'Marine-adjacent use', 'General engineering'],
    buyer_categories: ['Food equipment fabricators', 'Process equipment buyers', 'Architectural fabricators', 'Maintenance teams', 'OEM buyers'],
    seller_categories: ['Stainless steel stockists', 'Pipe and tube suppliers', 'Fabricators', 'Polishing service providers', 'Fastener suppliers'],
    quality_checks: ['Grade confirmation', 'Surface finish inspection', 'Dimensional inspection', 'Weld and fabrication review where needed', 'Certificate review'],
    certificates_documents: ['Material Test Certificate', 'Surface finish note where required', 'Inspection report', 'Welding or fabrication document where applicable', 'Purchase specification'],
    procurement_risks: ['Wrong stainless grade', 'Finish mismatch', 'Surface contamination', 'Unsupported corrosion claim', 'Certificate mismatch', 'Fabrication quality issue'],
    supplier_capability_checks: ['Grade availability', 'Finish support', 'Pipe or tube schedule context where required', 'Fabrication skill', 'Certificate support'],
    buyer_planning_notes: [
      {
        buyer_category: 'Food equipment fabricators',
        what_they_buy: 'Sheets, plates, tubes, pipes, and fabricated parts',
        why_they_buy_it: 'Hygienic equipment, tanks, work tables, conveyors, and process-contact parts',
        quality_expectation: 'Grade clarity, surface finish, clean handling, fabrication quality, and certificate support',
        how_talmech_can_target_them: 'Build RFQs around grade, finish, contact use, fabrication process, and documentation',
      },
      {
        buyer_category: 'Architectural fabricators',
        what_they_buy: 'Sheets, tubes, railings, profiles, and visible fabricated parts',
        why_they_buy_it: 'Railings, facades, trims, fixtures, and public-facing structures',
        quality_expectation: 'Finish consistency, surface protection, dimensions, and delivery condition',
        how_talmech_can_target_them: 'Use finish, visible surface, size, and installation location as RFQ qualifiers',
      },
    ],
    seller_planning_notes: [
      {
        seller_category: 'Stainless stockists',
        what_they_supply: 'Sheets, plates, bars, pipes, tubes, and flats',
        capability_needed: 'Grade range, finish availability, size range, cutting, and certificate support',
        documents_needed: 'Material certificate where required, invoice, packing list, and dispatch documents',
        how_talmech_can_onboard_them: 'Capture grade list, finish list, cutting capability, and certificate readiness',
      },
      {
        seller_category: 'Fabricators and polishers',
        what_they_supply: 'Custom stainless assemblies and finished surfaces',
        capability_needed: 'Welding, polishing, handling, inspection, and drawing review',
        documents_needed: 'Drawing approval, inspection report, finish note, and material certificate where needed',
        how_talmech_can_onboard_them: 'Qualify process capability by industry, finish, and inspection discipline',
      },
    ],
    marketplace_opportunities: [
      {
        product_form: 'Sheet and plate',
        target_buyers: 'Food equipment, architectural, and process fabricators',
        target_sellers: 'Stockists and service centers',
        quality_focus: 'Grade, finish, thickness, surface condition, and certificate',
        RFQ_priority: 'High',
      },
      {
        product_form: 'Pipe and tube',
        target_buyers: 'Process equipment and fabrication buyers',
        target_sellers: 'Pipe suppliers and stainless stockists',
        quality_focus: 'Grade, size, wall context, finish, and document support',
        RFQ_priority: 'High',
      },
    ],
    rfq_questions: [
      'Which stainless grade family and product form are required?',
      'What finish, surface condition, size, and quantity are needed?',
      'Is the use food, process, architectural, marine-adjacent, or general fabrication?',
      'Is material certificate or inspection documentation required?',
      'Does the supplier need polishing, cutting, welding, or fabrication capability?',
    ],
    related_metals: ['Steel', 'Aluminium', 'Brass'],
    related_products: ['Stainless Steel Sheet', 'Stainless Steel Pipe', 'Stainless Steel Round Bar', 'Stainless Steel Fabrication'],
    content_status: 'Draft',
    confidence_level: 'Medium',
    verification_status: 'Needs Review',
  },
  {
    metal_name: 'Brass',
    slug: 'brass',
    metal_family: 'Copper alloy family',
    short_description:
      'Brass is a copper alloy family commonly used for fittings, valves, decorative parts, electrical components, turned parts, hardware, and precision components.',
    industrial_importance:
      'Brass is important for TMIS because demand often connects material choice, machinability context, appearance, corrosion context, fittings, and small component manufacturing. Buyer planning should distinguish turned parts, plumbing fittings, decorative hardware, and electrical items.',
    common_grades: ['Common brass families', 'Free-machining brass families', 'Forging brass families', 'Buyer-specified brass grades'],
    common_product_forms: ['Rod', 'Bar', 'Sheet', 'Strip', 'Tube', 'Fitting', 'Valve body', 'Turned component'],
    common_uses: ['Fittings', 'Valves', 'Bushes', 'Fasteners', 'Electrical terminals', 'Decorative hardware', 'Precision turned parts'],
    industry_applications: ['Plumbing', 'Electrical', 'Hardware', 'Automotive components', 'Instrumentation', 'General engineering'],
    buyer_categories: ['Turned-part manufacturers', 'Plumbing fitting buyers', 'Electrical component makers', 'Hardware brands', 'Maintenance buyers'],
    seller_categories: ['Brass stockists', 'Brass rod suppliers', 'Fitting manufacturers', 'CNC turning shops', 'Foundry and forging suppliers'],
    quality_checks: ['Grade or alloy family review', 'Dimensional inspection', 'Surface finish check', 'Machining or thread quality review', 'Document review where required'],
    certificates_documents: ['Material certificate where available', 'Inspection report', 'Drawing approval', 'Plating or finish document where required', 'Dispatch documents'],
    procurement_risks: ['Wrong brass family', 'Machining issue', 'Thread mismatch', 'Finish mismatch', 'Unsupported lead-free or compliance claim', 'Document gap'],
    supplier_capability_checks: ['Rod or form availability', 'CNC turning support', 'Threading or fitting capability', 'Finish or plating support', 'Document readiness'],
    buyer_planning_notes: [
      {
        buyer_category: 'Turned-part manufacturers',
        what_they_buy: 'Brass rods, bars, and cut blanks',
        why_they_buy_it: 'CNC turned parts, bushes, terminals, fittings, and precision small components',
        quality_expectation: 'Grade context, diameter, straightness, machinability context, and surface condition',
        how_talmech_can_target_them: 'Use RFQ fields for rod size, drawing, tolerance, quantity, and machining partner need',
      },
      {
        buyer_category: 'Plumbing and fitting buyers',
        what_they_buy: 'Fittings, valves, connectors, threaded parts, and forged or machined components',
        why_they_buy_it: 'Water, gas, service, and assembly applications depending on buyer specification',
        quality_expectation: 'Thread quality, finish, pressure or application context review, and documentation where required',
        how_talmech_can_target_them: 'Route RFQs by fitting type, thread, application, finish, and compliance note',
      },
    ],
    seller_planning_notes: [
      {
        seller_category: 'Brass stockists',
        what_they_supply: 'Rods, bars, sheets, strips, and tubes',
        capability_needed: 'Size range, cutting support, surface protection, and certificate availability',
        documents_needed: 'Invoice, certificate where available, and dispatch documents',
        how_talmech_can_onboard_them: 'Capture form range, size range, cutting capability, and common buyer segments',
      },
      {
        seller_category: 'CNC turning shops',
        what_they_supply: 'Turned brass parts, threaded parts, terminals, bushes, and custom components',
        capability_needed: 'Drawing review, machine capacity, inspection discipline, finish support, and repeat production ability',
        documents_needed: 'Drawing approval, inspection report, material certificate where needed, and process note',
        how_talmech_can_onboard_them: 'Build capability profiles around tolerance style, part size, batch size, and inspection support',
      },
    ],
    marketplace_opportunities: [
      {
        product_form: 'Rod and bar',
        target_buyers: 'Turning shops and component manufacturers',
        target_sellers: 'Stockists and rod suppliers',
        quality_focus: 'Grade context, size, surface condition, straightness, and certificate availability',
        RFQ_priority: 'High',
      },
      {
        product_form: 'Fitting or turned component',
        target_buyers: 'Plumbing, electrical, and hardware buyers',
        target_sellers: 'CNC shops, fitting manufacturers, and forging suppliers',
        quality_focus: 'Drawing, thread, finish, inspection, and application context',
        RFQ_priority: 'Medium',
      },
    ],
    rfq_questions: [
      'Does the buyer need raw brass form or finished component?',
      'What grade family, diameter, size, drawing, or thread detail is known?',
      'Is machining, forging, plating, polishing, or assembly required?',
      'Is document support, inspection report, or compliance note required?',
      'What quantity and repeat-supply expectation should suppliers quote against?',
    ],
    related_metals: ['Copper', 'Stainless Steel', 'Aluminium'],
    related_products: ['Brass Rod', 'Brass Fitting', 'Brass Bush', 'Brass Sheet'],
    content_status: 'Draft',
    confidence_level: 'Medium',
    verification_status: 'Needs Review',
  },
];

export const tmisMetalPublicRoutes = tmisMetalRecords.map((metal) => ({
  path: `/tmis/metals/${metal.slug}`,
  title: `${metal.metal_name} Metal Intelligence`,
}));

export function findTmisMetal(slug: string) {
  return tmisMetalRecords.find((metal) => metal.slug === slug);
}
