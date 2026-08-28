import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Return & Refund Policy: Live Arrival Claim Rules',
  description: 'Understand NeoBlue return, live arrival guarantee (DOA), and refund procedures for live fish and plants.',
  alternates: {
    canonical: 'https://neoblue.in/return-refund-policy',
  },
};

const CheckIcon = () => (
  <svg className="w-4 h-4 text-[#005AE0] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const CrossIcon = () => (
  <svg className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

export default function ReturnRefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F4F7FB] font-sans pb-10 selection:bg-[#005AE0] selection:text-white flex justify-center">
      <div className="w-full max-w-md bg-[#F4F7FB] relative overflow-hidden shadow-2xl">
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
              Legal
            </span>
            <h1 className="text-white text-[32px] font-extrabold mt-6 leading-[1.1] tracking-tight">
              Return &amp; <br />
              <span className="text-[#60A5FA]">Refund Policy</span>
            </h1>
            <p className="text-blue-100 text-xs mt-4 leading-relaxed max-w-[65%]">
              At NeoBlue, we strongly encourage all customers to carefully read and understand our Return &amp; Refund Policy.
            </p>
            <p className="text-blue-100 text-xs mt-3 leading-relaxed max-w-[65%]">
              Our goal is to maintain transparency and avoid misunderstandings or disputes between NeoBlue, sellers, and customers.
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

        <div className="mx-5 -mt-14 relative z-20">
          <div className="bg-[#0B192C] rounded-3xl p-5 flex items-center justify-between shadow-xl">
            <div className="flex-1 pr-3">
              <h3 className="text-white font-bold text-[15px] mb-1.5">Our Commitment</h3>
              <p className="text-[#38BDF8] text-[11px] font-semibold mb-1">Transparency. Fairness. Trust.</p>
              <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                We&apos;re committed to providing a safe and<br />
                trusted experience for every aquarist.
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

        <section className="mt-10">
          <h2 className="px-6 text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-4">
            Returns Policy
          </h2>

          <div className="mx-5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 flex gap-3">
            <div className="w-7 h-7 bg-[#EF4444] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm mt-0.5">!</div>
            <div>
              <h3 className="text-[#B91C1C] font-bold text-[13px] mb-1">Important Notice</h3>
              <p className="text-[#991B1B] text-[12px] leading-relaxed">
                Currently, NeoBlue does not offer returns for aquatic fishes and aquatic plants.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="mx-5 flex gap-4 items-start">
              <div className="w-14 shrink-0 flex flex-col items-center pt-1">
                <Image
                  src="/illustrations/fish-bag.svg"
                  alt="Fish bag"
                  width={56}
                  height={56}
                  className="object-contain drop-shadow"
                />
              </div>
              <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#005AE0] text-white text-[10px] font-bold px-2 py-0.5 rounded">01</span>
                  <h4 className="text-[#0F172A] font-bold text-[13px]">Live Product Nature</h4>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed mb-3">
                  The products we sell are live aquatic animals and plants, unlike regular e-commerce items such as clothes or shoes.
                </p>
                <p className="text-[#0F172A] text-[11px] font-bold mb-2">Shipping live fish requires:</p>
                <ul className="space-y-1.5 mb-3">
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Specialized packing methods</li>
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Oxygen management</li>
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Temperature monitoring</li>
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Proper handling during transit</li>
                </ul>
                <p className="text-[#64748B] text-[10px] leading-relaxed">
                  If these conditions are not maintained correctly during return shipping, it may lead to stress, injury, or death of the fish. For this reason, returns are currently not possible.
                </p>
              </div>
            </div>

            <div className="mx-5 flex gap-4 items-start">
              <div className="w-14 shrink-0 flex flex-col items-center pt-1">
                <Image
                  src="/illustrations/truck.svg"
                  alt="Delivery truck"
                  width={56}
                  height={56}
                  className="object-contain drop-shadow"
                />
              </div>
              <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#005AE0] text-white text-[10px] font-bold px-2 py-0.5 rounded">02</span>
                  <h4 className="text-[#0F172A] font-bold text-[13px]">Logistics Limitations</h4>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed mb-3">
                  At present, we do not have access to a specialized live-aquatic return logistics network.
                </p>
                <p className="text-[#0F172A] text-[11px] font-bold mb-2">Currently, deliveries are handled through:</p>
                <ul className="space-y-1.5 mb-3">
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Courier aggregators</li>
                  <li className="flex items-start gap-2 text-[11px] text-[#334155] font-medium leading-tight">
                    <CheckIcon /> Physical bookings based on availability and convenience
                  </li>
                </ul>
                <p className="text-[#64748B] text-[10px] leading-relaxed">
                  Until a proper logistics system for live returns is available, NeoBlue cannot provide a return option.
                </p>
              </div>
            </div>

            <div className="mx-5 flex gap-4 items-start">
              <div className="w-14 shrink-0 flex flex-col items-center pt-1">
                <Image
                  src="/illustrations/box.svg"
                  alt="Package box"
                  width={56}
                  height={56}
                  className="object-contain drop-shadow"
                />
              </div>
              <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#005AE0] text-white text-[10px] font-bold px-2 py-0.5 rounded">03</span>
                  <h4 className="text-[#0F172A] font-bold text-[13px]">Wrong Product Concerns</h4>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed mb-3">
                  NeoBlue and our sellers follow a strict product verification and checking process to minimize mistakes.
                </p>
                <p className="text-[#64748B] text-[10px] leading-relaxed">
                  In the rare case that you receive an incorrect item, our support team will review the issue and provide an appropriate resolution without unnecessary complications.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="px-6 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-2">
                Refund Policy
              </h2>
              <p className="text-[#0F172A] text-[13px] font-bold leading-snug">
                Refunds are only processed when<br />all mandatory conditions are followed.
              </p>
            </div>
            <Image
              src="/illustrations/wallet.svg"
              alt="Wallet"
              width={72}
              height={72}
              className="object-contain drop-shadow shrink-0"
            />
          </div>

          <div className="mx-5 mt-6 bg-[#F5F8FF] rounded-3xl p-5">
            <h3 className="text-[#0F172A] font-bold text-[13px] mb-4">Mandatory Requirement for Refund Claims</h3>
            <div className="flex gap-4">
              <div className="w-22.5 shrink-0">
                <div className="bg-[#0B192C] rounded-2xl overflow-hidden shadow-lg" style={{ width: 90, height: 160 }}>
                  <div className="bg-[#1A2942] h-5 flex items-center justify-center">
                    <div className="w-12 h-1 bg-white/20 rounded-full" />
                  </div>
                  <div className="relative h-25 bg-linear-to-b from-[#0d2137] to-[#0a1a2e] flex items-center justify-center">
                    <div className="w-10 h-10 bg-[#005AE0] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 h-1.5 bg-white/10 rounded-full">
                      <div className="h-full w-1/3 bg-[#005AE0] rounded-full" />
                    </div>
                  </div>
                  <div className="px-2 py-2 space-y-1.5">
                    <div className="flex gap-1">
                      <span className="text-[7px] bg-[#1E3A5F] text-[#60A5FA] px-1.5 py-0.5 rounded font-medium">Parcel is damaged</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-[7px] bg-[#1E3A5F] text-[#F87171] px-1.5 py-0.5 rounded font-medium">Fish arrive dead</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-[7px] bg-[#1E3A5F] text-[#60A5FA] px-1.5 py-0.5 rounded font-medium">Packaging issues</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-[#0F172A] font-bold text-[12px] mb-1">Unboxing Video is Compulsory</h4>
                <p className="text-[#64748B] text-[10px] leading-relaxed mb-2">
                  Customers must record a complete unboxing video immediately after receiving the parcel from the courier office or delivery agent.
                </p>
                <p className="text-[#64748B] text-[10px] leading-relaxed mb-3">
                  Most parcels are delivered within 3-5 days, and the unboxing video serves as proof in case:
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-[9px] bg-blue-50 text-[#005AE0] px-2 py-0.5 rounded border border-blue-100 font-medium">Parcel is damaged</span>
                  <span className="text-[9px] bg-red-50 text-[#EF4444] px-2 py-0.5 rounded border border-red-100 font-medium">Fish arrive dead or unhealthy</span>
                  <span className="text-[9px] bg-blue-50 text-[#005AE0] px-2 py-0.5 rounded border border-blue-100 font-medium">Packaging issues are found</span>
                </div>
                <p className="text-[#64748B] text-[10px] leading-relaxed">
                  This video helps our team analyze the issue and process a fair resolution.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-5 mt-8">
            <h3 className="text-[#0F172A] font-bold text-[15px] mb-1">Important Video Guidelines</h3>
            <p className="text-[#64748B] text-[12px] mb-4">The unboxing video must:</p>

            <div className="space-y-3">
              {[
                { icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z', text: 'Start before opening the parcel' },
                { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', text: 'Be recorded continuously' },
                { icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z', text: 'Have no cuts, edits, pauses, or interruptions' },
                { icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', text: 'Clearly show the package condition and contents' },
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
          </div>

          <div className="mx-5 mt-6 bg-[#FEF2F2] rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-[#DC2626] font-bold text-[14px] mb-2 relative z-10">No Video = No Refund</h3>
            <p className="text-[#991B1B] text-[12px] mb-4 relative z-10">
              If you do not provide a proper<br />unboxing video:
            </p>
            <ul className="space-y-3 relative z-10 w-[68%]">
              <li className="flex items-start gap-2 text-[11px] text-[#7F1D1D] font-medium leading-tight">
                <CrossIcon /> No refund will be issued
              </li>
              <li className="flex items-start gap-2 text-[11px] text-[#7F1D1D] font-medium leading-tight">
                <CrossIcon /> Random photos or partially recorded videos will not be accepted
              </li>
              <li className="flex items-start gap-2 text-[11px] text-[#7F1D1D] font-medium leading-tight">
                <CrossIcon /> Already opened package videos are not considered valid proof
              </li>
            </ul>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
              <Image
                src="/illustrations/video-camera.svg"
                alt="Camera"
                width={90}
                height={90}
                className="object-contain drop-shadow-lg opacity-80"
              />
            </div>
          </div>

          <div className="mx-5 mt-6 bg-[#F5F8FF] rounded-3xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-[#0F172A] font-bold text-[13px] mb-1">Refund Processing Time</h3>
              <p className="text-[#64748B] text-[11px] mb-4">Approved refunds are generally<br />processed within:</p>
              <div className="text-[#005AE0] text-[44px] font-extrabold leading-none mb-1 tracking-tighter">5-7</div>
              <div className="text-[#0F172A] font-extrabold text-[14px]">Business Days</div>
              <p className="text-[#64748B] text-[9px] mt-2 leading-tight">
                depending on payment method<br />and banking timelines.
              </p>
            </div>
            <Image
              src="/illustrations/clock.svg"
              alt="Clock"
              width={100}
              height={100}
              className="object-contain drop-shadow-lg shrink-0"
            />
          </div>

          <div className="mx-5 mt-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <h3 className="text-[#0F172A] font-bold text-[14px] mb-3 relative z-10 w-[60%]">Customer Responsibility After Delivery</h3>
            <p className="text-[#64748B] text-[11px] leading-relaxed mb-4 relative z-10 w-[60%]">
              NeoBlue&apos;s responsibility is limited to safely delivering the parcel to the customer.
            </p>
            <p className="text-[#64748B] text-[11px] leading-relaxed mb-4 relative z-10 w-[60%]">
              Once the fish or plants are released into the tank or aquarium setup:
            </p>
            <ul className="space-y-2 relative z-10 w-[65%]">
              <li className="flex items-start gap-2 text-[11px] text-[#EF4444] font-medium leading-tight">
                <CrossIcon /> NeoBlue and the seller are no longer responsible
              </li>
              <li className="flex items-start gap-2 text-[11px] text-[#EF4444] font-medium leading-tight">
                <CrossIcon /> Tank conditions, water quality, acclimatization, and care become the customer&apos;s responsibility
              </li>
            </ul>
            <div className="absolute -right-4 bottom-4 z-0">
              <Image
                src="/illustrations/aquarium.svg"
                alt="Fish tank"
                width={140}
                height={140}
                className="object-contain drop-shadow-xl opacity-90"
              />
            </div>
          </div>

          <div className="mx-5 mt-6 bg-[#F5F8FF] rounded-3xl p-6 flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-[#0F172A] font-bold text-[14px] mb-2">Final Note</h3>
              <p className="text-[#64748B] text-[11px] leading-relaxed">
                By purchasing from NeoBlue, customers agree to this Return &amp; Refund Policy and acknowledge the unique nature of live aquatic product shipping.
              </p>
            </div>
            <Image
              src="/illustrations/shield-check.svg"
              alt="Shield check"
              width={70}
              height={70}
              className="object-contain drop-shadow shrink-0 mt-1"
            />
          </div>

          <div className="mx-5 mt-8 mb-10 pl-2">
            <p className="font-serif italic text-[#0F172A] text-[20px] leading-tight">
              Thank you for supporting<br />the aquarium hobby!
            </p>
            <p className="text-[#005AE0] font-bold text-[12px] mt-3">— NeoBlue Team</p>
          </div>
        </section>
      </div>
    </main>
  );
}
