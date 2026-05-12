"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, BookOpen } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { apiClient } from '@/lib/api-client';

type AdminBlog = {
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

type BlogFormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  galleryImages: string[];
  keywords: string;
  author: string;
  featured: boolean;
  isPublished: boolean;
  readTime: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingBlog, setEditingBlog] = useState<AdminBlog | null>(null);
  const [editForm, setEditForm] = useState<BlogFormState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [createForm, setCreateForm] = useState<BlogFormState>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    galleryImages: [],
    keywords: '',
    author: 'Neoblue Team',
    featured: false,
    isPublished: true,
    readTime: '5',
  });
  const [isCreating, setIsCreating] = useState(false);

  const loadBlogs = async () => {
    try {
      setIsLoading(true);
      const response = (await apiClient.getBlogs({ limit: 100 })) as { blogs: AdminBlog[] };
      setBlogs(response.blogs ?? []);
    } catch {
      setBlogs([]);
      setMessage('Failed to load blogs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const featuredCount = useMemo(() => blogs.filter((blog) => blog.featured).length, [blogs]);
  const publishedCount = useMemo(() => blogs.filter((blog) => blog.isPublished).length, [blogs]);

  const handleCreate = async () => {
    try {
      setMessage(null);
      setIsCreating(true);

      await apiClient.createBlog({
        ...createForm,
        slug: createForm.slug || slugify(createForm.title),
        keywords: createForm.keywords,
        galleryImages: createForm.galleryImages,
        readTime: Number(createForm.readTime),
      });

      setCreateForm({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        coverImage: '',
        galleryImages: [],
        keywords: '',
        author: 'Neoblue Team',
        featured: false,
        isPublished: true,
        readTime: '5',
      });
      await loadBlogs();
      setMessage('Blog created successfully');
    } catch (error: any) {
      setMessage(error.message || 'Failed to create blog');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditBlog = (blog: AdminBlog) => {
    setEditingBlog(blog);
    setEditForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage,
      galleryImages: [...(blog.galleryImages ?? [])],
      keywords: (blog.keywords ?? []).join(', '),
      author: blog.author,
      featured: blog.featured,
      isPublished: blog.isPublished,
      readTime: String(blog.readTime ?? 5),
    });
  };

  const closeEditBlog = () => {
    setEditingBlog(null);
    setEditForm(null);
    setIsSavingEdit(false);
  };

  const saveEditedBlog = async () => {
    if (!editingBlog || !editForm) return;

    try {
      setMessage(null);
      setIsSavingEdit(true);
      await apiClient.updateBlog(editingBlog._id, {
        ...editForm,
        slug: editForm.slug || slugify(editForm.title),
        keywords: editForm.keywords,
        galleryImages: editForm.galleryImages,
        readTime: Number(editForm.readTime),
      });
      await loadBlogs();
      setMessage('Blog updated successfully');
      closeEditBlog();
    } catch (error: any) {
      setMessage(error.message || 'Failed to update blog');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteBlog = async (blogId: string) => {
    const confirmed = window.confirm('Delete this blog post?');
    if (!confirmed) return;

    try {
      setMessage(null);
      await apiClient.deleteBlog(blogId);
      setBlogs((current) => current.filter((blog) => blog._id !== blogId));
      setMessage('Blog deleted successfully');
    } catch (error: any) {
      setMessage(error.message || 'Failed to delete blog');
    }
  };

  const addEditGalleryImage = (imageUrl: string) => {
    setEditForm((current) => {
      if (!current || current.galleryImages.includes(imageUrl)) return current;
      return { ...current, galleryImages: [...current.galleryImages, imageUrl] };
    });
  };

  const removeEditGalleryImage = (imageUrl: string) => {
    setEditForm((current) => {
      if (!current) return current;
      return { ...current, galleryImages: current.galleryImages.filter((image) => image !== imageUrl) };
    });
  };

  const addCreateGalleryImage = (imageUrl: string) => {
    setCreateForm((current) => {
      if (current.galleryImages.includes(imageUrl)) return current;
      return { ...current, galleryImages: [...current.galleryImages, imageUrl] };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Content</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Blogs</h1>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Total Blogs</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{blogs.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Published</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{publishedCount}</p>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Featured</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{featuredCount}</p>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700">
          {message}
        </div>
      )}

      <section className="rounded-3xl bg-white border border-blue-100 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-black tracking-tight">Add Blog</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <input className="h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Title" value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} />
          <input className="h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Slug" value={createForm.slug} onChange={(event) => setCreateForm((current) => ({ ...current, slug: event.target.value }))} />
          <input className="h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Author" value={createForm.author} onChange={(event) => setCreateForm((current) => ({ ...current, author: event.target.value }))} />
          <input className="h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Read time (minutes)" type="number" min={1} value={createForm.readTime} onChange={(event) => setCreateForm((current) => ({ ...current, readTime: event.target.value }))} />
          <input className="md:col-span-2 h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Excerpt" value={createForm.excerpt} onChange={(event) => setCreateForm((current) => ({ ...current, excerpt: event.target.value }))} />
          <textarea className="md:col-span-2 min-h-40 text-base px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Content" value={createForm.content} onChange={(event) => setCreateForm((current) => ({ ...current, content: event.target.value }))} />
          <input className="md:col-span-2 h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Keywords, separated by commas" value={createForm.keywords} onChange={(event) => setCreateForm((current) => ({ ...current, keywords: event.target.value }))} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="text-sm font-semibold text-slate-700">Cover Image</p>
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'}
              options={{ sources: ['local', 'camera', 'url'], multiple: false, resourceType: 'image' }}
              onSuccess={(result: any) => {
                const secureUrl = result?.info?.secure_url;
                if (secureUrl) {
                  setCreateForm((current) => ({ ...current, coverImage: String(secureUrl) }));
                }
              }}
            >
              {({ open }) => (
                <button type="button" onClick={() => open()} className="h-11 w-full sm:w-auto px-4 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50">
                  Upload Cover
                </button>
              )}
            </CldUploadWidget>
            {createForm.coverImage && <img src={createForm.coverImage} alt="Cover preview" className="w-full h-48 object-cover rounded-2xl border border-blue-100" />}
          </div>

          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="text-sm font-semibold text-slate-700">Gallery Images</p>
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'}
              options={{ sources: ['local', 'camera', 'url'], multiple: false, resourceType: 'image' }}
              onSuccess={(result: any) => {
                const secureUrl = result?.info?.secure_url;
                if (secureUrl) {
                  addCreateGalleryImage(String(secureUrl));
                }
              }}
            >
              {({ open }) => (
                <button type="button" onClick={() => open()} className="h-11 w-full sm:w-auto px-4 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 inline-flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Add Gallery Image
                </button>
              )}
            </CldUploadWidget>
            <div className="grid grid-cols-2 gap-3">
              {createForm.galleryImages.map((image) => (
                <img key={image} src={image} alt="Gallery preview" className="w-full h-28 object-cover rounded-xl border border-blue-100" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={createForm.featured} onChange={(event) => setCreateForm((current) => ({ ...current, featured: event.target.checked }))} className="h-4 w-4 accent-blue-500" />
            Featured
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={createForm.isPublished} onChange={(event) => setCreateForm((current) => ({ ...current, isPublished: event.target.checked }))} className="h-4 w-4 accent-blue-500" />
            Published
          </label>
          <button disabled={isCreating} onClick={handleCreate} className="h-11 w-full sm:w-auto px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
            {isCreating ? 'Saving...' : 'Create Blog'}
          </button>
        </div>
      </section>

      <div className="space-y-3">
        {isLoading && <div className="rounded-2xl bg-white border border-blue-100 p-8 text-center text-slate-600">Loading blogs...</div>}

        {!isLoading && blogs.map((blog) => (
          <article key={blog._id} className="rounded-2xl bg-white border border-blue-100 p-5 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {blog.featured && <span className="text-xs font-bold uppercase tracking-wider rounded-full bg-blue-600 text-white px-3 py-1">Featured</span>}
                  <span className="text-xs font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 px-3 py-1">{blog.isPublished ? 'Published' : 'Draft'}</span>
                </div>
                <p className="font-bold text-slate-900 text-lg">{blog.title}</p>
                <p className="text-sm text-slate-600 mt-1">{blog.excerpt}</p>
                <p className="text-xs text-slate-500 mt-2">/{blog.slug} • {blog.author} • {blog.readTime} min read</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(blog.keywords ?? []).map((keyword) => <span key={keyword} className="text-xs rounded-full bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1">{keyword}</span>)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => openEditBlog(blog)} className="h-9 px-4 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50">Edit</button>
                <button onClick={() => deleteBlog(blog._id)} className="h-9 px-4 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100">Delete</button>
              </div>
            </div>
            <img src={blog.coverImage} alt={blog.title} className="w-full max-h-72 object-cover rounded-2xl border border-blue-100" />
          </article>
        ))}

        {!isLoading && blogs.length === 0 && <div className="rounded-2xl bg-white border border-blue-100 p-8 text-center text-slate-600">No blogs found.</div>}
      </div>

      {editingBlog && editForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 px-0 sm:px-4 py-0 sm:py-6">
          <div className="w-full sm:max-w-4xl max-h-[94vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-blue-100">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white px-4 sm:px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Edit Blog</p>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight line-clamp-1">{editingBlog.title}</h2>
              </div>
              <button type="button" onClick={closeEditBlog} className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <input className="h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" value={editForm.title} onChange={(event) => setEditForm((current) => current ? { ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) } : current)} placeholder="Title" />
                <input className="h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" value={editForm.slug} onChange={(event) => setEditForm((current) => current ? { ...current, slug: event.target.value } : current)} placeholder="Slug" />
                <input className="h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" value={editForm.author} onChange={(event) => setEditForm((current) => current ? { ...current, author: event.target.value } : current)} placeholder="Author" />
                <input className="h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" type="number" min={1} value={editForm.readTime} onChange={(event) => setEditForm((current) => current ? { ...current, readTime: event.target.value } : current)} placeholder="Read time" />
                <input className="md:col-span-2 h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" value={editForm.excerpt} onChange={(event) => setEditForm((current) => current ? { ...current, excerpt: event.target.value } : current)} placeholder="Excerpt" />
                <textarea className="md:col-span-2 min-h-40 text-base px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" value={editForm.content} onChange={(event) => setEditForm((current) => current ? { ...current, content: event.target.value } : current)} placeholder="Content" />
                <input className="md:col-span-2 h-12 text-base px-4 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" value={editForm.keywords} onChange={(event) => setEditForm((current) => current ? { ...current, keywords: event.target.value } : current)} placeholder="Keywords, separated by commas" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                  <p className="text-sm font-semibold text-slate-700">Cover Image</p>
                  <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'} options={{ sources: ['local', 'camera', 'url'], multiple: false, resourceType: 'image' }} onSuccess={(result: any) => {
                    const secureUrl = result?.info?.secure_url;
                    if (secureUrl) {
                      setEditForm((current) => current ? { ...current, coverImage: String(secureUrl) } : current);
                    }
                  }}>
                    {({ open }) => <button type="button" onClick={() => open()} className="h-11 w-full sm:w-auto px-4 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50">Replace Cover</button>}
                  </CldUploadWidget>
                  <img src={editForm.coverImage} alt="Cover preview" className="w-full h-48 object-cover rounded-2xl border border-blue-100" />
                </div>

                <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                  <p className="text-sm font-semibold text-slate-700">Gallery Images</p>
                  <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'neoblue_products'} options={{ sources: ['local', 'camera', 'url'], multiple: false, resourceType: 'image' }} onSuccess={(result: any) => {
                    const secureUrl = result?.info?.secure_url;
                    if (secureUrl) {
                      addEditGalleryImage(String(secureUrl));
                    }
                  }}>
                    {({ open }) => <button type="button" onClick={() => open()} className="h-11 w-full sm:w-auto px-4 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 inline-flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> Add Gallery Image</button>}
                  </CldUploadWidget>
                  <div className="grid grid-cols-2 gap-3">
                    {editForm.galleryImages.map((image) => (
                      <div key={image} className="relative rounded-xl overflow-hidden border border-blue-100">
                        <img src={image} alt="Gallery preview" className="w-full h-28 object-cover" />
                        <button type="button" onClick={() => removeEditGalleryImage(image)} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-950/80 text-white flex items-center justify-center"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={editForm.featured} onChange={(event) => setEditForm((current) => current ? { ...current, featured: event.target.checked } : current)} className="h-4 w-4 accent-blue-500" /> Featured</label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={editForm.isPublished} onChange={(event) => setEditForm((current) => current ? { ...current, isPublished: event.target.checked } : current)} className="h-4 w-4 accent-blue-500" /> Published</label>
                <button type="button" onClick={saveEditedBlog} disabled={isSavingEdit} className="h-11 w-full sm:w-auto px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">{isSavingEdit ? 'Saving...' : 'Save Blog'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}