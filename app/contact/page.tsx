import type { Metadata } from "next";
import { ContactMailForm } from "@/components/marketing/contact-mail-form";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Contact AiFrogi | Gurugram, Goa and Jodhpur",
  description: "Contact AiFrogi in Gurugram, Goa or Jodhpur for AI Business Bot sales, onboarding and support.",
  path: "/contact"
});

const offices = [
  { city: "Gurugram", address: "656 GF, Sector 40 Mohyal Colony, Gurgaon, Haryana 122003" },
  { city: "Goa", address: "H.No 746 – TF, New Wada, Morjim, Goa 403512" },
  { city: "Jodhpur", address: "J1-371 RIICO Sangaria, Industrial Area Phase IInd, Jodhpur, Rajasthan 342013" }
];

export default function ContactPage() {
  return (
    <main className="bg-white text-[#101010]">
      <SiteHeader />
      <section className="relative overflow-hidden bg-[#101010] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#8a6a16]/18 blur-[110px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Contact AiFrogi</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-6xl">Let’s make your customer journey intelligent.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">Talk to us about AI Bots, HotelGPT, onboarding, integrations or support.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="tel:+917410582898" className="inline-flex min-h-12 items-center rounded-lg bg-[#8a6a16] px-5 text-sm font-bold text-white transition hover:bg-[#b28728]">Call +91-7410582898</a>
            <a href="mailto:info@aifrogi.com" className="inline-flex min-h-12 items-center rounded-lg border border-white/18 px-5 text-sm font-bold text-white transition hover:border-[#e2c66d] hover:text-[#e2c66d]">info@aifrogi.com</a>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf7] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="product-eyebrow">Our offices</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Gurugram <span className="text-[#8a6a16]">|</span> Goa <span className="text-[#8a6a16]">|</span> Jodhpur</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {offices.map(office => <address key={office.city} className="not-italic border-t-2 border-[#8a6a16] bg-white px-5 py-6"><h3 className="text-xl font-bold">{office.city}</h3><p className="mt-4 min-h-18 text-sm leading-6 text-[var(--text-muted)]">{office.address}</p><div className="mt-5 space-y-2 border-t border-black/8 pt-4 text-sm"><p><a className="font-semibold text-[#6d5310] hover:underline" href="tel:+917410582898">+91-7410582898</a></p><p><a className="font-semibold text-[#6d5310] hover:underline" href="mailto:info@aifrogi.com">info@aifrogi.com</a></p></div></address>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div><p className="product-eyebrow">Send an enquiry</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Tell us what you need.</h2><p className="mt-5 max-w-md leading-7 text-[var(--text-muted)]">Share a short brief and your email app will prepare a message for our team. We’ll reply using the address you provide.</p></div>
          <ContactMailForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
