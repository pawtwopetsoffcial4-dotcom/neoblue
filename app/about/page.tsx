import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About NeoBlue',
  description: 'Learn how NeoBlue is building a trusted aquarium ecosystem for India.',
};

const CheckIcon = () => (
  <svg className="w-4 h-4 text-[#005AE0] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F4F7FB] font-sans pb-10 selection:bg-[#005AE0] selection:text-white flex justify-center">
      <div className="w-full max-w-md bg-[#F4F7FB] relative overflow-hidden shadow-2xl">
        {/* Header Section */}
        <section className="relative pt-12 pb-28 px-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #001a3a 0%, #002966 40%, #003d99 70%, #0052cc 100%)' }}>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(ellipse at 80% 50%, rgba(0,82,204,0.6) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(0,20,60,0.8) 0%, transparent 50%)`,
          }} />

          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,60 C300,100 900,20 1200,60 L1200,120 L0,120 Z' fill='%23003399'/%3E%3C/svg%3E")`,
            backgroundSize: 'cover',
          }} />

          <div className="relative z-10">
            <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/20">
              Community
            </span>
            <h1 className="text-white text-[32px] font-extrabold mt-6 leading-[1.1] tracking-tight">
              About <br />
              <span className="text-[#60A5FA]">NeoBlue</span>
            </h1>
            <p className="text-blue-100 text-xs mt-4 leading-relaxed max-w-[65%]">
              Building India&apos;s trusted aquarium ecosystem for enthusiasts.
            </p>
            <p className="text-blue-100 text-xs mt-3 leading-relaxed max-w-[65%]">
              Our platform brings essential aqua services under one roof while growing India&apos;s largest aquarist community.
            </p>
          </div>

          <div className="absolute -right-5 top-6 z-20">
            <Image
              src="https://png.pngtree.com/png-clipart/20241004/original/pngtree-colorful-betta-fish-3d-graphic-png-image_16198446.png"
              alt="Colorful betta fish"
              width={220}
              height={220}
              className="object-contain rotate-y-180 mt-10 drop-shadow-2xl"
              priority
            />
          </div>
        </section>

        {/* Commitment / Vision overlapping Card */}
        <div className="mx-5 -mt-14 relative z-20">
          <div className="bg-[#0B192C] rounded-3xl p-5 flex items-center justify-between shadow-xl">
            <div className="flex-1 pr-3">
              <h3 className="text-white font-bold text-[15px] mb-1.5">Our Vision</h3>
              <p className="text-[#38BDF8] text-[11px] font-semibold mb-1">Hobbyists First. Trust Always.</p>
              <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                From a fragmented sector to a<br />
                professionally managed ecosystem for<br />
                every aquarist in India.
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="https://cdn3d.iconscout.com/3d/premium/thumb/shield-check-3d-icon-download-in-png-blend-fbx-gltf-file-formats--protection-security-safe-pack-network-communication-icons-6305093.png"
                alt="Security shield"
                width={72}
                height={72}
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Hobby Highlights */}
        <section className="mt-10">
          <h2 className="px-6 text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-4">
            Hobby Highlights
          </h2>

          <div className="mx-5 bg-[#F5F8FF] rounded-3xl p-5 mb-6">
            <h3 className="text-[#0F172A] font-bold text-[13px] mb-4">India&apos;s Aqua Community Platform</h3>
            <div className="flex gap-4">
              <div className="w-22.5 shrink-0">
                <div className="bg-[#0B192C] rounded-2xl overflow-hidden shadow-lg p-2.5 flex flex-col justify-between" style={{ width: 90, height: 160 }}>
                  <div className="space-y-2">
                    <span className="text-[7px] bg-[#1E3A5F] text-[#60A5FA] px-1.5 py-0.5 rounded font-semibold block text-center">120+ Fish</span>
                    <span className="text-[7px] bg-[#1E3A5F] text-[#34D399] px-1.5 py-0.5 rounded font-semibold block text-center">200+ Plants</span>
                    <span className="text-[7px] bg-[#1E3A5F] text-[#FBBF24] px-1.5 py-0.5 rounded font-semibold block text-center">No Scams</span>
                  </div>
                  <div className="relative h-16 bg-linear-to-b from-[#0d2137] to-[#0a1a2e] flex items-center justify-center rounded-lg">
                    <div className="w-8 h-8 bg-[#005AE0] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-[#0F172A] font-bold text-[12px] mb-1">Curated Marketplace</h4>
                <p className="text-[#64748B] text-[10px] leading-relaxed mb-2">
                  NeoBlue offers a curated selection specifically tailored to the unique requirements of the Indian aquarium community:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[9px] bg-blue-50 text-[#005AE0] px-2 py-0.5 rounded border border-blue-100 font-medium">120+ Fish Varieties</span>
                  <span className="text-[9px] bg-emerald-50 text-[#059669] px-2 py-0.5 rounded border border-emerald-100 font-medium">200+ Plant Varieties</span>
                  <span className="text-[9px] bg-amber-50 text-[#D97706] px-2 py-0.5 rounded border border-amber-100 font-medium">Hobbyist-First Design</span>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights Steps */}
          <div className="space-y-6">
            <div className="mx-5 flex gap-4 items-start">
              <div className="w-14 shrink-0 flex flex-col items-center pt-1">
                <Image
                  src="/illustrations/fish-bag.svg"
                  alt="Curated aquatic fish"
                  width={56}
                  height={56}
                  className="object-contain drop-shadow"
                />
              </div>
              <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#005AE0] text-white text-[10px] font-bold px-2 py-0.5 rounded">01</span>
                  <h4 className="text-[#0F172A] font-bold text-[13px]">Vast Variety catalog</h4>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed">
                  We host a growing inventory of over 120+ species of tropical fish and 200+ species of aquatic plants. Get default catalog description autocompletes, care requirements, and water type advice for every species automatically.
                </p>
              </div>
            </div>

            <div className="mx-5 flex gap-4 items-start">
              <div className="w-14 shrink-0 flex flex-col items-center pt-1">
                <Image
                  src="/illustrations/truck.svg"
                  alt="Safe shipping"
                  width={56}
                  height={56}
                  className="object-contain drop-shadow"
                />
              </div>
              <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#005AE0] text-white text-[10px] font-bold px-2 py-0.5 rounded">02</span>
                  <h4 className="text-[#0F172A] font-bold text-[13px]">Secure Logistics &amp; Shipping</h4>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed">
                  Configuring precise weight-based or quantity-based shipping rates across regions (North and South India) enables our sellers to deliver specimens safely with proper care protocols.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="mt-12">
          <div className="px-6 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-2">
                Our Story
              </h2>
              <p className="text-[#0F172A] text-[13px] font-bold leading-snug">
                Created to solve a real, unorganized marketplace problem.
              </p>
            </div>
            <Image
              src="/illustrations/wallet.svg"
              alt="Story Wallet"
              width={72}
              height={72}
              className="object-contain drop-shadow shrink-0"
            />
          </div>

          <div className="mx-5 mt-6 bg-[#FEF2F2] rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-[#DC2626] font-bold text-[14px] mb-2 relative z-10">Eliminating Scams</h3>
            <p className="text-[#991B1B] text-[12px] mb-4 relative z-10 w-[70%]">
              We started NeoBlue to fight unorganized marketplaces where hobbyists got scammed by fake listings.
            </p>
            <p className="text-[#7F1D1D] text-[11px] leading-relaxed relative z-10 w-[70%] font-medium">
              We connect passionate buyers with verified, quality-focused vendors who offer genuine guarantees and reliable shipping.
            </p>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
              <Image
                src="/illustrations/shield-check.svg"
                alt="Verified seal"
                width={90}
                height={90}
                className="object-contain drop-shadow-lg opacity-85"
              />
            </div>
          </div>

          {/* Story Details Card */}
          <div className="mx-5 mt-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <h3 className="text-[#0F172A] font-bold text-[14px] mb-3 relative z-10 w-[60%]">How NeoBlue Works</h3>
            <p className="text-[#64748B] text-[11px] leading-relaxed mb-4 relative z-10 w-[60%]">
              We elevate quality sellers while creating a secure environment.
            </p>
            <ul className="space-y-2 relative z-10 w-[65%]">
              <li className="flex items-start gap-2 text-[11px] text-[#005AE0] font-medium leading-tight">
                <CheckIcon /> Verified seller approvals
              </li>
              <li className="flex items-start gap-2 text-[11px] text-[#005AE0] font-medium leading-tight">
                <CheckIcon /> Genuine product autocompletes
              </li>
              <li className="flex items-start gap-2 text-[11px] text-[#005AE0] font-medium leading-tight">
                <CheckIcon /> Regional shipping configurations
              </li>
            </ul>
            <div className="absolute -right-4 bottom-4 z-0">
              <Image
                src="/illustrations/aquarium.svg"
                alt="Fish tank illustration"
                width={140}
                height={140}
                className="object-contain drop-shadow-xl opacity-90"
              />
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="mt-12">
          <h2 className="px-6 text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-4">
            Our Mission
          </h2>

          <div className="mx-5 space-y-3">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Eliminate scams and fake sellers completely' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', text: 'Support genuine and quality-focused vendors' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', text: 'Organize India\'s growing aquarium market' },
              { icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', text: 'Build a trusted community for aquarists across the country' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-3.5 flex items-center gap-4 shadow-sm border border-gray-50">
                <div className="w-11 h-11 shrink-0 bg-[#F0F5FF] rounded-xl flex items-center justify-center text-[#005AE0] border border-[#E0EAFF]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <p className="text-[#0F172A] text-[12px] font-bold leading-tight pr-2">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Values */}
        <section className="mt-12">
          <h2 className="px-6 text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-4">
            Our Core Values
          </h2>

          <div className="mx-5 space-y-4">
            {[
              { title: 'Trust first', desc: 'We want every buyer and seller to feel safe using the platform.' },
              { title: 'For hobbyists', desc: 'NeoBlue is designed around how aquarium enthusiasts actually shop and learn.' },
              { title: 'Community led', desc: 'The platform grows with the people who use it every day.' },
              { title: 'Quality focused', desc: 'We elevate genuine vendors and reliable aquarium products.' }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                <h4 className="text-[#0F172A] font-extrabold text-[13px] mb-1">{item.title}</h4>
                <p className="text-[#64748B] text-[11px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Action Call / Links */}
        <section className="mx-5 mt-6 bg-[#F5F8FF] rounded-3xl p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-[#0F172A] font-bold text-[13px] mb-1">Explore NeoBlue</h3>
            <p className="text-[#64748B] text-[11px] leading-relaxed">
              Find verified products and connect with our passionate aquarium community.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/products" className="flex-1 text-center bg-[#005AE0] text-white font-bold text-xs py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md">
              Shop Now
            </Link>
            <Link href="/blog" className="flex-1 text-center bg-white text-[#005AE0] border border-[#E0EAFF] font-bold text-xs py-3 rounded-xl hover:bg-slate-50 transition-colors">
              Explore Blog
            </Link>
          </div>
        </section>

        {/* Thank You Note */}
        <div className="mx-5 mt-8 mb-10 pl-2">
          <p className="font-serif italic text-[#0F172A] text-[20px] leading-tight">
            Thank you for supporting<br />the aquarium hobby!
          </p>
          <p className="text-[#005AE0] font-bold text-[12px] mt-3">— NeoBlue Team</p>
        </div>
      </div>
    </main>
  );
}