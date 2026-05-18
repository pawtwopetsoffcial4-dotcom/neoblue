'use client';

import Link from 'next/link';
import { ArrowRight, Gauge, Info, PackagePlus } from 'lucide-react';

export default function VendorShippingSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <section className="rounded-4xl bg-linear-to-br from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(2,132,199,0.6)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100">Preferences</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Product Shipping</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
          Shipping is now configured on each product directly from the add-product form.
        </p>
      </section>

      <div className="rounded-4xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900 sm:text-3xl">
              <Gauge className="h-7 w-7 text-blue-600" /> Shipping lives on the product
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Choose the shipping mode and set the charge when you create or edit a product. That value is stored with the product and used in checkout.
            </p>
          </div>

          <Link
            href="/vendor/add-product"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <PackagePlus className="h-4 w-4" /> Add Product <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-slate-900">
              <Info className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-bold">What changed</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Global shipping settings have been removed. Each product now carries its own shipping type and shipping charge.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-slate-900">
              <Info className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-bold">How to use it</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Pick per piece or by weight, then use the slider to set the charge you want for that listing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}