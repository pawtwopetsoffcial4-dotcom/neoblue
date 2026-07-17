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
  title: "NEOBLUE",
  description: "Fish Selling Ecommerce",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

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
