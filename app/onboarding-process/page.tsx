import { OnboardingJourney } from "@/components/marketing/onboarding-journey";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function OnboardingProcessPage() {
  return (
    <main className="bg-white text-[#2c243b]">
      <SiteHeader />
      <section className="bg-[#2c243b] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="product-eyebrow text-[#ff8af1]">Onboarding</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">From SIM readiness to first workflow live.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/64">AiFrogi handholds the Meta Tech Provider process and keeps the post-approval timeline visible.</p>
        </div>
      </section>
      <OnboardingJourney />
      <SiteFooter />
    </main>
  );
}
