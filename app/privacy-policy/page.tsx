import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | NeoBlue',
  description: 'Read how NeoBlue collects, uses, and safeguards customer information.',
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

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-4xl bg-white p-8 shadow-sm ring-1 ring-slate-200/70 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-600">Privacy Policy</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-blue-950 sm:text-5xl">Protecting your information.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            At NeoBlue, we value your privacy and are committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data when you use our platform.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl bg-blue-50 p-6">
              <h2 className="text-lg font-bold text-blue-950">Information We Collect</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {informationWeCollect.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl bg-slate-950 p-6 text-white">
              <h2 className="text-lg font-bold">How We Use Your Information</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                {howWeUseData.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-blue-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="text-lg font-bold text-blue-950">Data Protection</h2>
              <p className="mt-3 leading-8 text-slate-600">
                We do not sell your personal information to third parties. Your data is stored securely using industry-standard protection methods, and we take appropriate measures to prevent unauthorized access or misuse.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-blue-950">Cookies</h2>
              <p className="mt-3 leading-8 text-slate-600">
                NeoBlue may use cookies and similar technologies to enhance user experience, remember preferences and settings, and analyze website traffic and usage patterns. You can manage or disable cookies through your browser settings.
              </p>
            </section>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="text-lg font-bold text-blue-950">Third-Party Services</h2>
              <p className="mt-3 leading-8 text-slate-600">
                Some services on NeoBlue may involve trusted third-party providers for payments, analytics, or delivery support. These providers only access information necessary to perform their services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-blue-950">Contact Us</h2>
              <p className="mt-3 leading-8 text-slate-600">
                If you have any questions or concerns regarding this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                <p>Email: [Your Email Address]</p>
                <p>Website: [Your Website URL]</p>
              </div>
            </section>
          </div>

          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">NeoBlue — Building a trusted aquarium community for India.</p>
        </div>
      </section>
    </main>
  );
}