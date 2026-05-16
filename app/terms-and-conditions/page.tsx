import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Terms & Conditions | NeoBlue',
  description: 'Read the NeoBlue terms and conditions for using the platform.',
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

export default function TermsAndConditionsPage() {
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
              Terms &amp; <br />
              <span className="text-[#60A5FA]">Conditions</span>
            </h1>
            <p className="text-blue-100 text-xs mt-4 leading-relaxed max-w-[65%]">
              These terms explain how you may use NeoBlue, what we provide, and the responsibilities that apply to customers and sellers.
            </p>
            <p className="text-blue-100 text-xs mt-3 leading-relaxed max-w-[65%]">
              Please review them carefully before placing an order or using the platform.
            </p>
          </div>

          <div className="absolute -right-5 top-6 z-20">
            <Image
              src="/illustrations/shield-check.svg"
              alt="Shield check"
              width={220}
              height={220}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </section>

        <div className="mx-5 -mt-14 relative z-20">
          <div className="bg-[#0B192C] rounded-3xl p-5 flex items-center justify-between shadow-xl">
            <div className="flex-1 pr-3">
              <h3 className="text-white font-bold text-[15px] mb-1.5">Platform Rules</h3>
              <p className="text-[#38BDF8] text-[11px] font-semibold mb-1">Fair use. Clear limits. Shared trust.</p>
              <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                We&apos;re committed to providing a safe and<br />trusted experience for every aquarist.
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/illustrations/box.svg"
                alt="Package box"
                width={72}
                height={72}
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="px-6 text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-4">
            Account and Usage
          </h2>

          <div className="mx-5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 flex gap-3">
            <div className="w-7 h-7 bg-[#EF4444] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm mt-0.5">!</div>
            <div>
              <h3 className="text-[#B91C1C] font-bold text-[13px] mb-1">Important Notice</h3>
              <p className="text-[#991B1B] text-[12px] leading-relaxed">
                By using NeoBlue, you agree to follow our platform rules and use the site only for lawful and intended purposes.
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
                  <h4 className="text-[#0F172A] font-bold text-[13px]">Eligibility</h4>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed mb-3">
                  You must be able to enter into a binding agreement under applicable law to use NeoBlue and place orders.
                </p>
                <p className="text-[#0F172A] text-[11px] font-bold mb-2">You agree to:</p>
                <ul className="space-y-1.5 mb-3">
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Provide accurate information</li>
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Keep your account credentials secure</li>
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Use the platform responsibly</li>
                </ul>
                <p className="text-[#64748B] text-[10px] leading-relaxed">
                  Any misuse, fraud, or suspicious activity may result in account restriction or cancellation.
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
                  <h4 className="text-[#0F172A] font-bold text-[13px]">Orders and Delivery</h4>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed mb-3">
                  Order acceptance is subject to stock availability, payment confirmation, and shipping feasibility.
                </p>
                <p className="text-[#0F172A] text-[11px] font-bold mb-2">We may cancel or adjust an order if:</p>
                <ul className="space-y-1.5 mb-3">
                  <li className="flex items-center gap-2 text-[11px] text-[#334155] font-medium"><CheckIcon /> Products are unavailable</li>
                  <li className="flex items-start gap-2 text-[11px] text-[#334155] font-medium leading-tight"><CheckIcon /> Delivery cannot be completed safely</li>
                </ul>
                <p className="text-[#64748B] text-[10px] leading-relaxed">
                  Live aquatic shipments depend on transit conditions, so delivery timelines may vary.
                </p>
              </div>
            </div>

            <div className="mx-5 flex gap-4 items-start">
              <div className="w-14 shrink-0 flex flex-col items-center pt-1">
                <Image
                  src="/illustrations/wallet.svg"
                  alt="Wallet"
                  width={56}
                  height={56}
                  className="object-contain drop-shadow"
                />
              </div>
              <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#005AE0] text-white text-[10px] font-bold px-2 py-0.5 rounded">03</span>
                  <h4 className="text-[#0F172A] font-bold text-[13px]">Payment and Refunds</h4>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed mb-3">
                  Payments must be completed through the available checkout methods shown on the site.
                </p>
                <p className="text-[#64748B] text-[10px] leading-relaxed">
                  Refund eligibility is governed by the Return &amp; Refund Policy and may require proof such as unboxing video evidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="px-6 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-2">
                Restrictions
              </h2>
              <p className="text-[#0F172A] text-[13px] font-bold leading-snug">
                Certain actions are not allowed<br />on the platform.
              </p>
            </div>
            <Image
              src="/illustrations/clock.svg"
              alt="Clock"
              width={72}
              height={72}
              className="object-contain drop-shadow shrink-0"
            />
          </div>

          <div className="mx-5 mt-6 bg-[#F5F8FF] rounded-3xl p-5">
            <h3 className="text-[#0F172A] font-bold text-[13px] mb-4">Prohibited Uses</h3>
            <div className="space-y-3">
              {[
                'Using fake identities or false payment details',
                'Attempting to disrupt or exploit the website',
                'Uploading harmful, abusive, or misleading content',
                'Copying or redistributing platform content without permission',
              ].map((text, index) => (
                <div key={text} className="bg-white rounded-2xl p-3.5 flex items-center gap-4 shadow-sm border border-gray-50">
                  <div className="w-11 h-11 shrink-0 bg-[#F0F5FF] rounded-xl flex items-center justify-center text-[#005AE0] border border-[#E0EAFF]">
                    <span className="text-sm font-bold">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="text-[#0F172A] text-[12px] font-bold leading-tight pr-2">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-5 mt-6 bg-[#FEF2F2] rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-[#DC2626] font-bold text-[14px] mb-2 relative z-10">Violation = Action</h3>
            <p className="text-[#991B1B] text-[12px] mb-4 relative z-10">
              We may suspend access, cancel orders, or take other appropriate action if these terms are violated.
            </p>
            <ul className="space-y-3 relative z-10 w-[80%]">
              <li className="flex items-start gap-2 text-[11px] text-[#7F1D1D] font-medium leading-tight"><CrossIcon /> Fraudulent orders are not permitted</li>
              <li className="flex items-start gap-2 text-[11px] text-[#7F1D1D] font-medium leading-tight"><CrossIcon /> Abuse of support or delivery systems may lead to restrictions</li>
            </ul>
          </div>

          <div className="mx-5 mt-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <h3 className="text-[#0F172A] font-bold text-[14px] mb-3 relative z-10">Final Note</h3>
            <p className="text-[#64748B] text-[11px] leading-relaxed mb-4 relative z-10">
              By continuing to use NeoBlue, you acknowledge that you have read and agree to these Terms &amp; Conditions.
            </p>
            <p className="text-[#64748B] text-[11px] leading-relaxed relative z-10">
              We may update these terms from time to time, and continued use of the platform means you accept the updated version.
            </p>
            <div className="absolute -right-4 bottom-4 z-0 opacity-90">
              <Image
                src="/illustrations/shield-check.svg"
                alt="Shield check"
                width={140}
                height={140}
                className="object-contain drop-shadow-xl"
              />
            </div>
          </div>

          <div className="mx-5 mt-8 mb-10 pl-2">
            <p className="font-serif italic text-[#0F172A] text-[20px] leading-tight">
              Thank you for trusting<br />NeoBlue.
            </p>
            <p className="text-[#005AE0] font-bold text-[12px] mt-3">— NeoBlue Team</p>
          </div>
        </section>
      </div>
    </main>
  );
}