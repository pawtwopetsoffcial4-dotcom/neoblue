import React from 'react';
import Link from 'next/link';
import { Heart, Share2, Info } from 'lucide-react';
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
    const productUrl = `https://neoblue.in/products/${product._id}`;
    const truncatedDesc = product.description 
      ? product.description.replace(/(\r\n|\n|\r)/gm, " ").slice(0, 155) + "..." 
      : 'Quarantine-tested premium aquatic specimen on NeoBlue.';
      
    return {
      title: `${product.title} - Care Requirements & Specs | NeoBlue`,
      description: truncatedDesc,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: `${product.title} - Care Requirements & Specs | NeoBlue`,
        description: truncatedDesc,
        url: productUrl,
        images: product.images?.[0] ? [{ url: product.images[0] }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.title} - Care Requirements & Specs | NeoBlue`,
        description: truncatedDesc,
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

  // Define JSON-LD structured schemas for SEO crawler bots
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.images || [],
    "description": product.description,
    "sku": `NEO-${product._id.slice(-6).toUpperCase()}`,
    "offers": {
      "@type": "Offer",
      "url": `https://neoblue.in/products/${product._id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": product.vendorId?.name || "NeoBlue Seller"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || 5,
      "reviewCount": reviews.length || 1
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://neoblue.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shop",
        "item": "https://neoblue.in/products"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.category,
        "item": `https://neoblue.in/products?category=${product.category}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.title,
        "item": `https://neoblue.in/products/${product._id}`
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How should I acclimate this fish after delivery?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Float the bag for 20 to 30 minutes to equalize temperature, then drip acclimate gradually before introducing into your tank."
        }
      },
      {
        "@type": "Question",
        "name": "What tank conditions are recommended?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Maintain stable ${product.waterType.toLowerCase()} parameters, avoid sudden pH/temperature shifts, and provide proper filtration and oxygenation.`
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 selection:bg-blue-100 pb-24 md:pb-12">
      {/* Dynamic JSON-LD structured data scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Navigation / Breadcrumb */}
      <nav className="sticky top-0 z-40 bg-[#F5F7FA]/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <svg className="h-3 w-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            
            <Link href="/products" className="hover:text-blue-600 transition-colors">Shop</Link>
            <svg className="h-3 w-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            
            <Link href={`/products?category=${product.category}`} className="hover:text-blue-600 transition-colors">{product.category}</Link>
            <svg className="h-3 w-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            
            <span className="text-slate-900 font-extrabold truncate max-w-[100px] sm:max-w-[200px]">{product.title}</span>
          </div>

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
