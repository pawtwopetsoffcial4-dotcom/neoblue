import type { Metadata } from "next";
import { Inter, Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileDock from "./components/MobileDock";
import { RootProviders } from "./providers";
import Script from "next/script";

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://neoblue.in'),
  title: {
    default: "NeoBlue — India's Premium Aquarium Fish & Live Plants Store",
    template: "%s | NeoBlue",
  },
  description: "Shop premium quality live aquarium fish, shrimp, snails, and aquatic plants online at NeoBlue. Browse species care specs, detailed parameters, and get live-arrival guaranteed delivery across India.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://neoblue.in',
    languages: {
      'en-IN': 'https://neoblue.in',
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NeoBlue',
    title: "NeoBlue — India's Premium Aquarium Fish & Live Plants Store",
    description: "Shop premium quality live aquarium fish, shrimp, snails, and aquatic plants online. Live-arrival guaranteed delivery across India.",
    url: 'https://neoblue.in',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'NeoBlue Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "NeoBlue — India's Premium Aquarium Fish & Live Plants Store",
    description: "Shop premium quality live aquarium fish, shrimp, snails, and aquatic plants online. Live-arrival guaranteed delivery across India.",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "xugqoiowbx";

  return (
    <html
      lang="en"
      className={`${interSans.variable} ${interTight.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-24 md:pb-0">
        {clarityId && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script","${clarityId}");
            `}
          </Script>
        )}
        <RootProviders>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <MobileDock />
        </RootProviders>
      </body>
    </html>
  );
}
