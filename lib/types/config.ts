export interface IHeroSlide {
  id?: string;
  badge?: string;
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  bgImage?: string;
  mode?: 'all' | 'fishes' | 'plants';
}

export const DEFAULT_HERO_SLIDES: IHeroSlide[] = [
  {
    id: 'slide-1',
    badge: 'Limited Time Offer',
    title: 'Save Up to 35% on Premium Live Stock',
    description: 'Handpicked freshwater & marine species with overnight transit care and 100% live arrival guarantee.',
    buttonText: 'Shop All Livestock',
    buttonLink: '/products',
    bgImage: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1600&q=80',
    mode: 'all',
  },
  {
    id: 'slide-2',
    badge: 'Curated Breeders',
    title: 'Exotic Bettas, Guppies & Discus Pairs',
    description: 'Explore champion bloodlines directly from certified breeders across India.',
    buttonText: 'Explore Fishes',
    buttonLink: '/products',
    bgImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
    mode: 'fishes',
  },
  {
    id: 'slide-3',
    badge: '100% Snail-Free',
    title: 'Lush Aquatic Plants & Aquascapes',
    description: 'Transform your tank with vibrant carpeting flora, anubias, and easy-care mosses.',
    buttonText: 'Browse Plants',
    buttonLink: '/categories/plants',
    bgImage: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=1600&q=80',
    mode: 'plants',
  },
];
