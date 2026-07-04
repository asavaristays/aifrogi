import type { Metadata } from "next";
import { OnboardingJourney } from "@/components/marketing/onboarding-journey";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "WhatsApp Business API Onboarding | AiFrogi",
  description: "See WhatsApp onboarding prerequisites, Meta business verification, number approval, expected timing, go-live checks, and guided support.",
  path: "/onboarding-process"
});

export default function OnboardingProcessPage() {
  return (
    <main className="bg-white text-[#2c243b]">
      <SiteHeader />
      <section className="bg-[#2c243b] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="product-eyebrow text-[#ff8af1]">Onboarding</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">From SIM readiness to first workflow live.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/64">AiFrogi guides the Meta access flow and keeps the post-approval timeline visible.</p>
        </div>
      </section>
      <OnboardingJourney />
      <SiteFooter />
    </main>
  );
}
