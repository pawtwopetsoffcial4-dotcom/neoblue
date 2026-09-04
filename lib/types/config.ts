export interface IHeroButton {
  id?: string;
  text: string;
  link: string;
  variant?: 'primary' | 'secondary' | 'glass';
}

export interface IHeroSlide {
  id?: string;
  badge?: string;
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  buttons?: IHeroButton[];
  bgImage?: string;
  mode?: 'all' | 'fishes' | 'plants';
}

export const DEFAULT_MARQUEE_TEXT = 'Next shipping on Monday! Order fast for fastest delivery.';

export const DEFAULT_FISHES_HERO_SLIDES: IHeroSlide[] = [
  {
    id: 'fish-slide-1',
    badge: 'Limited Time Offer',
    title: 'Save Up to 35% on Premium Live Stock',
    description: 'Handpicked freshwater & marine species with overnight transit care and 100% live arrival guarantee.',
    buttonText: 'Shop All Fish',
    buttonLink: '/products',
    buttons: [
      { id: 'btn-1', text: 'Shop All Fish', link: '/products', variant: 'primary' },
      { id: 'btn-2', text: 'View Combos', link: '/combos', variant: 'glass' },
    ],
    bgImage: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1600&q=80',
    mode: 'fishes',
  },
  {
    id: 'fish-slide-2',
    badge: 'Curated Breeders',
    title: 'Exotic Bettas, Guppies & Discus Pairs',
    description: 'Explore champion bloodlines directly from certified breeders across India.',
    buttonText: 'Explore Fishes',
    buttonLink: '/products',
    buttons: [
      { id: 'btn-1', text: 'Explore Fishes', link: '/products', variant: 'primary' },
      { id: 'btn-2', text: 'Breeder Specials', link: '/products?tag=Breeder', variant: 'secondary' },
    ],
    bgImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
    mode: 'fishes',
  },
  {
    id: 'fish-slide-3',
    badge: 'Safe Transit',
    title: 'Priority Dispatch & Live Arrival Guarantee',
    description: 'Oxygenated insulated packaging tested for secure multi-day climate-safe journeys.',
    buttonText: 'Browse Catalog',
    buttonLink: '/products',
    buttons: [
      { id: 'btn-1', text: 'Browse Catalog', link: '/products', variant: 'primary' },
    ],
    bgImage: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=1600&q=80',
    mode: 'fishes',
  },
];

export const DEFAULT_PLANTS_HERO_SLIDES: IHeroSlide[] = [
  {
    id: 'plant-slide-1',
    badge: '100% Snail-Free',
    title: 'Lush Aquatic Plants & Aquascapes',
    description: 'Transform your tank with vibrant carpeting flora, anubias, and easy-care mosses with zero snails.',
    buttonText: 'Browse All Plants',
    buttonLink: '/categories/plants',
    buttons: [
      { id: 'btn-1', text: 'Browse All Plants', link: '/categories/plants', variant: 'primary' },
      { id: 'btn-2', text: 'Low Light Flora', link: '/products?category=Plants', variant: 'glass' },
    ],
    bgImage: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=1600&q=80',
    mode: 'plants',
  },
  {
    id: 'plant-slide-2',
    badge: 'Aquascaper Choice',
    title: 'Carpeting Plants & Driftwood Epiphytes',
    description: 'Hardy Monte Carlo, Dwarf Hairgrass, and Anubias Nana Petite grown in premium nursery conditions.',
    buttonText: 'Explore Carpets',
    buttonLink: '/categories/plants',
    buttons: [
      { id: 'btn-1', text: 'Explore Carpets', link: '/categories/plants', variant: 'primary' },
      { id: 'btn-2', text: 'Moss & Epiphytes', link: '/categories/plants', variant: 'secondary' },
    ],
    bgImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    mode: 'plants',
  },
  {
    id: 'plant-slide-3',
    badge: 'Fresh Delivery',
    title: 'Easy Low-Tech & No-CO2 Starter Packs',
    description: 'Perfect hardy plants that thrive in standard tap water and basic aquarium lighting setups.',
    buttonText: 'Shop Starter Plants',
    buttonLink: '/categories/plants',
    buttons: [
      { id: 'btn-1', text: 'Shop Starter Plants', link: '/categories/plants', variant: 'primary' },
    ],
    bgImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1600&q=80',
    mode: 'plants',
  },
];

export const DEFAULT_HERO_SLIDES: IHeroSlide[] = [
  ...DEFAULT_FISHES_HERO_SLIDES,
  ...DEFAULT_PLANTS_HERO_SLIDES,
];
