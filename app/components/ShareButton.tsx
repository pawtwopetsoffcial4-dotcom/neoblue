'use client';

import { Share2 } from 'lucide-react';
import React, { useState } from 'react';

export default function ShareButton({ title, text }: { title?: string, text?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || 'Check this out on NeoBlue',
          text: text || 'I found this amazing item on NeoBlue!',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm relative group"
      aria-label="Share this product"
    >
      <Share2 className="h-4 w-4" />
      {copied && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          Link copied!
        </span>
      )}
    </button>
  );
}
