import Link from "next/link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const resources = [
  ["WhatsApp setup guide", "/help/connect-whatsapp"],
  ["Campaign compliance", "/help/send-compliant-campaign"],
  ["Security", "/security"],
  ["Privacy", "/privacy-policy"]
];

export default function ResourcesPage() {
  return (
    <main className="bg-white text-[#2c243b]">
      <SiteHeader />
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="product-eyebrow">Resources</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">Practical guides, no noise.</h1>
          <div className="mt-10 space-y-5">
            {resources.map(([label, href]) => (
              <Link key={href} href={href} className="block border-t border-[#eadfed] pt-5 text-xl font-semibold text-[#2c243b] hover:text-[#b923ae]">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
