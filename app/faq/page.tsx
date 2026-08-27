import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, Sparkles, ArrowRight, ShieldCheck, Fish, Leaf, Truck, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ): NeoBlue India",
  description: "Find answers to frequently asked questions about ordering live aquarium fish, plants, water acclimation, shipping guarantee, and DOA claims.",
  keywords: [
    "aquarium FAQ India",
    "live fish delivery questions",
    "how to acclimate fish",
    "NeoBlue FAQ",
    "aquarium plant care FAQ"
  ],
  alternates: {
    canonical: 'https://neoblue.in/faq',
  },
};

const faqs = [
  {
    category: "Live Fish & Acclimation",
    icon: Fish,
    items: [
      {
        q: "How do I safely acclimate new fish to my aquarium?",
        a: "Float the sealed bag in your aquarium for 20-30 minutes to equalize water temperature. Open the bag and slowly add half a cup of your tank water every 5 minutes for 20-30 minutes (or use a drip acclimation kit). Net the fish gently into the tank without pouring shipping water in."
      },
      {
        q: "Are the fish quarantined before dispatch?",
        a: "Yes. All livestock is conditioned and quarantined by verified breeders and vendors to ensure they are parasite-free, active, and feeding vigorously before shipment."
      },
      {
        q: "How can I check water compatibility for my aquarium?",
        a: "Every product page on NeoBlue includes comprehensive care specifications: recommended pH range, temperature tolerance, hardness, temperament, and compatible tank mates."
      }
    ]
  },
  {
    category: "Aquatic Plants",
    icon: Leaf,
    items: [
      {
        q: "Are your plants snail-free and pesticide-free?",
        a: "Yes. Our partner nurseries follow strict algae-free and snail-controlled cultivation protocols to ensure clean specimens suitable for shrimp and sensitive nano aquariums."
      },
      {
        q: "Do I need CO2 injection for the plants?",
        a: "We offer both beginner-friendly low-tech plants (Anubias, Java Fern, Cryptocoryne) that thrive without CO2, as well as high-tech carpeting plants (Monte Carlo, Rotala) that benefit from CO2 supplementation."
      }
    ]
  },
  {
    category: "Shipping & Live Arrival Guarantee",
    icon: Truck,
    items: [
      {
        q: "What is the Live Arrival Guarantee (DOA Policy)?",
        a: "We guarantee 100% live arrival on all shipments across India. In the rare event a specimen arrives dead, take an unedited clear video of the unopened bag within 2 hours of delivery and submit a claim for an instant refund or replacement."
      },
      {
        q: "How are live fish packed for courier transit?",
        a: "Specimens are packed in heavy-duty double-poly bags filled with pure medical-grade oxygen and clean water, housed inside custom insulated thermocol boxes with thermal regulation."
      }
    ]
  },
  {
    category: "Orders & Payments",
    icon: CreditCard,
    items: [
      {
        q: "What payment methods are supported?",
        a: "We support all major Indian payment methods through secure gateway encryption: UPI (Google Pay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and Wallets."
      },
      {
        q: "Can I share my cart with a friend or family member?",
        a: "Yes! NeoBlue has a built-in Cart Sharing feature. Click 'Share Cart' on the bag or checkout page to generate a short shareable link that lets anyone load your selected items instantly."
      }
    ]
  }
];

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    )
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 selection:bg-blue-100 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-14 px-4 sm:px-6 lg:px-8 shadow-xl shadow-blue-900/10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="h-3.5 w-3.5 text-amber-300" />
            <span>Help Center &amp; Guides</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Everything you need to know about purchasing, acclimating, and receiving live aquatic livestock and plants from NeoBlue.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-8">
        {faqs.map((group, gIdx) => {
          const Icon = group.icon;
          return (
            <div key={gIdx} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">{group.category}</h2>
              </div>

              <div className="space-y-4">
                {group.items.map((faq, fIdx) => (
                  <div key={fIdx} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                      <span className="text-blue-600 font-black shrink-0">Q.</span>
                      <span>{faq.q}</span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed pl-5 font-medium">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Still have questions banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-900/10">
          <div>
            <h2 className="text-lg sm:text-xl font-black mb-1">Still Have Questions?</h2>
            <p className="text-blue-100 text-xs sm:text-sm font-medium">
              Our expert aquarium care team is available to assist you with species advice.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs uppercase tracking-wider shrink-0 transition-all active:scale-95 shadow-md"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
