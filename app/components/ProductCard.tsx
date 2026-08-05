import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';

interface ProductCardProps {
  product: any;
  idx?: number;
  className?: string;
}

export default function ProductCard({ product, idx = 0, className = "" }: ProductCardProps) {
  const { addToCart } = useCart();
  const isPairPrice = product.perPairPrice != null && typeof product.perPairPrice === 'number';
  const hasDiscount = product.discountPercentage != null && product.discountPercentage > 0;
  
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  return (
    <Link
      href={`/products/${product._id || product.id}`}
      style={{ animationDelay: `${idx * 45}ms` }}
      className={`group flex flex-col overflow-hidden rounded-[20px] bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-fade-in-up ${className}`}
    >
      {/* Image Block */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-slate-50 border-b border-slate-100">
        <Image
          src={product.images?.[0] ?? product.img ?? '/illustrations/placeholder.png'}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Water type badge */}
        {(product.waterType || product.category === 'Plants') && (
          <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase backdrop-blur-md shadow-sm ${
            product.category === 'Plants'
              ? 'bg-green-500/90 text-white'
              : product.waterType === 'Freshwater'
              ? 'bg-blue-500/90 text-white'
              : product.waterType === 'Saltwater'
              ? 'bg-cyan-500/90 text-white'
              : 'bg-emerald-500/90 text-white'
          }`}>
            {product.category === 'Plants' ? 'PLANTED' : product.waterType}
          </span>
        )}

        {/* Discount flag */}
        {hasDiscount && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-500 text-white shadow-sm uppercase tracking-wider">
            {product.discountPercentage}% Off
          </span>
        )}

        {/* Out of Stock flag */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
             <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[10px] md:text-xs font-extrabold uppercase tracking-widest text-white shadow-lg">
                Sold Out
             </span>
          </div>
        )}
      </div>

      {/* Metadata Details */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
            {product.category || 'Product'}
          </span>
          {(product.rating > 0) ? (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 shrink-0">
              ★ {product.rating}
            </span>
          ) : null}
        </div>

        <div className="mb-1.5">
          <h3 className="text-[13px] md:text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
            {product.title}
          </h3>
          {product.scientific && (
            <p className="text-[10px] font-medium text-slate-400 italic mt-0.5 line-clamp-1">
              {product.scientific}
            </p>
          )}
        </div>

        {/* Pricing & Cart Group (Sticks to bottom) */}
        <div className="mt-auto pt-2.5 border-t border-slate-100 flex flex-col gap-2">
          {/* Pricing block */}
          <div className="flex items-baseline gap-1">
            <span className="text-sm md:text-base font-black text-slate-900">
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              / {isPairPrice ? 'PAIR' : 'PIECE'}
            </span>
            {hasDiscount && product.originalPrice && (
              <span className="text-[10px] text-slate-400 line-through font-semibold ml-1.5">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart Footer */}
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart({
                _id: product._id || product.id,
                title: product.title,
                price: product.price,
                images: product.images || [product.img || '/illustrations/placeholder.png'],
              } as any);
            }}
          >
            <div className={`flex items-center justify-center gap-1.5 py-1.5 w-full rounded-md font-bold text-[11px] transition-all shadow-sm active:scale-95 cursor-pointer ${
              product.category === 'Plants' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              <ShoppingCart className="h-3 w-3" />
              <span>Add to Cart</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
