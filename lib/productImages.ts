export function productSlug(name: string) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'tmt-bars': '/images/products/tmt-bars.webp',
  'rebar-tmt-rods': '/images/products/tmt-bars.webp',
  'ms-angles': '/images/products/ms-angles.webp',
  'angle-bars': '/images/products/ms-angles.webp',
  'ms-channels': '/images/products/ms-channels.webp',
  'ms-beams': '/images/products/ms-beams.webp',
  'i-beams': '/images/products/ms-beams.webp',
  'ms-flats': '/images/products/ms-flats.webp',
  'flat-bars': '/images/products/ms-flats.webp',
  'ms-rounds': '/images/products/ms-rounds.webp',
  'bright-bars': '/images/products/ms-rounds.webp',
  'ms-square-bars': '/images/products/ms-square-bars.webp',
  'square-bars': '/images/products/ms-square-bars.webp',
  'hr-sheets': '/images/products/hr-sheets.webp',
  'hr-coils': '/images/products/hr-coils.webp',
  'cr-sheets': '/images/products/cr-sheets.webp',
  'gp-gc-sheets': '/images/products/gp-gc-sheets.webp',
  'ms-plates': '/images/products/hr-sheets.webp',
  'chequered-plates': '/images/products/hr-sheets.webp',
  'ms-pipes': '/images/products/ms-pipes.webp',
  'gi-pipes': '/images/products/gi-pipes.webp',
  'hollow-sections': '/images/products/hollow-sections.webp',
  'square-tubes': '/images/products/square-tubes.webp',
  'rectangular-tubes': '/images/products/rectangular-tubes.webp',
  'wire-rods': '/images/products/wire-rods.webp',
  'binding-wire': '/images/products/binding-wire.webp',
  'fasteners': '/images/products/fasteners.webp',
  'fabricated-structures': '/images/products/fabricated-structures.webp',
  'forged-shafts': '/images/products/forged-shafts.webp',
  'hms-scrap': '/images/products/hms-scrap.webp',
  'crc-bundle-scrap': '/images/products/crc-bundle-scrap.webp',
  'turning-scrap': '/images/products/turning-scrap.webp',
  'copper-cathode': '/images/products/copper-cathode.webp',
  'copper-rod': '/images/products/copper-rod.webp',
  'copper-wire': '/images/products/copper-wire.webp',
  'copper-strip': '/images/products/copper-strip.webp',
  'copper-sheet': '/images/products/copper-sheet.webp',
  'copper-busbar': '/images/products/copper-busbar.webp',
  'copper-pipe': '/images/products/copper-pipe.webp',
  'copper-winding-wire': '/images/products/copper-winding-wire.webp',
  'copper-scrap': '/images/products/copper-scrap-berry.webp',
  'copper-scrap-berry': '/images/products/copper-scrap-berry.webp',
  'copper-scrap-millberry': '/images/products/copper-scrap-millberry.webp',
  'copper-armature-scrap': '/images/products/copper-armature-scrap.webp',
  'aluminum-ingot': '/images/products/aluminum-ingot.webp',
  'aluminum-billet': '/images/metal-categories/aluminum.webp',
  'aluminum-extrusion': '/images/metal-categories/aluminum.webp',
  'aluminum-sheet': '/images/metal-categories/aluminum.webp',
  'aluminum-coil': '/images/metal-categories/aluminum.webp',
  'aluminum-profile': '/images/metal-categories/aluminum.webp',
  'aluminum-pipe': '/images/metal-categories/aluminum.webp',
  'aluminum-section': '/images/metal-categories/aluminum.webp',
  'brass-rods': '/images/products/brass-rods.webp',
  'brass-sheets': '/images/metal-categories/brass.webp',
  'brass-tubes': '/images/metal-categories/brass.webp',
  'brass-fittings': '/images/metal-categories/brass.webp',
  'brass-valves': '/images/metal-categories/brass.webp',
  'forged-rings': '/images/metal-categories/forging-components.webp',
  'flanges': '/images/metal-categories/forging-components.webp',
  'gear-blanks': '/images/metal-categories/forging-components.webp',
  'connecting-rods': '/images/metal-categories/forging-components.webp',
  'crankshafts': '/images/metal-categories/forging-components.webp',
  'cnc-machined-parts': '/images/metal-categories/aerospace-precision-components.webp',
  'turned-components': '/images/metal-categories/aerospace-precision-components.webp',
  'aerospace-brackets': '/images/metal-categories/aerospace-precision-components.webp',
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  steel: '/images/metal-categories/steel.webp',
  copper: '/images/metal-categories/copper.webp',
  aluminum: '/images/metal-categories/aluminum.webp',
  brass: '/images/metal-categories/brass.webp',
  iron: '/images/metal-categories/iron.webp',
  zinc: '/images/metal-categories/zinc.webp',
  nickel: '/images/metal-categories/nickel.webp',
  lead: '/images/metal-categories/lead.webp',
  'forging-components': '/images/metal-categories/forging-components.webp',
  'aerospace-precision-components': '/images/metal-categories/aerospace-precision-components.webp',
};

export function getProductImage(product?: string, metalSlug?: string) {
  const direct = PRODUCT_IMAGE_MAP[productSlug(product || '')];
  return direct || getMetalImage(metalSlug || 'steel');
}

export function getMetalImage(slug?: string) {
  return CATEGORY_IMAGE_MAP[String(slug || '').toLowerCase()] || '/images/metal-categories/steel.webp';
}
