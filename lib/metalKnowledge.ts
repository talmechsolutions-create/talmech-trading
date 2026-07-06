export type MetalUseIndustry={
  name:string;
  usagePercent:number;
  buyerTypes:string[];
  searchKeywords:string[];
  decisionMakers:string[];
  pitchAngle:string;
};
export type MetalGrade={
  grade:string;
  form:string;
  quality:string;
  commonUses:string[];
  buyerIndustries:string[];
  notes:string;
};
export type MetalProfile={
  slug:string;
  name:string;
  symbol:string;
  overview:string;
  qualityChecklist:string[];
  industries:MetalUseIndustry[];
  grades:MetalGrade[];
  buyerSearchTerms:string[];
  supplierSearchTerms:string[];
  coldPitch:string;
};

export const metalProfiles:MetalProfile[]=[
  {
    slug:'steel',name:'Steel',symbol:'Fe/C',
    overview:'Steel is the highest-volume industrial metal for fabrication, construction, auto components, machinery, forging, tools, pipes and infrastructure projects. Talmech should treat steel as a regional-demand product because grade, form, freight and delivery timing change the final landed price.',
    qualityChecklist:['Confirm grade standard such as IS 2062, EN8, EN24, SS304, SS316 or TMT grade','Confirm form: plate, sheet, coil, bar, round, angle, channel, pipe, billet or scrap','Ask for MTC/TC, heat number, thickness tolerance and surface condition','Check rust, bending, oil contamination, mixed lots and weighbridge slip','Quote ex-works, FOR delivery, GST, loading, unloading and freight separately'],
    industries:[
      {name:'Fabrication & engineering workshops',usagePercent:26,buyerTypes:['MS fabricators','machine builders','shed fabricators','industrial structure makers'],searchKeywords:['steel fabricators','MS fabrication','industrial fabrication workshop','sheet metal fabricators'],decisionMakers:['Owner','Purchase manager','Production manager'],pitchAngle:'Offer small/medium lot sourcing, same-week delivery and grade-wise price comparison.'},
      {name:'Construction & infrastructure',usagePercent:24,buyerTypes:['contractors','pre-engineered building firms','TMT dealers','infra subcontractors'],searchKeywords:['construction material suppliers','TMT steel buyers','PEB manufacturers','infrastructure contractors'],decisionMakers:['Project purchase head','Site engineer','Procurement team'],pitchAngle:'Pitch reliable city-to-city steel supply with logistics coordination and locked quote.'},
      {name:'Automotive & auto components',usagePercent:18,buyerTypes:['auto part makers','press shops','forging units','CNC component makers'],searchKeywords:['auto component manufacturer','press component manufacturer','forging company','CNC machining steel components'],decisionMakers:['Vendor development','Purchase head','Plant manager'],pitchAngle:'Pitch repeat-grade procurement for EN series, sheet, bar and alloy steel.'},
      {name:'Pipes, tubes & equipment',usagePercent:12,buyerTypes:['pipe fabricators','boiler equipment makers','process equipment companies'],searchKeywords:['steel pipe fabricator','process equipment manufacturer','boiler manufacturer'],decisionMakers:['Purchase manager','Design head'],pitchAngle:'Pitch grade traceability, mill certificate and logistics support.'},
      {name:'Agriculture, tools & general trade',usagePercent:8,buyerTypes:['tool makers','agri equipment makers','local steel dealers'],searchKeywords:['agricultural equipment manufacturer','steel tool manufacturer','steel dealer'],decisionMakers:['Owner','Purchase executive'],pitchAngle:'Pitch fast quotation and mixed-size lots.'}
    ],
    grades:[
      {grade:'IS 2062 E250/E350',form:'Plate, sheet, angle, channel',quality:'Structural mild steel',commonUses:['sheds','frames','bridges','fabrication'],buyerIndustries:['Fabrication & engineering workshops','Construction & infrastructure'],notes:'High-volume B2B grade. Verify thickness, flatness and test certificate.'},
      {grade:'EN8 / C45',form:'Round bar, flat bar',quality:'Medium carbon steel',commonUses:['shafts','gears','machined parts'],buyerIndustries:['Automotive & auto components','Machine shops'],notes:'Ask for diameter tolerance, straightness and heat treatment condition.'},
      {grade:'EN24 / 42CrMo4',form:'Round bar, forging stock',quality:'Alloy steel',commonUses:['high strength shafts','gears','tooling'],buyerIndustries:['Forging units','Auto component makers'],notes:'Higher value; confirm hardness, chemistry and MTC.'},
      {grade:'SS304 / SS316',form:'Sheet, pipe, plate, fittings',quality:'Stainless steel',commonUses:['food equipment','chemical plants','pharma','kitchen equipment'],buyerIndustries:['Process equipment','Pharma machinery','Food equipment'],notes:'Separate stainless under steel but price using nickel/chromium movements.'},
      {grade:'HMS 1&2 scrap',form:'Scrap',quality:'Heavy melting scrap',commonUses:['re-rolling','foundry charging'],buyerIndustries:['Foundries','rolling mills','scrap yards'],notes:'Check contamination, size, rust, oil and mixed metals.'}
    ],
    buyerSearchTerms:['steel fabricators','MS fabrication workshops','auto component manufacturers','forging companies','PEB manufacturers','construction contractors','steel pipe fabricators','CNC machining companies'],
    supplierSearchTerms:['steel stockist','steel dealer','MS plate supplier','alloy steel supplier','stainless steel supplier','steel scrap dealer'],
    coldPitch:'We help steel consumers source verified grade-wise steel in small-to-medium quantities with regional supplier comparison, logistics coordination and transparent landed pricing.'
  },
  {
    slug:'copper',name:'Copper',symbol:'Cu',overview:'Copper is used where conductivity, corrosion resistance and thermal performance matter. It is a strong target for electrical, EV, HVAC, cable, transformer and industrial maintenance buyers.',
    qualityChecklist:['Confirm purity: ETP, OFC, millberry scrap, berry/candy or mixed copper','Check form: cathode, rod, wire, busbar, tube, strip or scrap','Ask for purity report, oxidation level, insulation removal and contamination percentage','Copper scrap should be checked for PVC, brass, solder, oil and moisture','Because value is high, verify GST, address, weighing and payment safety'],
    industries:[
      {name:'Electrical & cable manufacturing',usagePercent:34,buyerTypes:['cable makers','wire drawing units','busbar fabricators'],searchKeywords:['copper wire manufacturer','cable manufacturer','busbar manufacturer','electrical panel manufacturer'],decisionMakers:['Purchase head','Plant head','Owner'],pitchAngle:'Pitch copper rod, cathode and scrap sourcing with purity verification.'},
      {name:'EV, motors & transformers',usagePercent:22,buyerTypes:['motor winding units','transformer manufacturers','EV component makers'],searchKeywords:['transformer manufacturer','motor winding copper buyer','EV motor manufacturer'],decisionMakers:['Procurement manager','Vendor development'],pitchAngle:'Pitch reliable copper supply for windings, busbars and high-conductivity applications.'},
      {name:'HVAC & refrigeration',usagePercent:14,buyerTypes:['AC coil makers','refrigeration contractors','heat exchanger makers'],searchKeywords:['HVAC coil manufacturer','copper tube supplier','heat exchanger manufacturer'],decisionMakers:['Purchase manager','Owner'],pitchAngle:'Pitch tube/coil supply and scrap buyback network.'},
      {name:'Electronics & industrial components',usagePercent:13,buyerTypes:['PCB units','terminal makers','earthing product makers'],searchKeywords:['earthing electrode manufacturer','electrical component manufacturer','terminal manufacturer'],decisionMakers:['Owner','Purchase executive'],pitchAngle:'Pitch smaller lots, faster quotes and scrap monetization.'}
    ],
    grades:[
      {grade:'ETP Copper',form:'Rod, busbar, strip',quality:'High conductivity commercial copper',commonUses:['busbars','electrical panels','terminals'],buyerIndustries:['Electrical & cable manufacturing','Electronics & industrial components'],notes:'Ask for conductivity and oxygen content where required.'},
      {grade:'OFC Copper',form:'Wire, rod',quality:'Oxygen-free high conductivity',commonUses:['premium cables','electronics','audio/EV applications'],buyerIndustries:['Electrical & cable manufacturing','EV, motors & transformers'],notes:'Higher premium; confirm certification.'},
      {grade:'Millberry Scrap',form:'Clean bright wire scrap',quality:'High purity scrap',commonUses:['recycling','melting','rod manufacturing'],buyerIndustries:['Recyclers','wire drawing units'],notes:'One of the best copper scrap categories. Check insulation and mixed metal contamination.'},
      {grade:'Copper tube',form:'Tube/coil',quality:'Plumbing/HVAC grade',commonUses:['AC coils','refrigeration','heat exchangers'],buyerIndustries:['HVAC & refrigeration'],notes:'Confirm OD, wall thickness, coil length and leakage.'}
    ],
    buyerSearchTerms:['copper wire manufacturers','cable manufacturers','transformer manufacturers','motor winding shops','HVAC coil manufacturers','electrical panel manufacturers','earthing product manufacturers'],supplierSearchTerms:['copper scrap dealer','copper cathode supplier','copper rod supplier','copper tube supplier'],coldPitch:'We help copper buyers and sellers close verified small-to-medium copper deals with purity checks, logistics and transparent daily price references.'
  },
  {
    slug:'aluminum',name:'Aluminum',symbol:'Al',overview:'Aluminum is lightweight, corrosion-resistant and widely used in extrusion, transport, packaging, solar frames, electrical and casting industries. Demand is strongly linked to fabrication clusters and extrusion hubs.',
    qualityChecklist:['Confirm alloy: 6061, 6063, 6082, ADC12, LM6, 1100 or UBC scrap','Confirm form: extrusion, billet, sheet, coil, ingot, casting or scrap','Check paint, anodizing, iron attachments, plastic, oil and mixed alloy contamination','Ask for alloy certificate for critical applications','Separate extrusion scrap, tense, taint/tabor, UBC and mixed scrap'],
    industries:[
      {name:'Extrusion & architectural systems',usagePercent:28,buyerTypes:['window profile makers','aluminum fabricators','extrusion plants'],searchKeywords:['aluminum extrusion manufacturer','aluminium window fabricator','aluminium profile manufacturer'],decisionMakers:['Owner','Purchase manager'],pitchAngle:'Pitch 6063 extrusion billets, profiles and extrusion scrap demand.'},
      {name:'Automotive & transport',usagePercent:18,buyerTypes:['casting units','truck body builders','EV component makers'],searchKeywords:['aluminium casting manufacturer','auto aluminium component manufacturer','truck body builder'],decisionMakers:['Purchase head','Plant manager'],pitchAngle:'Pitch alloy-specific sourcing for lightweight components.'},
      {name:'Solar & electrical',usagePercent:16,buyerTypes:['solar mounting makers','electrical enclosure makers'],searchKeywords:['solar structure manufacturer','solar mounting structure manufacturer','electrical enclosure manufacturer'],decisionMakers:['Procurement manager','Owner'],pitchAngle:'Pitch repeat supply for solar frames, channels and sheets.'},
      {name:'Packaging & consumer goods',usagePercent:14,buyerTypes:['foil converters','packaging units','utensil manufacturers'],searchKeywords:['aluminium foil manufacturer','aluminium packaging manufacturer','aluminium utensil manufacturer'],decisionMakers:['Purchase manager'],pitchAngle:'Pitch sheet/coil sourcing and scrap recycling.'}
    ],
    grades:[
      {grade:'6063',form:'Extrusion billet/profile/scrap',quality:'Extrusion alloy',commonUses:['window sections','solar frames','profiles'],buyerIndustries:['Extrusion & architectural systems','Solar & electrical'],notes:'High lead potential in Pune, Ahmedabad, Mumbai, Delhi NCR.'},
      {grade:'6061 / 6082',form:'Plate, bar, profile',quality:'Structural alloy',commonUses:['machined parts','fixtures','transport'],buyerIndustries:['Automotive & transport','machine shops'],notes:'Confirm T6 temper where applicable.'},
      {grade:'ADC12 / LM6',form:'Ingot/casting scrap',quality:'Casting alloy',commonUses:['die casting','auto components'],buyerIndustries:['Automotive & transport'],notes:'Ask foundries for monthly melt requirement.'},
      {grade:'UBC Scrap',form:'Used beverage cans',quality:'Recycling scrap',commonUses:['secondary aluminum'],buyerIndustries:['Recyclers','ingot makers'],notes:'Needs baling, moisture check and contamination control.'}
    ],buyerSearchTerms:['aluminium extrusion manufacturers','aluminium fabricators','solar structure manufacturers','aluminium casting foundries','electrical enclosure manufacturers','aluminium packaging companies'],supplierSearchTerms:['aluminium scrap dealer','aluminium extrusion scrap supplier','aluminium ingot supplier','aluminium profile supplier'],coldPitch:'We coordinate aluminum alloy supply and scrap movement between extrusion, casting, solar and fabrication clusters with city-wise logistics support.'
  },
  {
    slug:'brass',name:'Brass',symbol:'CuZn',overview:'Brass is a copper-zinc alloy used in fittings, valves, terminals, sanitary hardware, precision machining and decorative products. Buyer targeting should focus on machining clusters and fittings manufacturers.',qualityChecklist:['Confirm alloy/grade such as CZ121, IS 319, free cutting brass or honey brass scrap','Check zinc/copper ratio and lead content where applicable','Separate honey brass, brass boring, turning and mixed yellow scrap','Check oil, moisture, iron, plastic and plating contamination','For components, confirm rod diameter, hex bar, flat bar or casting form'],industries:[
      {name:'Valves, fittings & sanitary hardware',usagePercent:32,buyerTypes:['valve manufacturers','pipe fitting makers','bath fitting companies'],searchKeywords:['brass valve manufacturer','brass fittings manufacturer','bath fitting manufacturer'],decisionMakers:['Owner','Purchase manager'],pitchAngle:'Pitch brass rods, ingots and honey brass scrap supply.'},
      {name:'Electrical terminals & connectors',usagePercent:22,buyerTypes:['terminal makers','switchgear part makers','connector manufacturers'],searchKeywords:['brass terminal manufacturer','electrical connector manufacturer','switchgear component manufacturer'],decisionMakers:['Purchase head','Production manager'],pitchAngle:'Pitch grade-wise rods/strips and recurring small lots.'},
      {name:'CNC machining & turned parts',usagePercent:21,buyerTypes:['CNC shops','precision turned part manufacturers'],searchKeywords:['brass turned parts manufacturer','CNC brass components','precision brass components'],decisionMakers:['Owner','Purchase manager'],pitchAngle:'Pitch reliable rod and boring scrap buyback.'},
      {name:'Decorative & hardware products',usagePercent:12,buyerTypes:['hardware makers','decorative product makers'],searchKeywords:['brass hardware manufacturer','brass decorative products manufacturer'],decisionMakers:['Owner'],pitchAngle:'Pitch smaller quantity sourcing and logistics.'}
    ],grades:[
      {grade:'CZ121 / Free cutting brass',form:'Rod, hex bar',quality:'Machining grade',commonUses:['turned parts','terminals','fittings'],buyerIndustries:['CNC machining & turned parts','Electrical terminals & connectors'],notes:'Ask diameter, length, lead content and tolerance.'},
      {grade:'IS 319 Brass',form:'Sheet, rod, components',quality:'Indian brass standard',commonUses:['hardware','fittings','electrical'],buyerIndustries:['Valves, fittings & sanitary hardware'],notes:'Confirm exact composition.'},
      {grade:'Honey Brass Scrap',form:'Clean yellow brass scrap',quality:'High-value brass scrap',commonUses:['melting','ingot'],buyerIndustries:['Recyclers','foundries'],notes:'Separate from mixed brass and iron attachments.'},
      {grade:'Brass boring/turning',form:'Machining chips',quality:'Scrap',commonUses:['secondary brass'],buyerIndustries:['Scrap recyclers'],notes:'Check oil and moisture deductions.'}
    ],buyerSearchTerms:['brass fittings manufacturers','brass valve manufacturers','brass turned parts manufacturers','brass terminal manufacturers','CNC brass component manufacturers'],supplierSearchTerms:['brass scrap dealer','brass rod supplier','honey brass supplier','brass ingot supplier'],coldPitch:'We help brass buyers and sellers source verified grades for fittings, terminals and turned components with scrap buyback and logistics coordination.'
  },
  {
    slug:'zinc',name:'Zinc',symbol:'Zn',overview:'Zinc is mainly used in galvanizing, die casting, alloys, chemicals and battery-related applications. It is useful for targeting galvanizers, alloy makers and die-casting units.',qualityChecklist:['Confirm SHG 99.995%, Zamak alloy or zinc dross/ash category','For dross and ash, check recovery percentage and contamination','Confirm ingot brand, lot number and purity certificate','Separate zinc die-cast scrap from mixed white metal scrap'],industries:[
      {name:'Galvanizing',usagePercent:48,buyerTypes:['hot dip galvanizers','GI wire plants','pipe galvanizing units'],searchKeywords:['hot dip galvanizing plant','GI wire manufacturer','galvanizing company'],decisionMakers:['Purchase manager','Plant head'],pitchAngle:'Pitch SHG zinc, dross handling and price-linked supply.'},
      {name:'Die casting & Zamak',usagePercent:22,buyerTypes:['zinc die casting units','hardware makers'],searchKeywords:['zinc die casting manufacturer','zamak component manufacturer'],decisionMakers:['Owner','Purchase manager'],pitchAngle:'Pitch Zamak/zinc ingot and scrap sourcing.'},
      {name:'Brass & alloy production',usagePercent:12,buyerTypes:['brass ingot makers','alloy foundries'],searchKeywords:['brass ingot manufacturer','alloy foundry'],decisionMakers:['Owner'],pitchAngle:'Pitch zinc supply linked to brass production.'},
      {name:'Chemicals & batteries',usagePercent:8,buyerTypes:['zinc oxide plants','battery material companies'],searchKeywords:['zinc oxide manufacturer','battery material manufacturer'],decisionMakers:['Purchase manager'],pitchAngle:'Pitch purity and steady supply.'}
    ],grades:[
      {grade:'SHG 99.995%',form:'Ingot',quality:'Special high grade zinc',commonUses:['galvanizing','alloys'],buyerIndustries:['Galvanizing','Brass & alloy production'],notes:'Primary zinc benchmark grade.'},
      {grade:'Zamak 3/5',form:'Ingot',quality:'Zinc die casting alloy',commonUses:['hardware','automotive small parts'],buyerIndustries:['Die casting & Zamak'],notes:'Confirm composition and casting rejection rate.'},
      {grade:'Zinc dross/ash',form:'Scrap/byproduct',quality:'Recovery material',commonUses:['recycling'],buyerIndustries:['Recyclers','galvanizers'],notes:'Recovery percentage determines price.'}
    ],buyerSearchTerms:['hot dip galvanizing plants','GI wire manufacturers','zinc die casting manufacturers','zinc oxide manufacturers','alloy foundries'],supplierSearchTerms:['zinc ingot supplier','zinc dross supplier','zinc scrap dealer'],coldPitch:'We connect zinc buyers with verified ingot, dross and alloy sources, especially for galvanizing and die-casting demand.'
  },
  {
    slug:'nickel',name:'Nickel',symbol:'Ni',overview:'Nickel is used in stainless steel, plating, battery materials and high-performance alloys. It is high-value, so verification and payment safety are critical.',qualityChecklist:['Confirm Class 1 nickel, nickel cathode, nickel alloy or stainless scrap equivalent','For stainless scrap, identify 304/316 content and nickel percentage','Ask for purity certificate and secure payment terms','Check alloy contamination and radiation certificate where required'],industries:[
      {name:'Stainless steel & alloy makers',usagePercent:62,buyerTypes:['stainless steel mills','alloy foundries','SS scrap processors'],searchKeywords:['stainless steel manufacturer','alloy foundry','stainless steel scrap buyer'],decisionMakers:['Purchase head','Raw material manager'],pitchAngle:'Pitch nickel-linked SS scrap and alloy raw material sourcing.'},
      {name:'Battery & EV materials',usagePercent:14,buyerTypes:['battery material companies','EV supply chain companies'],searchKeywords:['battery material manufacturer','EV battery components manufacturer'],decisionMakers:['Vendor development','Procurement head'],pitchAngle:'Pitch verified high-purity nickel supply channels.'},
      {name:'Electroplating',usagePercent:12,buyerTypes:['plating shops','surface treatment companies'],searchKeywords:['nickel plating company','electroplating services'],decisionMakers:['Owner','Purchase manager'],pitchAngle:'Pitch small lots and recurring chemical/metal demand.'},
      {name:'Superalloys & engineering',usagePercent:8,buyerTypes:['aerospace vendors','high temperature alloy users'],searchKeywords:['superalloy manufacturer','aerospace component manufacturer'],decisionMakers:['Purchase head'],pitchAngle:'Pitch certified alloy sourcing only.'}
    ],grades:[
      {grade:'Nickel Class 1',form:'Cathode/briquette',quality:'High purity',commonUses:['stainless','battery','alloys'],buyerIndustries:['Stainless steel & alloy makers','Battery & EV materials'],notes:'High-value, verify supplier strongly.'},
      {grade:'SS 304/316 scrap',form:'Scrap',quality:'Nickel-bearing stainless scrap',commonUses:['melting','alloy recovery'],buyerIndustries:['Stainless steel & alloy makers'],notes:'Sort 304 and 316 separately; molybdenum affects 316 value.'},
      {grade:'Nickel plating material',form:'Anode/chemical input',quality:'Plating grade',commonUses:['electroplating'],buyerIndustries:['Electroplating'],notes:'Small lot but repeat demand.'}
    ],buyerSearchTerms:['stainless steel manufacturers','alloy foundries','nickel plating companies','battery material manufacturers','stainless steel scrap buyers'],supplierSearchTerms:['nickel cathode supplier','stainless steel scrap dealer','nickel alloy supplier'],coldPitch:'We support verified nickel and stainless scrap sourcing for alloy, plating and battery-linked buyers with strict quality documentation.'
  },
  {
    slug:'lead',name:'Lead',symbol:'Pb',overview:'Lead demand is concentrated in batteries, recycling, cable sheathing, radiation shielding and alloys. The best low-budget funnel is battery recyclers and industrial lead users.',qualityChecklist:['Confirm lead purity, remelted lead, lead ingot or battery scrap category','Handle battery scrap carefully with legal and environmental compliance','Check moisture, acid, plastic casing and contamination','Confirm GST and permitted recycler status for scrap'],industries:[
      {name:'Battery manufacturing & recycling',usagePercent:70,buyerTypes:['battery manufacturers','battery recyclers','lead smelters'],searchKeywords:['lead battery recycler','battery manufacturer','lead smelter'],decisionMakers:['Purchase head','Owner'],pitchAngle:'Pitch compliant lead scrap/ingot sourcing and repeat volume.'},
      {name:'Cable & shielding',usagePercent:11,buyerTypes:['cable companies','radiation shielding suppliers'],searchKeywords:['lead sheathed cable manufacturer','radiation shielding supplier'],decisionMakers:['Purchase manager'],pitchAngle:'Pitch purity-certified lead supply.'},
      {name:'Alloys & foundries',usagePercent:8,buyerTypes:['bearing alloy makers','foundries'],searchKeywords:['lead alloy manufacturer','bearing metal manufacturer'],decisionMakers:['Owner','Purchase manager'],pitchAngle:'Pitch small lot lead and alloy material.'}
    ],grades:[
      {grade:'Lead 99.97%',form:'Ingot',quality:'Refined/remelted lead',commonUses:['batteries','shielding','alloys'],buyerIndustries:['Battery manufacturing & recycling','Cable & shielding'],notes:'Confirm purity and source.'},
      {grade:'Battery scrap',form:'Scrap',quality:'Used lead acid battery scrap',commonUses:['recycling'],buyerIndustries:['Battery manufacturing & recycling'],notes:'Only work with compliant handlers/recyclers.'},
      {grade:'Lead cable scrap',form:'Scrap',quality:'Lead sheathing',commonUses:['melting'],buyerIndustries:['Recyclers'],notes:'Check attached copper/aluminum separately.'}
    ],buyerSearchTerms:['lead battery recyclers','battery manufacturers','lead smelters','radiation shielding suppliers','lead alloy manufacturers'],supplierSearchTerms:['lead ingot supplier','battery scrap dealer','lead scrap supplier'],coldPitch:'We connect compliant lead buyers, recyclers and suppliers for ingot and scrap movement with documentation and logistics support.'
  },
  {
    slug:'iron',name:'Iron',symbol:'Fe',overview:'Iron demand is driven by foundries, casting, pig iron, sponge iron, billets and scrap-based melting. This is useful for regional foundry and furnace funnels.',qualityChecklist:['Confirm pig iron, sponge iron, cast iron scrap, MS scrap or foundry grade','Check chemistry: carbon, silicon, sulphur, phosphorus and manganese','For scrap, check rust, oil, non-ferrous contamination and size','Confirm furnace acceptance and loading/unloading terms'],industries:[
      {name:'Foundries & casting units',usagePercent:45,buyerTypes:['CI foundries','SG iron foundries','casting manufacturers'],searchKeywords:['iron foundry','casting manufacturer','SG iron foundry'],decisionMakers:['Owner','Raw material manager'],pitchAngle:'Pitch grade-wise iron scrap, pig iron and foundry inputs.'},
      {name:'Rolling mills & furnaces',usagePercent:28,buyerTypes:['rolling mills','induction furnace units','billet makers'],searchKeywords:['rolling mill','induction furnace','billet manufacturer'],decisionMakers:['Purchase head'],pitchAngle:'Pitch regional scrap and sponge/pig iron availability.'},
      {name:'Machinery & heavy engineering',usagePercent:13,buyerTypes:['machine base casting makers','heavy equipment manufacturers'],searchKeywords:['heavy engineering manufacturer','machine casting manufacturer'],decisionMakers:['Purchase manager'],pitchAngle:'Pitch casting supply chain and raw material coordination.'}
    ],grades:[
      {grade:'Pig Iron',form:'Ingot/lump',quality:'Foundry or steel grade',commonUses:['casting','steelmaking'],buyerIndustries:['Foundries & casting units'],notes:'Chemistry is critical.'},
      {grade:'Sponge Iron / DRI',form:'Lumps/pellets',quality:'Steelmaking input',commonUses:['induction furnace','steelmaking'],buyerIndustries:['Rolling mills & furnaces'],notes:'Check FeM and carbon.'},
      {grade:'Cast iron scrap',form:'Scrap',quality:'Foundry scrap',commonUses:['remelting'],buyerIndustries:['Foundries & casting units'],notes:'Separate from steel scrap.'}
    ],buyerSearchTerms:['iron foundries','casting manufacturers','SG iron foundries','rolling mills','induction furnace units'],supplierSearchTerms:['pig iron supplier','sponge iron supplier','cast iron scrap dealer','iron scrap dealer'],coldPitch:'We coordinate iron and foundry raw material demand between scrap suppliers, foundries and furnace units with route-wise logistics support.'
  },
  {
    slug:'gold',name:'Gold',symbol:'Au',overview:'Gold is mostly precious-metal trading, jewellery manufacturing, investment and electronics recovery. For your MVP, treat gold as verified dealer-only due to high fraud and payment risk.',qualityChecklist:['Confirm 24K/999, 22K/916, dore, jewellery scrap or electronic recovery material','Use verified dealers, assay report and secure payment only','Avoid unknown parties without KYC, GST and physical verification','Quote making/refining/assay charges separately'],industries:[
      {name:'Jewellery manufacturing',usagePercent:72,buyerTypes:['jewellery manufacturers','bullion dealers','karigars'],searchKeywords:['jewellery manufacturer','bullion dealer','gold refiner'],decisionMakers:['Owner','Procurement'],pitchAngle:'Only pitch verified dealer sourcing and assay-backed lots.'},
      {name:'Investment & bullion trade',usagePercent:18,buyerTypes:['bullion traders','dealers'],searchKeywords:['bullion dealer','gold trader'],decisionMakers:['Owner'],pitchAngle:'Focus on trusted network, not open marketplace.'},
      {name:'Electronics recovery',usagePercent:5,buyerTypes:['e-waste recyclers','refiners'],searchKeywords:['e waste recycler','precious metal refiner'],decisionMakers:['Owner'],pitchAngle:'Pitch compliant recovery and refining contacts.'}
    ],grades:[
      {grade:'24K / 999',form:'Bar/coin/bullion',quality:'Pure gold',commonUses:['bullion','jewellery input'],buyerIndustries:['Jewellery manufacturing','Investment & bullion trade'],notes:'Use verified bullion channels.'},
      {grade:'22K / 916',form:'Jewellery/scrap',quality:'Jewellery grade',commonUses:['jewellery'],buyerIndustries:['Jewellery manufacturing'],notes:'Assay required.'},
      {grade:'E-waste precious recovery',form:'Scrap',quality:'Recovery material',commonUses:['refining'],buyerIndustries:['Electronics recovery'],notes:'Compliance and assay driven.'}
    ],buyerSearchTerms:['jewellery manufacturers','bullion dealers','gold refiners','precious metal refiners','e waste recyclers'],supplierSearchTerms:['bullion dealer','gold refiner','jewellery scrap buyer'],coldPitch:'We work only with verified gold and precious metal parties for assay-backed lots, compliance and secure coordination.'
  },
  {
    slug:'silver',name:'Silver',symbol:'Ag',overview:'Silver has demand in jewellery, solar, electronics, brazing alloys and industrial contacts. It can be a good lead category for solar and electrical clusters.',qualityChecklist:['Confirm 999, 925, silver contacts, silver paste, jewellery scrap or industrial scrap','Ask for assay/purity report for high-value lots','Separate silver-plated from solid silver scrap','Verify payment and dealer identity'],industries:[
      {name:'Jewellery & articles',usagePercent:42,buyerTypes:['silver jewellery makers','article manufacturers','bullion dealers'],searchKeywords:['silver jewellery manufacturer','silver articles manufacturer','silver bullion dealer'],decisionMakers:['Owner'],pitchAngle:'Pitch verified lots and assay-backed sourcing.'},
      {name:'Solar & electronics',usagePercent:27,buyerTypes:['solar component companies','electronics recyclers','contact makers'],searchKeywords:['solar panel manufacturer','electrical contact manufacturer','electronics recycler'],decisionMakers:['Purchase manager'],pitchAngle:'Pitch industrial silver and recovery channel.'},
      {name:'Brazing & industrial alloys',usagePercent:12,buyerTypes:['brazing alloy makers','industrial consumable dealers'],searchKeywords:['silver brazing alloy manufacturer','brazing rod manufacturer'],decisionMakers:['Owner','Purchase manager'],pitchAngle:'Pitch small but high-value repeat demand.'}
    ],grades:[
      {grade:'999 Silver',form:'Bar/grain',quality:'Pure silver',commonUses:['bullion','industrial input'],buyerIndustries:['Jewellery & articles','Solar & electronics'],notes:'Assay and payment safety required.'},
      {grade:'925 Sterling',form:'Jewellery/scrap',quality:'Jewellery alloy',commonUses:['jewellery'],buyerIndustries:['Jewellery & articles'],notes:'Purity impacts deduction.'},
      {grade:'Silver contacts/scrap',form:'Industrial scrap',quality:'Recovery material',commonUses:['refining'],buyerIndustries:['Solar & electronics','Brazing & industrial alloys'],notes:'Separate plated material.'}
    ],buyerSearchTerms:['silver jewellery manufacturers','solar panel manufacturers','electrical contact manufacturers','silver brazing alloy manufacturers','precious metal refiners'],supplierSearchTerms:['silver bullion dealer','silver scrap dealer','precious metal refiner'],coldPitch:'We coordinate verified silver buyers and suppliers for jewellery, solar, electronics and industrial alloy demand with assay-led pricing.'
  }
];

export const getMetalProfile=(slug:string)=>metalProfiles.find(m=>m.slug===slug);
export const allBuyerTerms=Array.from(new Set(metalProfiles.flatMap(m=>m.buyerSearchTerms)));
