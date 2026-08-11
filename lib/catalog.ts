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
};

export const normalizeCategoryName = (category: string): string => {
  if (!category || typeof category !== 'string') return '';
  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'betta' || lower === 'bettas') return 'Bettas';
  if (lower === 'guppy' || lower === 'guppies') return 'Guppies';
  if (lower === 'crayfish' || lower === 'crayfishes') return 'Crayfish';
  if (lower === 'molly' || lower === 'mollies') return 'Molly';
  if (lower === 'plant' || lower === 'plants') return 'Plants';
  if (lower === 'kribensis') return 'Kribensis';
  if (lower === 'apistogramma') return 'Apistogramma';
  if (lower === 'jewel cichlid' || lower === 'jewel cichlids') return 'Jewel Cichlid';
  if (lower === 'ram cichlid' || lower === 'ram cichlids') return 'Ram Cichlid';

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const getCategoryImage = (category: string): string => {
  const norm = normalizeCategoryName(category);
  return CATEGORY_IMAGES[norm] || CATEGORY_IMAGES[category] || '/fishes_cat_cover/Guppies.jpeg';
};
