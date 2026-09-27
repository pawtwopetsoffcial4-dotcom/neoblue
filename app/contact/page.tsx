import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MessageSquare, MapPin, Clock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import ContactClientForm from './ContactClientForm';

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
      "telephone": "+91-9535872394",
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
              <h2 className="text-base font-bold text-slate-900">WhatsApp &amp; Phone Support</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                Instant assistance for species compatibility, water parameters &amp; transit tracking.
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                <a
                  href="https://wa.me/919535872394?text=Hi%20NeoBlue%20Team%2C%20I%20have%20an%20inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <span>Chat on WhatsApp (+91 95358 72394)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a
                  href="tel:+919535872394"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call: +91 95358 72394</span>
                </a>
              </div>
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

            <ContactClientForm />
          </div>
        </div>
      </div>
    </div>
  );
}
