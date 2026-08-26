'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { FB_PIXEL_ID, pageview } from '@/lib/fpixel';

function FacebookPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Trigger pageview on client-side route changes
    pageview();
  }, [pathname, searchParams]);

  return null;
}

export default function FacebookPixel({ initialPixelId }: { initialPixelId?: string }) {
  const [pixelId, setPixelId] = useState<string>(initialPixelId || FB_PIXEL_ID);

  useEffect(() => {
    // Dynamically fetch Pixel ID from database config if updated in Admin Settings
    const fetchLivePixelId = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data?.facebookPixelId && data.facebookPixelId !== pixelId) {
            setPixelId(data.facebookPixelId);
            if (typeof window !== 'undefined' && window.fbq) {
              window.fbq('init', data.facebookPixelId);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic pixel config:', err);
      }
    };

    fetchLivePixelId();
  }, [pixelId]);

  if (!pixelId) return null;

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt="meta-pixel"
        />
      </noscript>
      <Suspense fallback={null}>
        <FacebookPixelTracker />
      </Suspense>
    </>
  );
}
