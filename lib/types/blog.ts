export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  galleryImages: string[];
  keywords: string[];
  author: string;
  featured: boolean;
  isPublished: boolean;
  readTime: number;
  createdAt?: string;
  updatedAt?: string;
};