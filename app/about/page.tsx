import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About NeoBlue',
  description: 'Learn how NeoBlue is building India\'s trusted aquarium ecosystem.',
};

export default function AboutPage() {
  const reasons = [
    {
      icon: (
        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      text: 'The aquarium industry in India was unorganized and filled with unreliable sellers and fake promises.',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      text: 'Many hobbyists were scammed by fake sellers and social media pages using unreal prices.',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      text: 'Genuine sellers had quality products but lacked a trusted platform to reach customers.',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.772-.558-.372-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      text: 'NeoBlue was created to solve both problems through one trusted ecosystem.',
    },
  ];

  const communityCards = [
    {
      image: '/about/learn_card.png',
      title: 'Learn',
      description: 'Expert guides & tips',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      image: '/about/connect_card.png',
      title: 'Connect',
      description: 'With aqua hobbyists',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      image: '/about/explore_card.png',
      title: 'Explore',
      description: 'Inspiration & setups',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      image: '/about/shop_card.png',
      title: 'Shop',
      description: 'Trusted products',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      image: '/about/delivery_card.png',
      title: 'Trusted Delivery',
      description: 'Live arrival guarantee',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      image: '/about/support_card.png',
      title: 'Support Sellers',
      description: 'Grow together',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  return (
    <main className="min-h-screen bg-[#F4F7FB] font-sans pb-10 selection:bg-[#005AE0] selection:text-white flex justify-center">
      <div className="w-full max-w-md bg-white relative overflow-hidden shadow-2xl flex flex-col">
        
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-8 px-6 overflow-hidden bg-gradient-to-b from-[#00102b] via-[#00224d] to-[#003880]">
          {/* Subtle bubbles background overlay */}
          <div className="absolute inset-0 opacity-15" style={{
            backgroundImage: `radial-gradient(ellipse at 80% 20%, rgba(56,189,248,0.6) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(37,99,235,0.7) 0%, transparent 60%)`,
          }} />

          {/* 3. HERO CONTENT */}
          <div className="relative z-10 pr-[35%]">
            <span className="bg-[#005AE0]/60 text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/10 inline-block shadow-sm">
              ABOUT NEOBLUE
            </span>
            <h1 className="text-white text-3xl font-extrabold mt-4.5 leading-[1.15] tracking-tight">
              Building India&apos;s<br />
              <span className="text-[#38BDF8]">trusted</span> aquarium<br />
              ecosystem.
            </h1>
            <p className="text-blue-100/90 text-[11px] mt-4 leading-relaxed font-medium">
              NeoBlue brings trusted sellers, curated aquatic life, and India&apos;s growing aquarist community together under one platform.
            </p>
            
            <div className="flex flex-col gap-2.5 mt-6">
              <Link href="/products" className="h-9 px-4 rounded-xl bg-[#005AE0] hover:bg-blue-600 text-white text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 w-fit shadow-md transition-all">
                Explore Products <span>→</span>
              </Link>
              <Link href="/blog" className="h-9 px-4 rounded-xl border border-white/30 hover:border-white/50 text-white text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 w-fit bg-white/5 backdrop-blur-xs transition-all">
                Join Community <span>→</span>
              </Link>
            </div>
          </div>

          {/* 4. OVERLAPPING BETTA FISH PHOTO */}
          <div className="absolute right-[-45px] top-[135px] z-20 w-[230px] h-[230px] pointer-events-none">
            <Image
              src="/about/hero_betta_transparent.png"
              alt="Colorful betta fish"
              fill
              sizes="(max-width: 768px) 230px, 230px"
              className="object-contain"
              priority
            />
          </div>

          {/* 5. GLASSMORPHIC TRUST CARDS GRID */}
          <div className="grid grid-cols-2 gap-2.5 mt-8.5 relative z-30">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center gap-2 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-blue-600/70 border border-white/10 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white leading-tight">Scam-free marketplace</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center gap-2 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-blue-600/70 border border-white/10 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white leading-tight">Verified sellers</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center gap-2 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-blue-600/70 border border-white/10 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125a1.125 1.125 0 001.125-1.125V9.75M3.75 14.25h16.5M3.75 14.25V5.625c0-.621.504-1.125 1.125-1.125H12m8.25 9.75V9.75M12 9.75h8.25M12 9.75V4.5m0 0h6" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white leading-tight">Live arrival guarantee</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center gap-2 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-blue-600/70 border border-white/10 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.97 5.97 0 00-.75-2.985m-.938-3.197A5.003 5.003 0 0116.5 10.5m-5.487 1.113a3.001 3.001 0 11-4.027 0m0 0a5.003 5.003 0 014.757-2.71 5.003 5.003 0 014.757 2.71m-9.514 0c-.31.314-.543.684-.693 1.086A5.97 5.97 0 006 18.72m0 0h12" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white leading-tight">Community first platform</span>
            </div>
          </div>
        </section>

        {/* WHY NEOBLUE EXISTS SECTION (OUR STORY) */}
        <section className="bg-white py-10 px-6">
          <span className="text-[#005AE0] text-[9px] font-extrabold uppercase tracking-widest block mb-1">
            OUR STORY
          </span>
          <h2 className="text-[#0F172A] text-2xl font-black tracking-tight leading-none">
            Why <span className="text-[#005AE0]">NeoBlue</span> exists.
          </h2>
          
          {/* Custom Wavy line */}
          <svg className="w-16 h-2 text-sky-400 mt-2.5 mb-6" viewBox="0 0 100 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M0,5 Q10,1 20,5 T40,5 T60,5 T80,5 T100,5" />
          </svg>

          {/* Core Problems & Solutions List */}
          <div className="space-y-4">
            {reasons.map((item, index) => (
              <div key={index} className="flex gap-3.5 items-start">
                <div className="shrink-0 mt-0.5">{item.icon}</div>
                <p className="text-[#334155] text-[11px] leading-relaxed font-semibold">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Large Aquarium Image */}
          <div className="mt-8 relative w-full h-[200px] rounded-3xl overflow-hidden border border-slate-100 shadow-md">
            <Image 
              src="/about/aquascaped_tank.png" 
              alt="Beautiful planted aquascape aquarium"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
            />
          </div>
        </section>

        {/* OUR MISSION & VISION SECTION */}
        <section className="bg-[#F8FAFC] py-10 px-6 border-y border-slate-100">
          <span className="text-[#005AE0] text-[9px] font-extrabold uppercase tracking-widest block mb-1">
            OUR MISSION & VISION
          </span>
          <h2 className="text-[#0F172A] text-xl font-extrabold tracking-tight leading-snug">
            Building the <span className="text-[#005AE0]">future</span> of India&apos;s aquarium industry.
          </h2>

          <div className="grid grid-cols-2 gap-4.5 mt-7">
            {/* Mission Column */}
            <div>
              <span className="text-[#005AE0] text-[8px] font-bold uppercase tracking-widest block mb-3">
                OUR MISSION
              </span>
              <ul className="space-y-2.5">
                {[
                  'Eliminate scams and fake sellers.',
                  'Support genuine, quality-focused vendors.',
                  'Organize India\'s growing aqua market.',
                  'Build a trusted community for aquarists.'
                ].map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[9.5px] leading-snug font-semibold text-[#475569]">
                    <svg className="w-3.5 h-3.5 text-[#005AE0] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision Column */}
            <div className="border-l border-slate-200 pl-4.5">
              <span className="text-[#005AE0] text-[8px] font-bold uppercase tracking-widest block mb-2">
                OUR VISION
              </span>
              <h3 className="text-[#0F172A] text-[11px] font-extrabold leading-snug mb-1.5">
                From fragmented sellers to a professionally managed ecosystem.
              </h3>
              <p className="text-[#64748B] text-[9.5px] leading-relaxed font-semibold">
                NeoBlue is not just about buying and selling fish. We are building a complete ecosystem where aqua hobbyists can interact, share inspiration, and trade safely.
              </p>
            </div>
          </div>
        </section>

        {/* COMMUNITY FIRST SECTION */}
        <section className="bg-white py-10 px-6">
          <div className="text-center mb-8">
            <span className="text-[#005AE0] text-[9px] font-extrabold uppercase tracking-widest block mb-1">
              COMMUNITY FIRST
            </span>
            <h2 className="text-[#0F172A] text-2xl font-black tracking-tight">
              More than <span className="text-[#005AE0]">commerce.</span>
            </h2>
            <p className="text-[#64748B] text-[11px] leading-relaxed max-w-[85%] mx-auto mt-2 font-semibold">
              NeoBlue is a home for aquarium lovers to explore, learn, connect and grow together.
            </p>
          </div>

          {/* Six Cards Grid */}
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-5">
            {communityCards.map((card, i) => (
              <div key={i} className="flex flex-col">
                <div className="relative w-full h-[105px] rounded-2xl overflow-hidden border border-slate-100 shadow-sm mb-2.5">
                  <Image 
                    src={card.image} 
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 170px"
                    className="object-cover"
                  />
                  {/* Floating icon overlay bottom-left */}
                  <div className="absolute left-2.5 bottom-2.5 w-6.5 h-6.5 bg-[#005AE0] border border-white/20 rounded-full flex items-center justify-center shadow-md">
                    {card.icon}
                  </div>
                </div>
                <h3 className="text-[#0F172A] text-xs font-extrabold leading-none pl-0.5">
                  {card.title}
                </h3>
                <p className="text-[#94A3B8] text-[9.5px] leading-none mt-1 pl-0.5 font-bold">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* BANNER: INVEST IN THE HOBBY. NOT IN SCAMMERS */}
        <section className="px-6 py-4 bg-white">
          <div className="relative rounded-3xl bg-gradient-to-b from-[#00102b] to-[#00224d] overflow-hidden p-5 flex flex-col justify-center min-h-[160px] shadow-lg">
            {/* Bubbles */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.8),transparent_50%)]" />

            <div className="relative z-10 pr-[35%]">
              <h2 className="text-white text-base font-extrabold leading-tight">
                Invest in the hobby.<br />
                Not in <span className="text-[#38BDF8]">scammers.</span>
              </h2>
              <p className="text-blue-100 text-[9.5px] leading-relaxed mt-2 font-semibold">
                We&apos;re here to protect hobbyists, support genuine sellers and grow the aquarium community the right way.
              </p>
              <div className="flex gap-2 mt-4.5">
                <Link href="/products" className="h-7 px-3 bg-[#005AE0] hover:bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 shadow-md transition-colors shrink-0">
                  Explore NeoBlue <span className="leading-none">→</span>
                </Link>
                <Link href="/blog" className="h-7 px-3 border border-white/30 text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 bg-white/5 backdrop-blur-xs transition-colors shrink-0">
                  Read Our Blog <span className="leading-none">→</span>
                </Link>
              </div>
            </div>

            {/* Overlay Clownfish Photo */}
            <div 
              className="absolute right-0 top-0 bottom-0 z-0 w-[170px] pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 50%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 50%)'
              }}
            >
              <Image 
                src="/about/clownfish_banner.png" 
                alt="Clownfish swimming"
                fill
                sizes="170px"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="bg-white py-8 px-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 border-y border-slate-100 py-6">
            
            {/* Stat 1 */}
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 border border-blue-100/50">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 12s-5.5 4-8 4c-1.5 0-3.5-1-4.5-2H3c-1.5 0-2-1-2-2s.5-2 2-2h6.5c1-1 3-2 4.5-2 2.5 0 8 4 8 4z" />
                  <circle cx="16" cy="10" r="1.2" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h4 className="text-[#0F172A] text-[16px] font-black leading-none">120+</h4>
                <span className="text-[#94A3B8] text-[9.5px] font-bold leading-none mt-1 block">Fish varieties</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-100/50">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 5c3.5 0 6.5 2.5 6.5 7.5S15.5 19 12 21c-3.5-2-6.5-5.5-6.5-10.5S8.5 5 12 5z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[#0F172A] text-[16px] font-black leading-none">200+</h4>
                <span className="text-[#94A3B8] text-[9.5px] font-bold leading-none mt-1 block">Plant varieties</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-purple-600 border border-purple-100/50">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[#0F172A] text-[16px] font-black leading-none">10K+</h4>
                <span className="text-[#94A3B8] text-[9.5px] font-bold leading-none mt-1 block">Happy Hobbyists</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 border border-blue-100/50">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[#0F172A] text-[16px] font-black leading-none">100%</h4>
                <span className="text-[#94A3B8] text-[9.5px] font-bold leading-none mt-1 block">Community Focused</span>
              </div>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}