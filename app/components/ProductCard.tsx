import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';

interface ProductCardProps {
  product: any;
  idx?: number;
  className?: string;
}

export default function ProductCard({ product, idx = 0, className = "" }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const productId = product._id || product.id;
  const isLiked = isInWishlist(productId);

  const isPairPrice = product.perPairPrice != null && typeof product.perPairPrice === 'number';
  const hasDiscount = product.discountPercentage != null && product.discountPercentage > 0;
  const isPlants = product.category === 'Plants';
  
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  const theme = isPlants ? {
    hoverBorder: 'hover:border-slate-200',
    hoverShadow: 'hover:shadow-md',
    titleHover: 'group-hover:text-emerald-700',
    badgeBg: 'bg-emerald-600',
    btnBg: 'bg-slate-900',
    btnHover: 'hover:bg-slate-800',
    btnShadow: 'shadow-xs',
  } : {
    hoverBorder: 'hover:border-slate-200',
    hoverShadow: 'hover:shadow-md',
    titleHover: 'group-hover:text-slate-900',
    badgeBg: 'bg-slate-800',
    btnBg: 'bg-slate-900',
    btnHover: 'hover:bg-slate-800',
    btnShadow: 'shadow-xs',
  };

  return (
    <Link
      href={`/products/${product._id || product.id}`}
      prefetch={false}
      style={{ animationDelay: `${idx * 45}ms` }}
      className={`group flex flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] bg-white border border-slate-100 hover:-translate-y-1.5 transition-all duration-500 animate-fade-in-up ${theme.hoverBorder} ${theme.hoverShadow} ${className}`}
    >
      {/* Image Block */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <Image
          src={product.images?.[0] ?? product.img ?? '/illustrations/placeholder.png'}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          priority={idx < 4}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {(product.waterType || isPlants) && (
          <span className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2 py-1 rounded-md text-[9px] font-black tracking-wider uppercase backdrop-blur-md shadow-sm border border-white/20 transition-transform duration-300 ${theme.badgeBg} text-white`}>
            {isPlants ? 'PLANTED' : product.waterType}
          </span>
        )}

        {/* Wishlist Heart Action */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(productId);
          }}
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300 z-20 cursor-pointer ${
            isLiked
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-500 backdrop-blur-xs shadow-xs'
          }`}
          aria-label="Toggle Wishlist"
        >
          <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-white text-white' : ''}`} />
        </button>

        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 mt-6 sm:mt-7 px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-600 text-white shadow-xs uppercase tracking-wider z-10">
            {product.discountPercentage}% Off
          </span>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
             <span className="rounded-xl bg-slate-900/90 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl transform -rotate-6">
                Sold Out
             </span>
          </div>
        )}
      </div>

      {/* Metadata Details */}
      <div className="flex flex-col flex-1 justify-between p-2.5 sm:p-3">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
              {product.category || 'Product'}
            </span>
          </div>

          <div className="mb-2">
            <h3 className={`text-[13px] sm:text-[15px] font-black text-slate-800 truncate transition-colors duration-300 leading-[1.3] ${theme.titleHover}`} title={product.title}>
              {product.title}
            </h3>
            {product.scientific && (
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 italic mt-0.5 truncate">
                {product.scientific}
              </p>
            )}
          </div>
        </div>

        {/* Pricing & Cart Group */}
        <div className="pt-2 border-t border-slate-100 border-dashed flex flex-col gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[17px] sm:text-xl font-black text-slate-900 tracking-tight">
              {formatPrice(product.price)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              / {isPairPrice ? 'PAIR' : 'PIECE'}
            </span>
            {hasDiscount && product.originalPrice && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-bold ml-1">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {product.inStock ? (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const isPair = product.perPairPrice != null;
                addToCart({
                  ...product,
                  _id: product._id || product.id,
                  title: product.title,
                  price: product.price,
                  images: product.images || [product.img || '/illustrations/placeholder.png'],
                  perPairPrice: product.perPairPrice ?? null,
                  category: product.category,
                  weightPerPiece: product.weightPerPiece,
                  vendorId: product.vendorId,
                  inStock: true,
                } as any, 1, true, {
                  packQty: 1,
                  unitLabel: isPair ? 'pair' : 'piece',
                  customPrice: product.price,
                });
              }}
            >
              <div className={`group/btn flex items-center justify-center gap-2 py-2 w-full rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs text-white transition-all duration-300 shadow-xs active:scale-95 cursor-pointer ${theme.btnBg} ${theme.btnHover} ${theme.btnShadow}`}>
                <ShoppingCart className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:-rotate-12 group-hover/btn:scale-110" />
                <span>Add to Cart</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex items-center justify-center gap-1.5 py-2 w-full rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs text-slate-400 bg-slate-100 border border-slate-200/60 cursor-not-allowed select-none"
            >
              <span>Out of Stock</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
