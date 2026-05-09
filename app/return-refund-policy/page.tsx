import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | NeoBlue',
  description: 'Read the NeoBlue return and refund policy for aquatic fish and plants.',
};

const refundGuidelines = [
  'Record a complete unboxing video immediately after receiving the parcel.',
  'The video must start before opening the parcel and continue without cuts, edits, pauses, or interruptions.',
  'The video must clearly show the package condition and contents.',
];

export default function ReturnRefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-[2rem] bg-gradient-to-br from-blue-600 to-slate-950 p-8 text-white shadow-xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-100">Return & Refund Policy</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Clear rules for live aquatic products.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-blue-50 sm:text-lg">
            At NeoBlue, we strongly encourage all customers to carefully read and understand our Return & Refund Policy. Our goal is to maintain transparency and avoid misunderstandings or disputes between NeoBlue, sellers, and customers.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-rose-100 bg-rose-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-700">Important Notice</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">Currently, NeoBlue does not offer returns for aquatic fishes or aquatic plants.</h2>
            <p className="mt-4 leading-8 text-slate-700">
              Live products require specialized packing, oxygen management, temperature monitoring, and proper handling during transit. Because we do not yet have access to a specialized live-aquatic return logistics network, returns are not possible at this time.
            </p>
          </section>

          <section className="rounded-3xl bg-slate-950 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-300">Why We Do Not Accept Returns</p>
            <ol className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
              <li><span className="font-semibold text-white">1. Live Product Nature:</span> These are live animals and plants, not standard e-commerce items.</li>
              <li><span className="font-semibold text-white">2. Logistics Limitations:</span> Deliveries are currently handled through courier aggregators and physical bookings based on availability.</li>
              <li><span className="font-semibold text-white">3. Wrong Product Concerns:</span> In the rare case of an incorrect item, our support team will review the issue and provide an appropriate resolution.</li>
            </ol>
          </section>
        </div>

        <section className="mt-10 rounded-3xl bg-blue-50 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-700">Refund Policy</p>
          <h2 className="mt-3 text-xl font-bold text-slate-900">Unboxing video is compulsory for refund claims.</h2>
          <p className="mt-4 leading-8 text-slate-700">
            Refunds are only processed when all mandatory conditions are followed. Customers must record a complete unboxing video immediately after receiving the parcel from the courier office or delivery agent.
          </p>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Video Guidelines</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              {refundGuidelines.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-semibold text-rose-600">No video = no refund.</p>
          </div>
        </section>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-blue-950">Refund Processing Time</h2>
            <p className="mt-3 leading-8 text-slate-600">
              Approved refunds are generally processed within 5–7 business days depending on payment method and banking timelines.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-blue-950">Customer Responsibility After Delivery</h2>
            <p className="mt-3 leading-8 text-slate-600">
              Once the fish or plants are released into the tank or aquarium setup, NeoBlue and the seller are no longer responsible. Tank conditions, water quality, acclimatization, and care become the customer&apos;s responsibility.
            </p>
          </section>
        </div>

        <section className="mt-10 rounded-3xl bg-slate-950 px-6 py-8 text-white">
          <h2 className="text-lg font-bold">Final Note</h2>
          <p className="mt-3 leading-8 text-slate-300">
            By purchasing from NeoBlue, customers agree to this policy and acknowledge the unique nature of live aquatic product shipping.
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            NeoBlue — Building a safer and more trusted aquarium marketplace for India.
          </p>
        </section>
      </section>
    </main>
  );
}