import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "Billing and usage",
    href: "/billing",
    description: "Review the 30-day trial, plan status, allowances, usage and invoices."
  },
  {
    title: "WhatsApp API",
    href: "/settings/integrations",
    description: "Manage the Meta Cloud API number, permanent token, webhook verification and AI reply mode."
  },
  {
    title: "Team access",
    href: "/settings/users",
    description: "Control who can view conversations, reply to contacts and launch campaigns."
  },
  {
    title: "Security",
    href: "/settings/security",
    description: "Review login protection, credential handling and access safeguards."
  }
];

export default function SettingsPage() {
  return (
    <div className="product-surface min-h-screen">
      <TopBar title="Settings" subtitle="Workspace access, WhatsApp connection, and security" />
      <div className="mx-auto max-w-[1500px] space-y-6 px-5 py-6 sm:px-8">
        <section className="border-b border-[var(--border)] pb-5"><p className="product-eyebrow">Client administration</p><h2 className="mt-2 text-2xl font-semibold">Workspace controls</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Each team member uses a personal password. Technical credentials remain protected inside AiFrogi and are never shown to workspace users.</p></section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => (
            <Card key={section.href} className="rounded-lg p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <p className="mt-2 min-h-16 text-sm leading-6 text-[var(--text-muted)]">{section.description}</p>
              <Link href={section.href} className="mt-4 inline-flex"><Button>Open</Button></Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
