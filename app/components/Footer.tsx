"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMode } from '@/lib/hooks/useMode';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const { mode, setMode } = useMode();
  const router = useRouter();

  const isPlants = mode === 'plants';
  const accentColorClass = isPlants ? 'text-green-200/70' : 'text-blue-200/70';
  const subtitleColorClass = isPlants ? 'text-green-100/70' : 'text-blue-100/70';
  const headerColorClass = isPlants ? 'text-green-200/50' : 'text-blue-200/50';
  const linkColorClass = isPlants ? 'text-green-100/80' : 'text-blue-100/80';
  const copyrightColorClass = isPlants ? 'text-green-200/50' : 'text-blue-200/50';

  return (
    <footer className="w-full bg-transparent flex justify-center py-6">
      <div className="w-full max-w-md md:max-w-4xl px-5">
        <div className={`bg-gradient-to-b ${
          isPlants ? 'from-[#032008] to-[#010c03]' : 'from-[#001435] to-[#00081a]'
        } rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden transition-colors duration-500`}>
          
          <div className={`absolute inset-0 opacity-5 transition-all duration-500 ${
            isPlants 
              ? 'bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.5),transparent_40%)]' 
              : 'bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.5),transparent_40%)]'
          }`} />

          {/* Stay Updated Banner */}
          <div className="relative z-10 mb-7">
            <h3 className="text-white text-base font-extrabold leading-none">
              {isPlants ? 'Stay updated with NeoBlue Plants' : 'Stay updated with NeoBlue'}
            </h3>
            <p className={`${accentColorClass} text-[9.5px] mt-1.5 font-bold transition-colors duration-300`}>
              {isPlants ? 'Plants, new arrivals, tips and more' : 'Tips, new arrivals, offers and more'}
            </p>
            
            <div className="flex gap-2 mt-4">
              <input 
                type="email" 
                placeholder="Enter your email..." 
                className="flex-1 min-w-0 h-9 px-4 rounded-xl bg-white text-slate-900 text-xs focus:outline-none placeholder-slate-400 font-semibold"
              />
              <button className={`h-9 px-4.5 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md transition-all duration-300 shrink-0 ${
                isPlants 
                  ? 'bg-green-700 hover:bg-green-600 shadow-green-950/20' 
                  : 'bg-[#005AE0] hover:bg-blue-600 shadow-blue-950/20'
              }`}>
                Subscribe
              </button>
            </div>
          </div>

          <hr className="border-white/10 my-6" />

          {/* Footer Logo & Tagline */}
          <div className="relative z-10 flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-6 w-6 bg-white rounded-full flex items-center justify-center p-1">
                <Image 
                  src="/logo.png" 
                  alt="NEOBLUE Logo" 
                  width={16} 
                  height={16} 
                  className="object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <span className="font-extrabold text-xs tracking-widest text-white uppercase">
                {isPlants ? 'NEOBLUE PLANTS' : 'NEOBLUE'}
              </span>
            </Link>
            <p className={`${subtitleColorClass} text-[9.5px] leading-relaxed font-semibold transition-colors duration-300`}>
              {isPlants ? "India's trusted aquatic plant ecosystem." : "India's trusted aquarium ecosystem."}<br />
              For hobbyists. By hobbyists.
            </p>
            
            {/* Social Media Links */}
            <div className="flex gap-3 mt-2">
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors" aria-label="Instagram">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" />
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors" aria-label="YouTube">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.42z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors" aria-label="Facebook">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              {/* WhatsApp */}
              <a href="https://whatsapp.com" target="_blank" rel="noreferrer" className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors" aria-label="WhatsApp">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Footer Links Grid */}
          <div className="grid grid-cols-3 gap-2 mt-8 text-[9.5px]">
            <div>
              <span className={`${headerColorClass} font-bold block mb-2 uppercase tracking-wider transition-colors duration-300`}>Shop</span>
              <ul className={`${linkColorClass} space-y-1.5 font-semibold transition-colors duration-300`}>
                <li>
                  <button 
                    onClick={() => { setMode('fishes'); router.push('/products'); }}
                    className="hover:text-white transition-colors text-left font-semibold"
                  >
                    Fishes
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setMode('plants'); router.push('/products'); }}
                    className="hover:text-white transition-colors text-left font-semibold"
                  >
                    Plants
                  </button>
                </li>
                <li><Link href="/products?category=accessories" className="hover:text-white transition-colors">Accessories</Link></li>
                <li><Link href="/products?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
              </ul>
            </div>
            <div>
              <span className={`${headerColorClass} font-bold block mb-2 uppercase tracking-wider transition-colors duration-300`}>Company</span>
              <ul className={`${linkColorClass} space-y-1.5 font-semibold transition-colors duration-300`}>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <span className={`${headerColorClass} font-bold block mb-2 uppercase tracking-wider transition-colors duration-300`}>Support</span>
              <ul className={`${linkColorClass} space-y-1.5 font-semibold transition-colors duration-300`}>
                <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
                <li><Link href="/return-refund-policy" className="hover:text-white transition-colors">Returns</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <hr className="border-white/10 my-6" />

          {/* Copyright and Back to Top */}
          <div className={`relative z-10 flex items-center justify-between text-[9px] ${copyrightColorClass} font-bold transition-colors duration-300`}>
            <span>&copy; 2025 {isPlants ? 'NeoBlue Plants' : 'NeoBlue'}. All rights reserved.</span>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-md ${
                isPlants 
                  ? 'bg-green-700 hover:bg-green-600 shadow-green-950/20' 
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/20'
              }`}
              aria-label="Scroll back to top"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}

