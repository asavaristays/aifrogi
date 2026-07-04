import { Icon } from "@/components/icons";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { OnboardingJourney } from "@/components/marketing/onboarding-journey";
import { RotatingUseCase } from "@/components/marketing/rotating-use-case";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const loginUrl = "https://app.aifrogi.com/login";
const registerUrl = "https://app.aifrogi.com/register";

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-[#2c243b]">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[#2c243b] px-5 pb-0 pt-14 text-white sm:px-8 sm:pt-24">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#d92bcb]/20 blur-[130px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-[#ff8af1] shadow-[0_0_12px_#ff8af1]" />Meta Verified Tech Provider</p>
          <h1 className="mx-auto mt-7 max-w-5xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Turn WhatsApp conversations into <RotatingUseCase /></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/62 sm:text-xl">Messaging, campaigns, automation, and AI assistance in one workspace—with the context and human control your team needs.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3"><a href={registerUrl} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#d92bcb] px-6 text-sm font-bold text-white shadow-[0_0_34px_rgba(217,43,203,.25)] transition hover:-translate-y-0.5 hover:bg-[#e33bd4]">Start 30-day trial <Icon name="arrow-right" /></a></div>

          <FeatureShowcase />
        </div>
      </section>

      <section className="bg-[#2c243b] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-24"><p className="text-xs font-semibold text-[#ff8af1]">Knowledge with boundaries</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">AI answers from approved business truth.</h2><p className="mt-4 text-base leading-7 text-white/65">Connect a public website, review its topic coverage, define workspace instructions, protect sensitive topics, and preview answers before automation goes live.</p><a href={loginUrl} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d92bcb] px-4 text-sm font-semibold text-white">Open Knowledge workspace <Icon name="arrow-right" /></a></div>
          <div className="grid gap-3 sm:grid-cols-2"><DarkFeature title="Approved sources" copy="Public pages and approved documents become the only business reference." icon="file-text" /><DarkFeature title="Answer constitution" copy="Global safety and customer-specific behavior stay visible and controlled." icon="sparkles" /><DarkFeature title="Knowledge gaps" copy="Unanswered questions reveal exactly what information the business should add." icon="help-circle" /><DarkFeature title="Human handover" copy="Complaints, billing, legal, sensitive, and low-confidence requests reach a person." icon="message-circle" /></div>
        </div>
      </section>

      <OnboardingJourney />

      <section id="security" className="relative overflow-hidden bg-[#211a2d] px-5 py-20 text-white sm:px-8 sm:py-24">
        <div className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#d92bcb]/15 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff8af1]">Trust by design</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl">Your customer data stays inside clear boundaries.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62">AiFrogi connects through Meta&apos;s secure authorization flow, encrypts access credentials, and keeps every organization&apos;s data separated.</p>
            <a href="/security" className="group mt-8 inline-flex min-h-14 items-center gap-3 rounded-lg bg-[#d92bcb] px-6 text-sm font-bold text-white shadow-[0_0_38px_rgba(217,43,203,.3)] transition hover:-translate-y-0.5 hover:bg-[#e33bd4]">
              Review Data Security
              <Icon name="arrow-right" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/45">
              <a href="/privacy-policy" className="transition hover:text-white">Privacy policy</a>
              <a href="/data-deletion" className="transition hover:text-white">Data deletion</a>
              <a href="mailto:info@aifrogi.com" className="transition hover:text-white">Report a concern</a>
            </div>
          </div>

          <div className="border-y border-white/12">
            <SecurityControl icon="settings" title="No shared credentials" copy="Never share a Facebook password, email password, OTP, or permanent access token." />
            <SecurityControl icon="grid" title="Encrypted and separated" copy="Access secrets are encrypted at rest. Contacts, messages, and documents stay scoped to the correct workspace." />
            <SecurityControl icon="sparkles" title="AI stays controlled" copy="Approved knowledge, role-based access, confidence fallback, and human handover keep automation bounded." />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function DarkFeature({ title, copy, icon }: { title: string; copy: string; icon: "file-text" | "sparkles" | "help-circle" | "message-circle" }) { return <article className="rounded-md border border-white/10 bg-white/5 p-5"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/8 text-[#ff8af1]"><Icon name={icon} /></span><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/58">{copy}</p></article>; }
function SecurityControl({ icon, title, copy }: { icon: "settings" | "grid" | "sparkles"; title: string; copy: string }) { return <div className="grid gap-4 border-b border-white/12 py-6 last:border-b-0 sm:grid-cols-[48px_1fr] sm:items-start"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-[#ff8af1]"><Icon name={icon} className="h-5 w-5" /></span><div><h3 className="text-base font-bold">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{copy}</p></div></div>; }
