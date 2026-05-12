# Blog System Quick Start Guide

## Installation & Setup

### 1. Database Models
The blog system comes with 5 MongoDB models automatically registered in `lib/db.ts`:
- `Blog` - Main blog post content
- `BlogCategory` - Blog categories with styling
- `BlogTag` - Blog tags for filtering
- `BlogComment` - User comments with moderation
- `BlogAnalytics` - Analytics tracking (ready for future use)

### 2. Create Your First Blog Post

#### Via API (Recommended for bulk operations)
```bash
curl -X POST http://localhost:3000/api/blogs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Getting Started with Aquariums",
    "excerpt": "A complete beginner guide",
    "content": "Your full blog content here...",
    "coverImage": "https://your-image-url.jpg",
    "author": "Neoblue Team",
    "keywords": ["aquarium", "beginner", "setup"],
    "featured": true,
    "isPublished": true,
    "readTime": 5
  }'
```

#### Via Admin Dashboard
1. Navigate to `/admin/blogs`
2. Click "Create Blog"
3. Fill in the form with your content
4. Upload cover image via Cloudinary
5. Click "Create"

### 3. Manage Categories

#### Add a Category
1. Go to `/admin/blogs/categories`
2. Click "Add Category"
3. Fill in details:
   - **Name**: "Care Guides"
   - **Description**: "Detailed guides for fish and aquarium care"
   - **Color**: Pick a color for UI display
   - **Icon**: Add an emoji or icon URL
   - **Display Order**: Number for ordering
4. Click "Create Category"

### 4. Manage Tags

#### Add Tags
1. Go to `/admin/blogs/tags`
2. Click "Add Tag"
3. Enter tag name and color
4. Optionally add SEO metadata
5. Click "Create Tag"

### 5. Moderate Comments

#### Review & Approve Comments
1. Navigate to `/admin/blogs/comments`
2. Filter by "Pending" to see unapproved comments
3. Click "Approve" to make comments visible
4. Click "Delete" to remove inappropriate comments

## Frontend Integration

### Using the Blog Page Component

The `/blog` page is fully functional with filtering and search:

```typescript
// Features available:
- Full-text search across all blog content
- Filter by category
- Filter by tag
- Sort by: Latest, Oldest, Most Viewed, Trending
- Pagination with 12 items per page
```

### Using Custom Components

```typescript
import { useBlogs, useCategories, useTags } from '@/lib/hooks/useBlog';
import BlogCard from '@/app/components/BlogCard';

export default function MyBlogList() {
  const { blogs, pagination, loading } = useBlogs({
    category: 'tech',
    limit: 8,
    sortBy: 'latest'
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {blogs.map(blog => <BlogCard key={blog._id} blog={blog} />)}
    </div>
  );
}
```

## Common Tasks

### Change Blog Post Status
```bash
curl -X PATCH http://localhost:3000/api/blogs/POST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"isPublished": false}'
```

### Featured Posts
```bash
# Make a post featured
curl -X PATCH http://localhost:3000/api/blogs/POST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"featured": true}'
```

### Update Blog Content
```bash
curl -X PATCH http://localhost:3000/api/blogs/POST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content...",
    "excerpt": "Updated excerpt"
  }'
```

## Customization

### Change Pagination Limit
In `/blog/page.tsx`, modify the limit:
```typescript
const { blogs, pagination, loading } = useBlogs({
  page,
  limit: 20,  // Change this number
  // ...
});
```

### Customize Blog Card Styling
Edit `/app/components/BlogCard.tsx` to change:
- Card layout
- Image sizes
- Text styling
- Hover effects

### Add Custom Fields
To add custom fields to blog posts:

1. Update the `IBlog` interface in `lib/models/Blog.ts`
2. Add the field to the schema
3. Update the API routes to handle the new field
4. Update frontend components as needed

Example: Add a "difficulty" field
```typescript
// In Blog.ts
export interface IBlog extends Document {
  // ... existing fields
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// In schema:
const blogSchema = new Schema<IBlog>({
  // ... existing fields
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  }
});
```

## Performance Tips

1. **Optimize Images**: Compress blog cover images before uploading
2. **Use Categories**: Organize blogs into categories for better UX
3. **Monitor Views**: Check `/api/blogs` to see view counts
4. **Manage Comments**: Regularly moderate comments to prevent spam
5. **Archive Old Posts**: Update isPublished to false for outdated content

## SEO Best Practices

1. **Write Good Titles**: Use keywords naturally (50-60 characters)
2. **Meta Descriptions**: Write compelling descriptions (150-160 characters)
3. **Keywords**: Add 3-5 relevant keywords per post
4. **Slug Format**: Use hyphens, lowercase, keep URLs short
5. **Images**: Include alt text for accessibility
6. **Internal Links**: Link related blog posts

## API Response Examples

### Get Blogs
```json
{
  "success": true,
  "data": {
    "blogs": [
      {
        "_id": "123...",
        "title": "Blog Title",
        "slug": "blog-title",
        "excerpt": "...",
        "coverImage": "...",
        "author": "Author Name",
        "category": {
          "_id": "cat123",
          "name": "Category Name",
          "slug": "category"
        },
        "tags": [
          {
            "_id": "tag123",
            "name": "Tag Name",
            "color": "#3B82F6"
          }
        ],
        "featured": true,
        "readTime": 5,
        "views": 123,
        "createdAt": "2024-05-11T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 45,
      "pages": 4,
      "hasMore": true
    }
  }
}
```

## Troubleshooting

### Blogs not showing
- Check `isPublished` is `true`
- Verify database connection
- Check admin token is valid

### Images not uploading
- Ensure Cloudinary is configured
- Check file size limits
- Verify CORS settings

### Comments not appearing
- Ensure comments are approved
- Check `isApproved` is `true`
- Verify blog ID is correct

### Search not working
- Check search index is created
- Verify text fields are indexed
- Try re-indexing collection

## Next Steps

1. ✅ Set up MongoDB models (already done)
2. ✅ Configure API routes (already done)
3. ✅ Create first blog post
4. ✅ Add categories and tags
5. ✅ Test blog listing and filtering
6. ✅ Set up comment moderation
7. 📝 Write SEO-friendly descriptions
8. 📊 Monitor analytics and engagement
9. 🔄 Plan content calendar
10. 📢 Share on social media

## Additional Resources

- [Full Blog System Documentation](./BLOG_SYSTEM.md)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Cloudinary File Upload](https://cloudinary.com)

## Support

For questions or issues:
1. Check the BLOG_SYSTEM.md documentation
2. Review the API route files
3. Check browser console for errors
4. Verify database connection
5. Check authentication token validity
