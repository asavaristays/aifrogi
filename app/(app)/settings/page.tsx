import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountCredentialsCard } from "@/components/settings/account-credentials-card";
import { readCredentialSettings } from "@/lib/credential-store";

const sections = [
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

export default async function SettingsPage() {
  const credentials = await readCredentialSettings();

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f1fbf5_0%,#ffffff_50%,#eef8f5_100%)]">
      <TopBar title="Settings" subtitle="WhatsApp API, account access and security" />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border border-[#25d366]/15 bg-[linear-gradient(135deg,#2c243b,#c725ba)] p-7 text-white shadow-[0_24px_60px_rgba(12,74,62,0.18)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7ff0ae]">AiFrogi</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">WhatsApp control center</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
            Only settings required to operate the WhatsApp API platform are shown here.
          </p>
        </Card>

        <AccountCredentialsCard
          initialUsername={credentials.username}
          initialPassword={credentials.password}
          initialLabel={credentials.label}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.href} className="p-6 shadow-[0_16px_45px_rgba(15,61,53,0.07)]">
              <h3 className="text-xl font-black">{section.title}</h3>
              <p className="mt-3 min-h-16 text-sm leading-6 text-[var(--text-muted)]">{section.description}</p>
              <Link href={section.href} className="mt-5 inline-flex"><Button>Open</Button></Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
