import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { loadAdminOrganizations } from "@/lib/services/onboarding-service";
import { getOnboardingGuidance, getTrialWindow } from "@/lib/onboarding-guidance";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCustomersPage() {
  const organizations = await loadAdminOrganizations();
  const subscriptionStates = new Map((await Promise.all(organizations.map(async (organization) => [organization.id, await getOrganizationSubscriptionAccess(organization.id)] as const))));
  const aiBotLive = organizations.filter((item) => item.botProfile?.status === "LIVE").length;
  const whatsappEnabled = organizations.filter((item) => item.botProfile?.channels?.includes("WHATSAPP")).length;
  const whatsappLive = organizations.filter((item) => item.botProfile?.channels?.includes("WHATSAPP") && item.onboarding?.metaStatus === "LIVE").length;
  const needsAifrogi = organizations.filter((item) => getOnboardingGuidance(item).owner === "AiFrogi").length;
  const paused = Array.from(subscriptionStates.values()).filter((state) => state?.paused).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6a16]">Super Admin</p>
          <h1 className="mt-2 text-3xl font-black">Customer onboarding</h1>
          <p className="mt-2 text-sm text-[#68645c]">Operate AI Bot and WhatsApp onboarding as two separate delivery tracks.</p>
        </div>
        <Badge tone="secondary">{organizations.length} companies</Badge>
      </div>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Companies" value={organizations.length} />
        <Metric label="AI Bots live" value={aiBotLive} />
        <Metric label="WhatsApp enabled" value={whatsappEnabled} />
        <Metric label="WhatsApp live" value={whatsappLive} />
        <Metric label="AiFrogi queue" value={needsAifrogi} />
        <Metric label="Trial paused" value={paused} />
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-black/6 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-[#f7faf8] text-xs uppercase tracking-[0.12em] text-[#68645c]">
              <tr><th className="px-5 py-4">Company</th><th className="px-5 py-4">AI Bot</th><th className="px-5 py-4">WhatsApp</th><th className="px-5 py-4">Next action</th><th className="px-5 py-4">Trial</th><th className="px-5 py-4 text-right">Open onboarding</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {organizations.map((organization) => {
                const guidance = getOnboardingGuidance(organization);
                const trial = getTrialWindow(organization);
                const hasWhatsApp = organization.botProfile?.channels?.includes("WHATSAPP") || false;
                return (
                  <tr key={organization.id}>
                    <td className="px-5 py-4"><strong className="block">{organization.name}</strong><span className="mt-1 block text-xs text-[#68645c]">{organization.ownerEmail}</span></td>
                    <td className="px-5 py-4"><strong className="block text-xs">{organization.botProfile?.personaName || "Not designed"}</strong><span className="mt-2 block"><Status value={organization.botProfile?.status || "DRAFT"} /></span></td>
                    <td className="px-5 py-4">{hasWhatsApp ? <Status value={organization.onboarding?.metaStatus || "NOT_STARTED"} /> : <Badge tone="neutral">NOT ENABLED</Badge>}</td>
                    <td className="px-5 py-4">
                      <strong className="block">{guidance.action}</strong>
                      <span className="mt-1 flex items-center gap-2 text-xs text-[#68645c]"><OwnerBadge owner={guidance.owner} /> {guidance.eta}</span>
                    </td>
                    <td className="px-5 py-4">{subscriptionStates.get(organization.id)?.paused ? <Badge tone="error">PAUSED</Badge> : trial.enabled ? trial.label : organization.plan}</td>
                    <td className="px-5 py-4 text-right"><div className="flex justify-end gap-3"><Link className="font-black text-[#8a6a16]" href={`/admin/customers/${organization.id}?onboarding=ai-bot`}>AI Bot</Link>{hasWhatsApp ? <Link className="font-black text-[#8a6a16]" href={`/admin/customers/${organization.id}?onboarding=whatsapp`}>WhatsApp</Link> : null}</div></td>
                  </tr>
                );
              })}
              {!organizations.length ? <tr><td className="px-5 py-10 text-center text-[#68645c]" colSpan={6}>No customer organizations yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-black/6 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#68645c]">{label}</p><p className="mt-3 text-3xl font-black">{value}</p></div>;
}

function Status({ value }: { value: string }) {
  const tone = value === "LIVE" || value === "APPROVED" ? "secondary" : value === "REJECTED" ? "error" : "tertiary";
  return <Badge tone={tone}>{value.replaceAll("_", " ")}</Badge>;
}

function OwnerBadge({ owner }: { owner: string }) {
  const tone = owner === "AiFrogi" ? "secondary" : owner === "Meta" ? "tertiary" : "neutral";
  return <Badge tone={tone}>{owner}</Badge>;
}
