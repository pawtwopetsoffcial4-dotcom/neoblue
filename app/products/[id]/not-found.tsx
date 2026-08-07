import React from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
       <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Info className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Oops! Product not found</h1>
           <p className="text-slate-500 mb-6">We couldn&apos;t find the product you&apos;re looking for. It may have been removed or the link is incorrect.</p>
           <Link href="/products" className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors w-full">
             Return to Shop
           </Link>
       </div>
    </div>
  );
}
