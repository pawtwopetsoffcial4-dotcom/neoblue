# High-Scaling Blog System Documentation

## Overview

This is a comprehensive, production-ready blog system built for the Neoblue platform with advanced features including:
- Multi-category and multi-tag support
- Comment system with moderation
- Analytics tracking
- SEO optimization
- Pagination and filtering
- Full-text search
- Responsive design

## Features

### Content Management
- **Blog Posts**: Create, edit, publish, and manage blog posts with rich content
- **Categories**: Organize blogs into categories with SEO metadata
- **Tags**: Apply multiple tags to blogs for better filtering and discoverability
- **Gallery**: Add multiple gallery images to blog posts
- **Draft/Publish**: Save as draft or publish immediately
- **Featured Posts**: Mark important posts as featured to highlight them

### Reader Features
- **Search**: Full-text search across blog titles, content, and metadata
- **Filtering**: Filter by category, tag, or search query
- **Pagination**: Efficient pagination with customizable page sizes
- **Sorting**: Sort by latest, oldest, most viewed, or trending
- **Comments**: Users can leave comments with ratings (moderation required)
- **View Tracking**: Track view counts for analytics
- **Related Posts**: Show related blogs on detail pages

### Admin Dashboard
- **Blog Management**: List, create, edit, delete blogs with preview
- **Category Management**: Manage blog categories with display order
- **Tag Management**: Create and manage tags with colors
- **Comment Moderation**: Approve/reject and manage user comments
- **Analytics**: View post views and engagement metrics

## Database Schema

### Blog Model
```typescript
{
  title: string (required, indexed)
  slug: string (required, unique, indexed)
  excerpt: string (required)
  content: string (required)
  coverImage: string (required)
  galleryImages: string[]
  keywords: string[] (indexed)
  author: string
  category: ObjectId (ref: BlogCategory)
  tags: ObjectId[] (ref: BlogTag, indexed)
  featured: boolean (indexed)
  isPublished: boolean (indexed)
  readTime: number
  views: number
  commentsCount: number
  seoTitle: string
  seoDescription: string
  seoImage: string
  metaJson: object
  createdAt: Date (indexed)
  updatedAt: Date
}
```

### BlogCategory Model
```typescript
{
  name: string (required, unique, indexed)
  slug: string (required, unique, indexed)
  description: string
  icon: string
  color: string
  blogsCount: number
  isActive: boolean (indexed)
  displayOrder: number
  seoTitle: string
  seoDescription: string
}
```

### BlogTag Model
```typescript
{
  name: string (required, unique, indexed)
  slug: string (required, unique, indexed)
  color: string
  blogsCount: number
  isActive: boolean (indexed)
  seoTitle: string
  seoDescription: string
}
```

### BlogComment Model
```typescript
{
  blogId: ObjectId (ref: Blog, indexed)
  author: string (required)
  email: string (required)
  content: string (required, 3-2000 chars)
  rating: number (1-5)
  isApproved: boolean (indexed)
  parentId: ObjectId (for nested replies)
  replies: ObjectId[]
  createdAt: Date
  updatedAt: Date
}
```

### BlogAnalytics Model
```typescript
{
  blogId: ObjectId (ref: Blog, indexed)
  date: Date (indexed)
  views: number
  uniqueViews: number
  avgTimeOnPage: number
  bounceRate: number
  comments: number
  shares: number
  likes: number
  referrers: [{ source, count }]
  devices: [{ device, count }]
}
```

## API Routes

### Blogs
- **GET** `/api/blogs` - Get paginated blogs with filtering and search
- **POST** `/api/blogs` - Create new blog (admin only)
- **GET** `/api/blogs/:id` - Get single blog by ID
- **PATCH** `/api/blogs/:id` - Update blog (admin only)
- **DELETE** `/api/blogs/:id` - Delete blog (admin only)

### Categories
- **GET** `/api/blogs/categories` - Get all categories
- **POST** `/api/blogs/categories` - Create category (admin only)
- **GET** `/api/blogs/categories/:id` - Get single category
- **PATCH** `/api/blogs/categories/:id` - Update category (admin only)
- **DELETE** `/api/blogs/categories/:id` - Delete category (admin only)

### Tags
- **GET** `/api/blogs/tags` - Get all tags
- **POST** `/api/blogs/tags` - Create tag (admin only)
- **GET** `/api/blogs/tags/:id` - Get single tag
- **PATCH** `/api/blogs/tags/:id` - Update tag (admin only)
- **DELETE** `/api/blogs/tags/:id` - Delete tag (admin only)

### Comments
- **GET** `/api/blogs/:id/comments` - Get approved comments for blog
- **POST** `/api/blogs/:id/comments` - Submit new comment
- **PATCH** `/api/blogs/:id/comments/:commentId` - Approve comment (admin only)
- **DELETE** `/api/blogs/:id/comments/:commentId` - Delete comment (admin only)

## Query Parameters

### /api/blogs
```
page=1                    # Pagination page (default: 1)
limit=12                  # Items per page (default: 12, max: 100)
category=tech             # Filter by category slug
tag=tutorial              # Filter by tag slug
search=aquarium           # Full-text search
sortBy=latest|views|oldest|trending  # Sort order
published=true|false      # Filter by publication status (admin only)
featured=true             # Show only featured blogs
```

### /api/blogs/:id/comments
```
page=1                    # Pagination page (default: 1)
limit=10                  # Items per page (default: 10, max: 50)
```

## Frontend Components

### useBlog Hook
```typescript
useBlogs(options: {
  page?: number
  limit?: number
  category?: string
  tag?: string
  search?: string
  sortBy?: 'latest' | 'views' | 'oldest' | 'trending'
})

useCategories() // Get all active categories

useTags()       // Get all active tags
```

### BlogCard Component
Displays a blog post card with image, title, excerpt, author, and meta info.

### BlogFilters Component
Provides search, category filter, tag filter, and sort options.

### BlogComments Component
Handles displaying comments, comment submission form, and moderation.

## File Structure

```
app/
├── blog/
│   ├── page.tsx                    # Blog listing page
│   └── [slug]/
│       └── page.tsx                # Blog detail page
│
├── admin/
│   └── blogs/
│       ├── page.tsx                # Blog management list
│       ├── categories/
│       │   └── page.tsx            # Category management
│       ├── tags/
│       │   └── page.tsx            # Tag management
│       └── comments/
│           └── page.tsx            # Comment moderation
│
├── api/blogs/
│   ├── route.ts                    # List & create blogs
│   ├── [id]/
│   │   ├── route.ts                # Get, update, delete blog
│   │   └── comments/
│   │       ├── route.ts            # Get & create comments
│   │       └── [commentId]/
│   │           └── route.ts        # Approve & delete comments
│   │
│   ├── categories/
│   │   ├── route.ts                # List & create categories
│   │   └── [id]/
│   │       └── route.ts            # Get, update, delete category
│   │
│   └── tags/
│       ├── route.ts                # List & create tags
│       └── [id]/
│           └── route.ts            # Get, update, delete tag
│
├── components/
│   ├── BlogCard.tsx                # Blog post card component
│   ├── BlogFilters.tsx             # Filter sidebar component
│   └── BlogComments.tsx            # Comments component
│
└── lib/
    ├── hooks/
    │   └── useBlog.tsx             # Blog-related hooks
    └── models/
        ├── Blog.ts                 # Blog schema
        ├── BlogCategory.ts         # Category schema
        ├── BlogTag.ts              # Tag schema
        ├── BlogComment.ts          # Comment schema
        └── BlogAnalytics.ts        # Analytics schema
```

## Usage Examples

### Creating a Blog Post (Admin)
```typescript
const response = await fetch('/api/blogs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'How to Setup a Fish Tank',
    excerpt: 'A beginner\'s guide to setting up your first aquarium',
    content: 'Full blog content...',
    coverImage: 'https://...',
    category: 'categoryId',
    tags: ['tagId1', 'tagId2'],
    keywords: ['setup', 'beginner', 'aquarium'],
    author: 'John Doe',
    featured: true,
    isPublished: true,
    readTime: 5,
    seoTitle: 'Best Guide to Setup Fish Tank',
    seoDescription: 'Learn how to properly setup your aquarium'
  })
});
```

### Fetching Blogs with Filters
```typescript
const params = new URLSearchParams({
  page: '1',
  limit: '12',
  category: 'care-guides',
  sortBy: 'latest',
  search: 'tetra'
});

const response = await fetch(`/api/blogs?${params}`);
const data = await response.json();
// data.data.blogs - array of blogs
// data.data.pagination - pagination info
```

### Submitting a Comment
```typescript
const response = await fetch('/api/blogs/postId/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    author: 'Jane Doe',
    email: 'jane@example.com',
    content: 'Great article! Very helpful.',
    rating: 5
  })
});
```

## Performance Optimizations

### Database Indexing
- Compound indexes for common queries
- Text indexes for full-text search
- Field indexing for filtering

### Pagination
- Default 12 items per page for blog listings
- Configurable page size with max limit of 100
- Efficient skip/limit queries

### Caching Strategy
- Blog detail pages can be cached with revalidation
- Category and tag lists are relatively static
- View counts update without cache invalidation

### Image Optimization
- Use Next.js Image component for responsive images
- Cloudinary integration for image hosting
- Multiple image sizes for different devices

## SEO Features

- **Dynamic Meta Tags**: Each blog has SEO-optimized title and description
- **Structured Data**: Schema.org markup for blog posts
- **URL Slugs**: Clean, keyword-optimized URLs
- **Sitemaps**: XML sitemaps for search engine crawling
- **Canonical URLs**: Prevent duplicate content issues
- **Open Graph Tags**: Social media sharing optimization

## Future Enhancements

- [ ] Email notifications for new comments
- [ ] Comment threading/nested replies
- [ ] Blog social sharing buttons
- [ ] Email subscription to blog updates
- [ ] Advanced analytics dashboard
- [ ] Scheduled post publishing
- [ ] Blog post versioning/history
- [ ] Comment spam detection (Akismet integration)
- [ ] Multi-language support
- [ ] Blog recommendation engine
- [ ] Reading list/bookmarking
- [ ] Guest contributor management

## Troubleshooting

### Comments not appearing
- Check if moderation is enabled (isApproved must be true)
- Verify admin approval of comments
- Check database connectivity

### Search not working
- Ensure text indexes are created on blog schema
- Try reindexing the collection
- Check search query syntax

### Images not loading
- Verify Cloudinary integration
- Check image URLs are accessible
- Ensure CORS is configured

### Performance issues
- Check database indexes are created
- Verify pagination limits are reasonable
- Consider caching strategies for high-traffic posts

## Support

For issues or questions about the blog system, please refer to the API documentation or create an issue in the repository.
