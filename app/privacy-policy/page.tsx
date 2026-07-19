import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Privacy Policy | NeoBlue',
  description: 'Read how NeoBlue collects, uses, and safeguards customer information.',
  alternates: {
    canonical: 'https://neoblue.in/privacy-policy',
  },
};

const informationWeCollect = [
  'Name and contact details such as email address',
  'Shipping and billing address',
  'Account registration information',
  'Usage data and interaction with our platform',
  'Basic device and browser information',
];

const howWeUseData = [
  'Provide and improve our services',
  'Personalize your experience on NeoBlue',
  'Recommend relevant products and content',
  'Communicate important updates, offers, and support',
  'Maintain platform security and performance',
];

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

export default function PrivacyPolicyPage() {
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
              Privacy &amp; <br />
              <span className="text-[#60A5FA]">Policy</span>
            </h1>
            <p className="text-white text-sm mt-4 leading-relaxed max-w-[65%]">
              At NeoBlue, we value your privacy and are committed to protecting your personal information.
            </p>
            <p className="text-white text-sm mt-3 leading-relaxed max-w-[65%]">
              This policy explains how we collect, use, and safeguard your data when you use our platform.
            </p>
          </div>

          <div className="absolute -right-5 top-6 z-20">
            <Image
              src="https://png.pngtree.com/png-clipart/20250103/original/pngtree-3d-happy-fish-cartoon-art-png-image_20060231.png"
              alt="Security shield"
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
              <h3 className="text-white font-bold text-[15px] mb-1.5">Our Commitment</h3>
              <p className="text-slate-900 text-sm font-semibold mb-1">Privacy. Security. Trust.</p>
              <p className="text-slate-900 text-sm leading-relaxed">
                We're committed to providing a safe and<br />trusted experience for every aquarist.
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/illustrations/wallet.svg"
                alt="Wallet"
                width={72}
                height={72}
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="px-6 text-[#005AE0] text-[11px] font-bold uppercase tracking-widest mb-4">
            Information We Collect
          </h2>

          <div className="mx-5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 flex gap-3">
            <div className="w-7 h-7 bg-[#EF4444] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm mt-0.5">!</div>
            <div>
              <h3 className="text-[#B91C1C] font-bold text-base mb-1">Important Notice</h3>
              <p className="text-[#991B1B] text-sm leading-relaxed">
                We collect only the information needed to operate the platform, fulfill orders, and support customers.
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
                  <span className="bg-[#005AE0] text-white text-xs font-bold px-2 py-0.5 rounded">01</span>
                  <h4 className="text-[#0F172A] font-bold text-base">Data We Collect</h4>
                </div>
                <p className="text-[#0F172A] text-sm leading-relaxed mb-3">
                  We may collect information you provide directly, such as account details and shipping information, along with basic technical data.
                </p>
                <p className="text-[#0F172A] text-sm font-bold mb-2">This may include:</p>
                <ul className="space-y-1.5 mb-3">
                  {informationWeCollect.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[#0F172A] font-medium"><CheckIcon /> {item}</li>
                  ))}
                </ul>
                <p className="text-[#0F172A] text-sm leading-relaxed">
                  We do not collect more than we need to provide services and keep the platform running securely.
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
                  <span className="bg-[#005AE0] text-white text-xs font-bold px-2 py-0.5 rounded">02</span>
                  <h4 className="text-[#0F172A] font-bold text-base">How We Use Data</h4>
                </div>
                <p className="text-[#0F172A] text-sm leading-relaxed mb-3">
                  Your information helps us process orders, support your account, improve the platform, and deliver important updates.
                </p>
                <p className="text-[#0F172A] text-sm font-bold mb-2">We use data to:</p>
                <ul className="space-y-1.5 mb-3">
                  {howWeUseData.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#0F172A] font-medium leading-tight"><CheckIcon /> {item}</li>
                  ))}
                </ul>
                <p className="text-[#0F172A] text-sm leading-relaxed">
                  We only use your data for the purposes described in this policy and related platform operations.
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
                  <span className="bg-[#005AE0] text-white text-xs font-bold px-2 py-0.5 rounded">03</span>
                  <h4 className="text-[#0F172A] font-bold text-base">Data Protection</h4>
                </div>
                <p className="text-[#0F172A] text-sm leading-relaxed mb-3">
                  We use reasonable technical and organizational safeguards to help protect your information from unauthorized access or misuse.
                </p>
                <p className="text-[#0F172A] text-sm leading-relaxed">
                  We do not sell personal information to third parties.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="px-6 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-[#005AE0] text-sm font-bold uppercase tracking-widest mb-2">
                Cookies and Sharing
              </h2>
              <p className="text-[#0F172A] text-base font-bold leading-snug">
                Some features rely on cookies and trusted third parties.
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
            <h3 className="text-[#0F172A] font-bold text-base mb-4">Cookies and Third Parties</h3>
            <div className="space-y-3">
              {[
                'Cookies help remember preferences and improve your experience',
                'Analytics may be used to understand platform performance',
                'Payment and delivery partners only receive the data needed to perform their service',
              ].map((text, index) => (
                <div key={text} className="bg-white rounded-2xl p-3.5 flex items-center gap-4 shadow-sm border border-gray-50">
                  <div className="w-11 h-11 shrink-0 bg-[#F0F5FF] rounded-xl flex items-center justify-center text-[#005AE0] border border-[#E0EAFF]">
                    <span className="text-base font-bold">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="text-[#0F172A] text-sm font-bold leading-tight pr-2">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-5 mt-6 bg-[#FEF2F2] rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-[#DC2626] font-bold text-base mb-2 relative z-10">Your Rights</h3>
            <p className="text-[#991B1B] text-sm mb-4 relative z-10">
              You can manage some browser-based settings like cookies directly from your browser.
            </p>
            <ul className="space-y-3 relative z-10 w-[84%]">
              <li className="flex items-start gap-2 text-sm text-[#7F1D1D] font-medium leading-tight"><CrossIcon /> Disabling cookies may affect how some parts of the site work</li>
              <li className="flex items-start gap-2 text-sm text-[#7F1D1D] font-medium leading-tight"><CrossIcon /> We may still retain data required for legal, security, or order-processing reasons</li>
            </ul>
          </div>

          <div className="mx-5 mt-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <h3 className="text-[#0F172A] font-bold text-base mb-3 relative z-10">Contact Us</h3>
            <p className="text-[#0F172A] text-sm leading-relaxed mb-4 relative z-10">
              If you have any questions or concerns regarding this Privacy Policy, please contact us through the support channels available on the site.
            </p>
            <p className="text-[#0F172A] text-sm leading-relaxed relative z-10">
              We may update this policy from time to time, and continued use of NeoBlue means you accept the updated version.
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
            <p className="font-serif italic text-[#0F172A] text-[24px] leading-tight">
              Thank you for trusting<br />NeoBlue.
            </p>
            <p className="text-[#005AE0] font-bold text-sm mt-3">— NeoBlue Team</p>
          </div>
        </section>
      </div>
    </main>
  );
}