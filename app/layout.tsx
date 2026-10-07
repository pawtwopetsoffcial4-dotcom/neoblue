import type { Metadata } from "next";
import { Inter, Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileDock from "./components/MobileDock";
import FacebookPixel from "./components/FacebookPixel";
import GoogleAnalytics from "./components/GoogleAnalytics";
import OneSignalInit from "./components/OneSignalInit";
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
    default: "NeoBlue: Buy Aquarium Fish & Live Plants Online India",
    template: "%s | NeoBlue",
  },
  description: "Shop premium live aquarium fish, plants, shrimp & snails online. Live-arrival guaranteed delivery with detailed species water care specs across India.",
  keywords: [
    "aquarium fish online",
    "buy aquarium fish India",
    "live aquarium plants online",
    "aquarium plants India",
    "guppy fish buy online",
    "discus fish price India",
    "cichlid fish online",
    "aquatic snails shrimp India",
    "NeoBlue aquarium store",
    "live fish delivery India"
  ],
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
    title: "NeoBlue: Buy Aquarium Fish & Live Plants Online India",
    description: "Shop premium live aquarium fish, plants, shrimp & snails online. Live-arrival guaranteed delivery with detailed species water care specs across India.",
    url: 'https://neoblue.in',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'NeoBlue Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "NeoBlue: Buy Aquarium Fish & Live Plants Online India",
    description: "Shop premium live aquarium fish, plants, shrimp & snails online. Live-arrival guaranteed delivery with detailed species water care specs across India.",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "xugqoiowbx";
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      className={`${interSans.variable} ${interTight.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
      </head>
      <body className="min-h-full flex flex-col pb-24 md:pb-0">
        {/* Google Analytics GA4 (Dynamic & Env Supported) */}
        <GoogleAnalytics initialGaId={gaId} />

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
        <FacebookPixel />
        <OneSignalInit />
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
