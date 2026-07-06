export type SupplierSegment = {
  name: string;
  type: 'Manufacturer' | 'Stockist' | 'Dealer' | 'Scrap Supplier' | 'Processor' | 'Importer' | 'Service Center';
  metals: string[];
  searchTerms: string[];
  products: string[];
  qualification: string[];
  pitch: string;
};

export const metalsForSupplierSearch = ['Steel','Iron','Copper','Aluminum','Brass','Zinc','Nickel','Lead','Gold','Silver'];

export const supplierSegments: SupplierSegment[] = [
  {
    name:'Steel rolling mills and rerolling mills', type:'Manufacturer', metals:['Steel','Iron'],
    searchTerms:['steel rolling mill','steel rerolling mill','TMT bar manufacturer','MS angle channel manufacturer','structural steel manufacturer'],
    products:['TMT bars','MS angles','MS channels','MS beams','MS flats','MS rounds','wire rods','billets'],
    qualification:['Confirm BIS/IS grade','Ask rolling capacity/month','Ask current rolling schedule','Ask GST and test certificate availability','Ask ex-works rate and loading terms'],
    pitch:'Talmech Trading brings regional buyers for steel sections, TMT, billets and fabricated requirements. We coordinate verified demand, payment terms and logistics so your stock moves faster.'
  },
  {
    name:'Steel stockists and service centers', type:'Stockist', metals:['Steel'],
    searchTerms:['steel stockist','MS plate stockist','HR coil service center','CR sheet dealer','GI sheet stockist','stainless steel stockist'],
    products:['MS plates','HR sheets','HR coils','CR sheets','GP/GC sheets','SS 304 sheets','SS 316 sheets','pipes','hollow sections'],
    qualification:['Check ready stock list','Ask thickness and size range','Confirm cutting/slitting facility','Ask delivery radius','Confirm brand and mill source'],
    pitch:'Talmech Trading can connect your ready stock with buyers by grade, size and city. Share stock list and we will circulate matched demand with commission-safe coordination.'
  },
  {
    name:'Foundries and casting units', type:'Manufacturer', metals:['Iron','Steel','Aluminum','Brass','Copper'],
    searchTerms:['foundry','casting manufacturer','CI casting manufacturer','SG iron foundry','aluminum casting foundry','brass casting manufacturer'],
    products:['CI castings','SG iron castings','steel castings','aluminum castings','brass castings','machined castings'],
    qualification:['Ask furnace type and capacity','Confirm casting weight range','Ask grade capability','Check machining availability','Ask rejection policy'],
    pitch:'Talmech Trading sources casting demand from industrial buyers and helps foundries get qualified inquiries with grade, drawing, quantity and delivery expectations.'
  },
  {
    name:'Copper manufacturers and dealers', type:'Manufacturer', metals:['Copper'],
    searchTerms:['copper wire manufacturer','copper busbar manufacturer','copper strip manufacturer','copper rod supplier','copper scrap supplier'],
    products:['copper wires','busbars','strips','rods','tubes','cathodes','millberry scrap','berry scrap'],
    qualification:['Confirm purity 99.9%/ETP/OFC','Ask test certificate','Check lot size and packing','Ask price basis LME/MCX/manual','Confirm GST invoice'],
    pitch:'Talmech Trading brings copper buyers from electrical, panel, transformer, EV and fabrication segments. We match grade, purity, quantity and delivery city.'
  },
  {
    name:'Aluminum extrusion and sheet suppliers', type:'Manufacturer', metals:['Aluminum'],
    searchTerms:['aluminum extrusion manufacturer','aluminium profile manufacturer','aluminum sheet supplier','aluminum coil supplier','aluminum scrap supplier'],
    products:['extrusions','profiles','6063 sections','6082 sections','sheets','coils','ingots','UBC scrap','tense scrap'],
    qualification:['Confirm alloy series','Ask die availability','Check MOQ and lead time','Confirm anodizing/powder coating','Ask test certificates'],
    pitch:'Talmech Trading connects aluminum extrusion, sheet and scrap suppliers with buyers in solar, fabrication, auto, furniture and electrical industries.'
  },
  {
    name:'Brass and non-ferrous component manufacturers', type:'Manufacturer', metals:['Brass','Copper','Zinc'],
    searchTerms:['brass component manufacturer','brass part manufacturer','brass rod supplier','brass scrap dealer','brass casting manufacturer'],
    products:['brass rods','brass billets','brass fittings','machined brass parts','brass scrap','honey brass'],
    qualification:['Confirm brass grade/composition','Ask machining capacity','Ask tolerance capability','Check export/domestic focus','Confirm scrap acceptance'],
    pitch:'Talmech Trading supports brass suppliers with buyer discovery from fittings, electrical, plumbing, hardware and precision component markets.'
  },
  {
    name:'Scrap yards and recyclers', type:'Scrap Supplier', metals:['Steel','Iron','Copper','Aluminum','Brass','Zinc','Nickel','Lead'],
    searchTerms:['metal scrap dealer','industrial scrap supplier','steel scrap dealer','copper scrap dealer','aluminum scrap dealer','battery scrap dealer'],
    products:['HMS scrap','CRC bundle','turning scrap','copper millberry','aluminum tense','brass honey','lead battery scrap','mixed scrap'],
    qualification:['Confirm grade and contamination','Ask photos/videos and weighbridge slip','Check pickup location','Ask daily/weekly volume','Confirm payment and loading terms'],
    pitch:'Talmech Trading can aggregate scrap demand from mills and recyclers. Share grade, quantity, photos and location; we will match buyers and logistics.'
  },
  {
    name:'Importers and bulk traders', type:'Importer', metals:['Steel','Copper','Aluminum','Nickel','Zinc','Lead'],
    searchTerms:['metal importer','steel importer','non ferrous metal importer','copper cathode importer','aluminum ingot importer'],
    products:['prime coils','cathodes','ingots','billets','scrap lots','alloy metals'],
    qualification:['Ask landed stock location','Ask import documents if needed','Confirm payment terms','Check minimum order quantity','Ask price validity'],
    pitch:'Talmech Trading can route domestic demand to your landed/import stock and coordinate buyer qualification, logistics and commission-based closure.'
  }
];

export function buildSupplierQueries(segment: SupplierSegment, metal: string, location: string) {
  const base = segment.searchTerms.filter(term => term.toLowerCase().includes(metal.toLowerCase()) || segment.metals.includes(metal)).slice(0, 4);
  const terms = base.length ? base : segment.searchTerms.slice(0, 4);
  return terms.map(term => `${term} in ${location}`);
}
