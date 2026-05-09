import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Fish, ShieldCheck, Sparkles, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About NeoBlue',
  description: 'Learn how NeoBlue is building a trusted aquarium ecosystem for India.',
};

const highlights = [
  '120+ varieties of aquatic fish',
  '200+ varieties of aquatic plants',
  'A platform designed specifically for India\'s aqua hobby community',
];

const missionPoints = [
  'Eliminate scams and fake sellers',
  'Support genuine and quality-focused vendors',
  'Organize India\'s growing aquarium market',
  'Build a trusted community for aquarists across the country',
];

const values = [
  {
    title: 'Trust first',
    description: 'We want every buyer and seller to feel safe using the platform.',
    icon: ShieldCheck,
  },
  {
    title: 'For hobbyists',
    description: 'NeoBlue is designed around how aquarium enthusiasts actually shop and learn.',
    icon: Fish,
  },
  {
    title: 'Community led',
    description: 'The platform grows with the people who use it every day.',
    icon: Users,
  },
  {
    title: 'Quality focused',
    description: 'We elevate genuine vendors and reliable aquarium products.',
    icon: Sparkles,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-sky-100/70 via-white to-white" />
        <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <p className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.35em] text-blue-700 shadow-sm backdrop-blur">
                About NeoBlue
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-blue-950 sm:text-5xl lg:text-6xl">
                Building India&apos;s trusted aquarium ecosystem.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                NeoBlue is a platform built for aquarium enthusiasts, bringing essential aqua services under one roof while growing India&apos;s largest aquarist community.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
                >
                  Explore Products
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                  Read the Blog
                </Link>
              </div>
            </div>

            <div className="relative rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-4">
                {highlights.map((item, index) => (
                  <div
                    key={item}
                    className={`rounded-2xl p-4 shadow-sm ring-1 ring-slate-200/70 ${index === 0 ? 'bg-blue-600 text-white' : index === 1 ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${index === 0 ? 'text-blue-100' : index === 1 ? 'text-blue-300' : 'text-blue-600'}`}>
                      {index === 2 ? 'Community' : 'Highlight'}
                    </p>
                    <p className="mt-3 text-sm font-bold leading-6">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-linear-to-br from-blue-50 to-cyan-50 p-4 ring-1 ring-blue-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Fish className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Designed for the aqua hobby</p>
                    <p className="text-sm text-slate-600">A better way to browse, trust, and buy.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <article key={value.title} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-slate-900">{value.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{value.description}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Our Story</p>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Created to solve a real marketplace problem.</h2>
            <div className="mt-5 space-y-4 text-slate-600 leading-8">
              <p>
                NeoBlue started from a major problem in the aquarium industry: an unorganized and unreliable marketplace. Many hobbyists were being scammed by fake sellers and fraudulent social media pages that used unrealistic prices and false promotions to trap buyers.
              </p>
              <p>
                At the same time, we found genuine sellers who cared about quality and service but lacked a professional platform to reach customers. NeoBlue was created to connect both sides in one trusted space.
              </p>
            </div>
          </section>

          <aside className="rounded-4xl bg-slate-950 p-6 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.65)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-300">Our Mission</p>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
              {missionPoints.map((point) => (
                <li key={point} className="flex gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <span className="mt-2 h-2 w-2 rounded-full bg-blue-300" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <section className="mt-8 rounded-4xl bg-linear-to-r from-blue-600 via-cyan-600 to-slate-950 p-6 text-white shadow-[0_20px_60px_-35px_rgba(2,132,199,0.55)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-100">Our Vision</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                From a fragmented sector to a professionally managed ecosystem.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50/90 sm:text-base">
                NeoBlue is not just about buying and selling fish. We are building a complete community where aquarium lovers can explore, learn, connect, and grow together.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-100">What you get</p>
              <div className="mt-4 space-y-3 text-sm text-blue-50">
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>Trusted sellers</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>Curated fish and plants</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>Community-first experience</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-4xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Join the Community</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Explore, learn, connect, and grow with NeoBlue.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Shop Now
              </Link>
              <Link
                href="/blog"
                className="inline-flex h-11 items-center justify-center rounded-full border border-blue-200 px-6 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                Explore Blog
              </Link>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            Explore the NeoBlue platform and discover curated fish, plants, and aquarium essentials. Invest your money in the aquarium hobby, not in scammers.
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">NeoBlue</p>
        </section>
      </section>
    </main>
  );
}