import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, ShieldCheck, Clock, PackageCheck, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: "Live Shipping Policy & DOA Guarantee: NeoBlue India",
  description: "Learn about NeoBlue live-arrival guarantee, insulated transit packaging, oxygenation process, and delivery timelines across India.",
  keywords: [
    "live fish shipping India",
    "live arrival guarantee aquarium",
    "NeoBlue shipping policy",
    "aquarium plants delivery India",
    "live fish courier packing"
  ],
  alternates: {
    canonical: 'https://neoblue.in/shipping',
  },
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 selection:bg-blue-100 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-14 px-4 sm:px-6 lg:px-8 shadow-xl shadow-blue-900/10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span>100% Live-Arrival Protected</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-3">
            Shipping Policy &amp; Live Guarantee
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Every specimen dispatched via NeoBlue is packed with professional transit care to arrive healthy, vibrant, and active at your doorstep.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-6">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <PackageCheck className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Medical-Grade Oxygenation</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Live species are packed in double-sealed thick poly bags with pure medical oxygen for up to 72 hours of transit vitality.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Truck className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Thermal Thermocol Armor</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              High-density insulated boxes guard specimens against seasonal external temperature fluctuations during courier transit.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">100% DOA Guarantee</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              In the rare event of a transit casualty, submit an unboxing video within 2 hours of delivery for a prompt replacement or refund.
            </p>
          </div>
        </div>

        {/* Dispatch Schedule & Timelines */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Dispatch Schedule &amp; Transit Timelines</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              To avoid livestock being held in courier hubs over weekends, live orders are dispatched strategically from Monday through Thursday.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block">Metro Cities</span>
              <span className="text-blue-600 font-extrabold mt-1 block">24 – 48 Hours</span>
              <span className="text-slate-400 text-[11px]">Express Air Cargo</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block">Tier-2 Cities</span>
              <span className="text-blue-600 font-extrabold mt-1 block">48 – 72 Hours</span>
              <span className="text-slate-400 text-[11px]">Priority Surface/Air</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block">South / West India</span>
              <span className="text-blue-600 font-extrabold mt-1 block">24 – 48 Hours</span>
              <span className="text-slate-400 text-[11px]">Regional Priority</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block">North / East Regions</span>
              <span className="text-blue-600 font-extrabold mt-1 block">48 – 72 Hours</span>
              <span className="text-slate-400 text-[11px]">Insulated Express</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Need assistance with an active shipment? Check your order tracking status.
            </div>
            <Link
              href="/orders"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shrink-0"
            >
              Track Your Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
