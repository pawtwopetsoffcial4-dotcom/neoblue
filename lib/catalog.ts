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
} as const;

export type ProductCategory = keyof typeof PRODUCT_CATALOG;
export type ProductSubcategory = (typeof PRODUCT_CATALOG)[ProductCategory][number];

export const PRODUCT_CATEGORIES = Object.keys(PRODUCT_CATALOG) as ProductCategory[];

export const FISH_NAMES = Array.from(new Set(Object.values(PRODUCT_CATALOG).flat()));

export const getSubcategoriesForCategory = (category: string) =>
  (PRODUCT_CATALOG as Record<string, readonly string[]>)[category] ?? [];
