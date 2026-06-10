import React from 'react';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import VendorShopContent from './VendorShopContent';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = { params: Promise<{ vendor: string }> };

export async function generateMetadata({ params }: Props) {
  await connectDB();
  const { vendor: identifier } = await params;
  
  let vendor: any = await User.findOne({ slug: identifier }).select('name').lean();
  if (!vendor) {
    try {
      const { Types } = await import('mongoose');
      if (Types.ObjectId.isValid(identifier)) {
        vendor = await User.findById(identifier).select('name').lean();
      }
    } catch {
      vendor = null;
    }
  }

  return {
    title: vendor ? `${vendor.name} - Storefront | Neoblue` : 'Storefront | Neoblue',
    description: vendor 
      ? `Browse and purchase premium aquatic fish, plants, and breeding pairs directly from ${vendor.name} on Neoblue.` 
      : 'Browse vendor storefronts and aquatic varieties on Neoblue.',
  };
}

export default async function ShopPage({ params }: Props) {
  await connectDB();

  const { vendor: identifier } = await params;
  let vendor: any = await User.findOne({ slug: identifier }).lean();
  if (!vendor) {
    try {
      const { Types } = await import('mongoose');
      if (Types.ObjectId.isValid(identifier)) {
        vendor = await User.findById(identifier).lean();
      }
    } catch {
      vendor = null;
    }
  }

  if (!vendor || vendor.role !== 'vendor') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto border border-rose-100">
            🐟
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">Storefront Not Found</h2>
            <p className="text-sm text-slate-500">
              The breeder storefront you are trying to visit does not exist or has been deactivated.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs w-full"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Fetch products for this vendor
  const products = await Product.find({ 
    vendorId: vendor._id
  }).lean();

  // Safely serialize MongoDB documents to plain JSON for client component serialization compatibility
  const serializedVendor = JSON.parse(JSON.stringify(vendor));
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return <VendorShopContent vendor={serializedVendor} products={serializedProducts} />;
}
