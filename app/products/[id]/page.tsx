import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Heart, Info } from 'lucide-react';
import ShareButton from '@/app/components/ShareButton';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';
import type { Metadata } from 'next';
import { getBestProductOgImage } from '@/lib/utils/seo';
import ProductClientPage from './ProductClientPage';

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type ProductDetailProps = {
  params: Promise<{ id: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    await connectDB();
    const products = await Product.find({ approvalStatus: 'approved' })
      .select('_id')
      .lean();
    return products.map((p: any) => ({ id: p._id.toString() }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return {};
  try {
    await connectDB();
    const product = await Product.findById(id).lean() as any;
    if (!product) return {};
    const productUrl = `https://neoblue.in/products/${product._id}`;
    
    // Highly optimized title for transaction and species queries (e.g., "Buy Guppy Fish Online")
    const titleText = `${product.title} ${product.scientific ? `(${product.scientific})` : ''} - Buy Online | NeoBlue Fishes`;
    
    // Dynamic meta description containing key parameters to hook user and crawler attention
    let truncatedDesc = '';
    if (product.quickOverview) {
      truncatedDesc = product.quickOverview.replace(/(\r\n|\n|\r)/gm, " ").slice(0, 155) + "...";
    } else {
      const priceText = product.price ? `₹${product.price}` : '';
      const tempText = product.tempMin && product.tempMax ? `${product.tempMin}-${product.tempMax}°C` : '';
      const descPrefix = `Buy ${product.title} ${product.scientific ? `(${product.scientific})` : ''} online from NeoBlue. `;
      const descBody = `Premium quality ${product.waterType.toLowerCase()} specimen at best price (${priceText}). Temp: ${tempText}. View care specifications and order live delivery.`;
      truncatedDesc = (descPrefix + descBody).replace(/(\r\n|\n|\r)/gm, " ").slice(0, 155) + "...";
    }
      
    return {
      title: titleText,
      description: truncatedDesc,
      keywords: [
        product.title,
        `${product.title}s`,
        product.scientific,
        product.category,
        product.subcategory,
        product.waterType,
        'neoblue',
        'neoblue fishes',
        'buy fish online',
        'aquarium fish price',
        'live fish delivery',
        'freshwater aquarium spec'
      ].filter(Boolean),
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: titleText,
        description: truncatedDesc,
        url: productUrl,
        images: getBestProductOgImage(product.images) ? [{ url: getBestProductOgImage(product.images) as string, width: 1200, height: 630, alt: product.title }] : [],
        type: 'website',
        siteName: 'NeoBlue',
      },
      twitter: {
        card: 'summary_large_image',
        title: titleText,
        description: truncatedDesc,
        images: getBestProductOgImage(product.images) ? [getBestProductOgImage(product.images) as string] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  let product: any = null;
  let reviews: any[] = [];
  let recommendations: any[] = [];
  let allProducts: any[] = [];

  try {
    await connectDB();

    // 1. Fetch Product
    const dbProduct = await Product.findById(id).populate('vendorId', 'name email logo slug').lean() as any;
    if (!dbProduct) {
      notFound();
    }
    
    // Normalize ObjectID fields to string to avoid serialization warnings
    product = JSON.parse(JSON.stringify(dbProduct));

    // 2. Fetch Reviews from MongoDB
    const dbReviews = await Review.find({ productId: id }).sort({ createdAt: -1 }).lean();
    reviews = JSON.parse(JSON.stringify(dbReviews));

    // 3. Fetch Recommendations (from the same vendor)
    const rawVendorId = dbProduct.vendorId?._id || dbProduct.vendorId;
    let dbRecommendations: any[] = [];
    if (rawVendorId) {
      dbRecommendations = await Product.find({ 
        _id: { $ne: id },
        vendorId: rawVendorId,
        approvalStatus: 'approved',
        inStock: true
      }).populate('vendorId', 'name email logo slug').limit(10).lean();
    }
    
    // If the vendor has no other active products, fallback to same category
    if (dbRecommendations.length === 0) {
      dbRecommendations = await Product.find({ 
        _id: { $ne: id },
        category: dbProduct.category,
        approvalStatus: 'approved',
        inStock: true
      }).populate('vendorId', 'name email logo slug').limit(10).lean();
    }
    recommendations = JSON.parse(JSON.stringify(dbRecommendations));

    // 4. Fetch All Products (compact fields only for compatibility checker species search)
    const dbAllProducts = await Product.find({ approvalStatus: 'approved', inStock: true }).select('title scientific category temperament').lean();
    allProducts = JSON.parse(JSON.stringify(dbAllProducts));

  } catch {
    notFound();
  }

  // Format reviews for schema
  const reviewSchemaList = reviews.map((r: any) => ({
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": r.rating || 5,
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": r.userName || "Customer"
    },
    "reviewBody": r.comment || "Excellent quality",
    "datePublished": r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  }));

  // Define JSON-LD structured schemas for SEO crawler bots (Optimized for Google Shopping Tab)
  const productSchema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.images || [],
    "description": product.quickOverview || product.description,
    "sku": `NEO-${product._id.slice(-6).toUpperCase()}`,
    "mpn": `NEO-${product._id.slice(-6).toUpperCase()}`,
    "category": product.category,
    "brand": {
      "@type": "Brand",
      "name": "NeoBlue"
    },
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
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "IN",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "d"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "d"
          }
        }
      }
    }
  };

  if (reviews.length > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.rating || 5,
      "reviewCount": reviews.length
    };
    productSchema.review = reviewSchemaList;
  }

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
        "item": `https://neoblue.in/categories/${toSlug(product.category)}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.title,
        "item": `https://neoblue.in/products/${product._id}`
      }
    ]
  };

  // Build dynamic FAQ questions based on scientific characteristics and custom FAQs
  const faqQuestions = [
    {
      "@type": "Question",
      "name": `How should I acclimate ${product.title} after delivery?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Float the shipping bag in your aquarium for 20 to 30 minutes to equalize water temperature. Then, drip acclimate or add cupfuls of tank water gradually to match parameters before introducing the specimen into the main aquarium."
      }
    },
    {
      "@type": "Question",
      "name": `What water parameters are recommended for ${product.title}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `For ${product.title}, maintain a stable ${product.waterType.toLowerCase()} environment. Recommended pH range: ${product.phMin || 6.5} - ${product.phMax || 8.0}. Temperature range: ${product.tempMin || 20}°C - ${product.tempMax || 30}°C.`
      }
    }
  ];

  if (product.faq && Array.isArray(product.faq)) {
    product.faq.forEach((item: any) => {
      faqQuestions.push({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      });
    });
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqQuestions
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
             <ShareButton title={product.title} text={product.description || undefined} />
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
