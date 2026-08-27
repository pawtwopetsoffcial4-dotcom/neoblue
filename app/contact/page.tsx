import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MessageSquare, MapPin, Clock, ShieldCheck, ArrowRight, Sparkles, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: "Contact NeoBlue: Customer Support & Live Help",
  description: "Get in touch with NeoBlue customer support. Reach out via WhatsApp, email, or message for live fish care, plant acclimation, and order inquiries.",
  keywords: [
    "contact NeoBlue",
    "NeoBlue customer care",
    "aquarium customer support India",
    "NeoBlue phone number",
    "NeoBlue email",
    "live fish support India"
  ],
  alternates: {
    canonical: 'https://neoblue.in/contact',
  },
};

export default function ContactPage() {
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact NeoBlue",
    "url": "https://neoblue.in/contact",
    "description": "Contact information and customer support channels for NeoBlue Aquarium & Plants store.",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "NeoBlue",
      "image": "https://neoblue.in/logo.png",
      "telephone": "+91-9876543210",
      "email": "support@neoblue.in",
      "url": "https://neoblue.in",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "20:00"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 selection:bg-blue-100 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-14 px-4 sm:px-6 lg:px-8 shadow-xl shadow-blue-900/10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>We&apos;re Here To Help</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-3">
            Get In Touch With NeoBlue
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Have questions about species care, live dispatch transit, or an active order? Reach out to our dedicated aquatic support team.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Contact Cards */}
          <div className="space-y-4">
            {/* WhatsApp Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">WhatsApp Live Support</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                Instant assistance for species compatibility, water parameters & transit tracking.
              </p>
              <a
                href="https://wa.me/919876543210?text=Hi%20NeoBlue%20Team%2C%20I%20have%20an%20inquiry"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <span>Chat on WhatsApp</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Email Support */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Official Email Support</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                For order inquiries, bulk dealer requirements, or claims assistance.
              </p>
              <a
                href="mailto:support@neoblue.in"
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>support@neoblue.in</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Hours & Guarantee */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Support Hours</h3>
                  <p className="text-xs font-bold text-slate-800">Mon – Sat: 9:00 AM – 8:00 PM IST</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Arrival Guarantee</h3>
                  <p className="text-xs font-bold text-slate-800">100% DOA Protection On All Shipments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">Send Us a Message</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
              Fill in your details below and our specialist team will get back to you within 2-4 business hours.
            </p>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Thank you for reaching out! Our team will contact you shortly.'); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Inquiry Topic
                  </label>
                  <select className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50">
                    <option>Order Status & Tracking</option>
                    <option>Fish Care & Water Specs</option>
                    <option>Live Plant Inquiries</option>
                    <option>Live-Arrival Guarantee Claim</option>
                    <option>Vendor / Wholesale Partnership</option>
                    <option>Other Question</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry, order ID, or questions..."
                  className="w-full p-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="h-4 w-4" />
                <span>Send Inquiry</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
