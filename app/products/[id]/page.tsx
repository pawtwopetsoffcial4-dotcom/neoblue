import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Share2, Info } from 'lucide-react';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';
import type { Metadata } from 'next';
import ProductClientPage from './ProductClientPage';

type ProductDetailProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return {};
  try {
    await connectDB();
    const product = await Product.findById(id).lean() as any;
    if (!product) return {};
    return {
      title: `${product.title} - Care Requirements & Specs | NeoBlue`,
      description: product.description || 'Quarantine-tested premium aquatic specimen on NeoBlue.',
      openGraph: {
        title: product.title,
        description: product.description,
        images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.title,
        description: product.description,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Info className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Oops! Product not found</h2>
             <p className="text-slate-500 mb-6">Invalid product identifier format.</p>
             <Link href="/products" className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors w-full">
               Return to Shop
             </Link>
         </div>
      </div>
    );
  }

  let product: any = null;
  let reviews: any[] = [];
  let recommendations: any[] = [];
  let allProducts: any[] = [];

  try {
    await connectDB();

    // 1. Fetch Product
    const dbProduct = await Product.findById(id).populate('vendorId', 'name email logo slug').lean();
    if (!dbProduct) {
      throw new Error('Product not found');
    }
    
    // Normalize ObjectID fields to string to avoid serialization warnings
    product = JSON.parse(JSON.stringify(dbProduct));

    // 2. Fetch Reviews from MongoDB
    const dbReviews = await Review.find({ productId: id }).sort({ createdAt: -1 }).lean();
    reviews = JSON.parse(JSON.stringify(dbReviews));

    // 3. Fetch Recommendations (same category first)
    const dbRecommendations = await Product.find({ 
      _id: { $ne: id },
      approvalStatus: 'approved',
      inStock: true
    }).populate('vendorId', 'name email logo slug').limit(4).lean();
    
    // Sort recommendations to prioritize same category
    const list = JSON.parse(JSON.stringify(dbRecommendations)) as any[];
    list.sort((a, b) => {
      if (a.category === product.category && b.category !== product.category) return -1;
      if (a.category !== product.category && b.category === product.category) return 1;
      return 0;
    });
    recommendations = list;

    // 4. Fetch All Products (compact fields only for compatibility checker species search)
    const dbAllProducts = await Product.find({ approvalStatus: 'approved', inStock: true }).select('title scientific category temperament').lean();
    allProducts = JSON.parse(JSON.stringify(dbAllProducts));

  } catch (err: any) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Info className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Oops! Product not found</h2>
             <p className="text-slate-500 mb-6">{err.message || "We couldn't find the product you're looking for."}</p>
             <Link href="/products" className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors w-full">
               Return to Shop
             </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 selection:bg-blue-100 pb-24 md:pb-12">
      {/* Navigation / Breadcrumb */}
      <nav className="sticky top-0 z-40 bg-[#F5F7FA]/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/products" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          <div className="flex items-center gap-3">
             <button className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">
                <Heart className="h-4 w-4" />
             </button>
             <button className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                <Share2 className="h-4 w-4" />
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductClientPage 
          productId={id}
          initialProduct={product}
          initialReviews={reviews}
          initialRecommendations={recommendations}
          allProducts={allProducts}
        />
      </main>
    </div>
  );
}
