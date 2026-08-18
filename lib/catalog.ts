export const PRODUCT_CATALOG = {
  Guppies: [
    'Red AFs',
    'Purple berry dragon',
    'White tuxedo',
    'Platinum big ear',
    'Platinum white guppy',
    'Golden guppies',
    'Blue panda big ear',
    'HB Silverado',
    'Chilli mosaic dumbo ear',
    'Red ear koi',
    'Full red black eye ribbon',
    'Black eye koi',
    'Metal head lace',
    'Japanese blue guppy',
    'HB Blue overtale',
    'Endler guppy (Scarlet)',
    'Red coral Endler',
    'Red dragon guppies',
  ],
  Crayfish: [
    'Red',
    'Marlboro Brown',
    'Purple',
    'Valentine Pink',
    'Electric Blue',
    'White',
    'G.K Gold',
    'Pink Ghost',
    'Brown Ghost',
    'Red Ghost',
    'Purple Ghost',
  ],
  'Jewel Cichlid': [
    'Red Jewel',
    'Pineapple Jewel',
    'Turkana Jewel',
    'Turquoise Blue Jewel',
  ],
  'Ram Cichlid': [
    'German Blue Ram',
    'Gold Ram',
    'Electric Blue Ram',
    'Dark German Blue Ram',
    'German Blue Ram Veiltail',
  ],
  Kribensis: [
    'Super Red Rainbow Kribensis',
    'Albino Kribensis',
  ],
  Apistogramma: [
    'Cacatu Orange Flash',
    'Cacatu Triple Red',
    'Cacatu Golden Phoenix',
    'Agazzizi Double Red',
    'Agazzizi Fire Gold',
  ],
  Molly: [],
} as const;

export type ProductCategory = keyof typeof PRODUCT_CATALOG;
export type ProductSubcategory = (typeof PRODUCT_CATALOG)[ProductCategory][number];

export const PRODUCT_CATEGORIES = Object.keys(PRODUCT_CATALOG) as ProductCategory[];

export const FISH_NAMES = Array.from(new Set(Object.values(PRODUCT_CATALOG).flat()));

export const getSubcategoriesForCategory = (category: string) =>
  (PRODUCT_CATALOG as Record<string, readonly string[]>)[category] ?? [];

export const CATEGORY_IMAGES: Record<string, string> = {
  Guppies: '/fishes_cat_cover/Guppies.jpeg',
  Crayfish: '/fishes_cat_cover/Crayfish.png',
  'Jewel Cichlid': '/fishes_cat_cover/Jewel_Cichlid.png',
  'Ram Cichlid': '/fishes_cat_cover/Rams.jpeg',
  Kribensis: '/fishes_cat_cover/Kribensis.png',
  Apistogramma: '/fishes_cat_cover/Apistogramma.png',
  Molly: '/fishes_cat_cover/Guppies.jpeg',
  Plants: '/fishes_cat_cover/Plants.png',
  Angelfish: '/fishes_cat_cover/Guppies.jpeg',
  Bettas: '/fishes_cat_cover/Guppies.jpeg',
  'Discus Fish': '/fishes_cat_cover/Guppies.jpeg',
  'Barb Fish': '/fishes_cat_cover/Guppies.jpeg',
  'Exotic Plecos': '/fishes_cat_cover/Guppies.jpeg',
  'Polar Parrot': '/fishes_cat_cover/Guppies.jpeg',
  Rainbowfish: '/fishes_cat_cover/Guppies.jpeg',
  Swordtails: '/fishes_cat_cover/Guppies.jpeg',
  'Live Culture & Feeds': '/fishes_cat_cover/Guppies.jpeg',
  Shrimps: '/fishes_cat_cover/Crayfish.png',
};

export const normalizeCategoryName = (category: string): string => {
  if (!category || typeof category !== 'string') return '';
  const trimmed = category.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'angel' || lower === 'angels' || lower === 'angel fish' || lower === 'angelfish') return 'Angelfish';
  if (lower === 'betta' || lower === 'bettas') return 'Bettas';
  if (lower === 'guppy' || lower === 'guppies') return 'Guppies';
  if (lower === 'crayfish' || lower === 'crayfishes' || lower === 'cray fish') return 'Crayfish';
  if (lower === 'molly' || lower === 'mollies') return 'Molly';
  if (lower === 'plant' || lower === 'plants' || lower === 'live plants') return 'Plants';
  if (lower === 'kribensis') return 'Kribensis';
  if (lower === 'apistogramma') return 'Apistogramma';
  if (lower === 'jewel cichlid' || lower === 'jewel cichlids') return 'Jewel Cichlid';
  if (lower === 'ram cichlid' || lower === 'ram cichlids') return 'Ram Cichlid';
  if (lower === 'polar parrot' || lower === 'polar parrots') return 'Polar Parrot';
  if (lower === 'shrimp' || lower === 'shrimps') return 'Shrimps';
  if (lower === 'barb' || lower === 'barbs' || lower === 'barb fish') return 'Barb Fish';
  if (lower === 'discuss fish' || lower === 'discus' || lower === 'discus fish') return 'Discus Fish';
  if (lower === 'exotic pleco' || lower === 'exotic plecos') return 'Exotic Plecos';
  if (lower === 'platy' || lower === 'platies') return 'Platy';
  if (lower === 'rainbow' || lower === 'rainbows' || lower === 'rainbow fish' || lower === 'rainbowfish') return 'Rainbowfish';
  if (lower === 'swordtail' || lower === 'swordtails') return 'Swordtails';
  if (lower.includes('live culture') || lower.includes('feeds')) return 'Live Culture & Feeds';
  if (lower === 'zebra' || lower === 'zebra danio') return 'Zebra Danio';

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const getCategoryImage = (category: string): string => {
  const norm = normalizeCategoryName(category);
  return CATEGORY_IMAGES[norm] || CATEGORY_IMAGES[category] || '/fishes_cat_cover/Guppies.jpeg';
};
