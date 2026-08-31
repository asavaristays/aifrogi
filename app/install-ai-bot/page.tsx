import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "How to Install an AI Business Bot | AiFrogi",
  description: "Install an AiFrogi AI Bot yourself or send one simple onboarding Excel file for assisted setup.",
  path: "/install-ai-bot"
});

const selfServeSteps = [
  "Choose your AI Bot and start the 15-day trial.",
  "Complete the online business information and approved knowledge.",
  "Review the bot preview and confirm its answers.",
  "Copy the supplied website code or use the shareable bot link."
];

const assistedSteps = [
  "Download and complete one simple Excel file.",
  "Email it with approved brochures or documents to info@aifrogi.com.",
  "AiFrogi prepares the bot and sends you a preview for approval.",
  "We provide the website code, WordPress code or shareable link."
];

export default function InstallAiBotPage() {
  return <main className="bg-[#fbfaf7] text-[#101010]"><SiteHeader />
    <section className="relative overflow-hidden bg-[#050505] px-5 py-20 text-white sm:px-8 sm:py-28"><div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(226,198,109,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(226,198,109,.08)_1px,transparent_1px)] [background-size:76px_76px]" /><div className="relative mx-auto max-w-7xl text-center"><p className="product-eyebrow text-[#e2c66d]">Simple AI Bot onboarding</p><h1 className="mx-auto mt-5 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-7xl">Install yourself—or let AiFrogi assist you.</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/65">Choose one clear route. Both include approved knowledge, a bot preview and controlled go-live. No technical experience is required.</p></div></section>

    <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
      <OnboardingPath eyebrow="Option 1 · Self-serve" title="Set up online" copy="Best when you want to create and install the bot yourself." steps={selfServeSteps} primary={{ label: "Start 15-day trial", href: "https://app.aifrogi.com/register?source=install-ai-bot" }} />
      <OnboardingPath featured eyebrow="Option 2 · AiFrogi assisted" title="Send one Excel file" copy="Best when you want our team to prepare the first bot for you." steps={assistedSteps} primary={{ label: "Download onboarding Excel", href: "/downloads/AiFrogi-Simple-AI-Bot-Onboarding.xlsx", download: true }} secondary={{ label: "Email completed file", href: "mailto:info@aifrogi.com?subject=Completed%20AI%20Bot%20Onboarding%20File" }} />
    </div></section>

    <section className="border-y border-black/10 bg-white px-5 py-14 sm:px-8"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[.8fr_1.2fr] md:items-center"><div><p className="product-eyebrow">Only prepare these basics</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">Keep the first setup focused.</h2></div><div className="grid gap-3 text-sm text-[#5f5f5f] sm:grid-cols-2">{["Business name and contact", "Website and Google location", "Products or services", "Five common questions and answers", "Human handover contact", "Approved pages or documents"].map((item) => <p key={item} className="flex items-center gap-3 rounded-xl bg-[#fbfaf7] px-4 py-3"><span className="text-[#8a6a16]">✓</span><span>{item}</span></p>)}</div></div></section>

    <section className="bg-[#101010] px-5 py-16 text-white sm:px-8"><div className="mx-auto max-w-7xl"><p className="product-eyebrow text-[#e2c66d]">What you receive</p><div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{[["Bot preview", "Test real answers before launch."], ["Website code", "Simple JavaScript for most websites."], ["WordPress option", "Paste into a Custom HTML or footer-code area."], ["Shareable link", "Use the same bot without a website."]].map(([title, copy]) => <article key={title} className="border-t border-[#8a6a16] pt-5"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/58">{copy}</p></article>)}</div><p className="mt-10 text-sm text-white/50">Do not send passwords, OTPs, payment details, API keys or private customer data. Connector access is handled separately when required.</p></div></section>
    <SiteFooter />
  </main>;
}

function OnboardingPath({ eyebrow, title, copy, steps, primary, secondary, featured = false }: { eyebrow: string; title: string; copy: string; steps: string[]; primary: { label: string; href: string; download?: boolean }; secondary?: { label: string; href: string }; featured?: boolean }) {
  return <article className={`flex flex-col rounded-3xl border p-7 sm:p-9 ${featured ? "border-[#8a6a16] bg-[#101010] text-white shadow-[0_24px_70px_rgba(138,106,22,.16)]" : "border-black/10 bg-white"}`}><p className={`text-xs uppercase tracking-[.18em] ${featured ? "text-[#e2c66d]" : "text-[#8a6a16]"}`}>{eyebrow}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">{title}</h2><p className={`mt-4 leading-7 ${featured ? "text-white/60" : "text-[#68645c]"}`}>{copy}</p><ol className={`mt-8 flex-1 space-y-4 border-t pt-6 ${featured ? "border-white/12" : "border-black/10"}`}>{steps.map((step, index) => <li key={step} className="flex gap-4"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${featured ? "bg-[#8a6a16] text-white" : "bg-[#f3e5b5] text-[#6d5310]"}`}>{index + 1}</span><span className={`text-sm leading-6 ${featured ? "text-white/78" : "text-[#404040]"}`}>{step}</span></li>)}</ol><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href={primary.href} download={primary.download} className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#8a6a16] px-6 text-center text-sm font-semibold text-white">{primary.label}</Link>{secondary ? <Link href={secondary.href} className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#b28728] px-6 text-center text-sm font-semibold text-[#e2c66d]">{secondary.label}</Link> : null}</div></article>;
}
