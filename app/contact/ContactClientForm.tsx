"use client";

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function ContactClientForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4 bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
        <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Message Received!</h3>
        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          Thank you for reaching out to NeoBlue. Our specialist aquatic team will review your inquiry and get back to you within 2–4 business hours.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-xs font-bold text-blue-600 hover:underline pt-2"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
            placeholder="+91 95358 72394"
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
  );
}
