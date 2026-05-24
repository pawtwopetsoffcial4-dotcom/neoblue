import React from 'react';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';

type Props = { params: { vendor: string } };

export default async function ShopPage({ params }: Props) {
  await connectDB();

  const identifier = params.vendor;
  // try find by slug first, then by id
  let vendor = (await User.findOne({ slug: identifier }).lean()) as any;
  if (!vendor) {
    try {
      const { Types } = await import('mongoose');
      if (Types.ObjectId.isValid(identifier)) {
        vendor = (await User.findById(identifier).lean()) as any;
      }
    } catch (e) {
      vendor = null as any;
    }
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Vendor not found</div>
      </div>
    );
  }

  const products = await Product.find({ vendorId: vendor._id, approvalStatus: 'approved' }).lean();

  return (
    <div className="min-h-screen bg-[#f7fafc] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {vendor.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.logo} alt={`${vendor.name} logo`} className="h-20 w-20 rounded-lg object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">No Logo</div>
          )}

          <div>
            <h1 className="text-2xl font-bold">{vendor.name}</h1>
            <p className="text-sm text-slate-600">{vendor.email}</p>
            {vendor.phone && <p className="text-sm text-slate-600">{vendor.phone}</p>}
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-3">Products</h2>

        {products.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center text-slate-600">No products found for this vendor.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product: any) => (
              <Link
                href={`/products/${product._id}`}
                key={product._id}
                className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-transform"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.images?.[0] ?? '/illustrations/placeholder.png'} alt={product.title} className="absolute inset-0 h-full w-full object-cover" />
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{product.title}</h3>
                  <div className="mt-2 text-lg font-black text-slate-900">₹{product.price}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
