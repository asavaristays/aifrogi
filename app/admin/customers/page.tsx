import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { loadAdminOrganizations } from "@/lib/services/onboarding-service";
import { getOnboardingGuidance, getTrialWindow } from "@/lib/onboarding-guidance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCustomersPage() {
  const organizations = await loadAdminOrganizations();
  const live = organizations.filter((item) => item.onboarding?.metaStatus === "LIVE").length;
  const pending = organizations.filter((item) => !["LIVE", "REJECTED"].includes(item.onboarding?.metaStatus || "")).length;
  const rejected = organizations.filter((item) => item.onboarding?.metaStatus === "REJECTED").length;
  const needsAifrogi = organizations.filter((item) => getOnboardingGuidance(item).owner === "AiFrogi").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c725ba]">Super Admin</p>
          <h1 className="mt-2 text-3xl font-black">Customer onboarding</h1>
          <p className="mt-2 text-sm text-[#6d7487]">Monitor verification, WhatsApp activation, and account health.</p>
        </div>
        <Badge tone="secondary">{organizations.length} companies</Badge>
      </div>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Companies" value={organizations.length} />
        <Metric label="Live" value={live} />
        <Metric label="Pending" value={pending} />
        <Metric label="Action required" value={rejected} />
        <Metric label="AiFrogi queue" value={needsAifrogi} />
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-black/6 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead className="bg-[#f7faf8] text-xs uppercase tracking-[0.12em] text-[#6d7487]">
              <tr><th className="px-5 py-4">Company</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Business KYC</th><th className="px-5 py-4">WhatsApp</th><th className="px-5 py-4">Next action</th><th className="px-5 py-4">Trial</th><th className="px-5 py-4 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {organizations.map((organization) => {
                const guidance = getOnboardingGuidance(organization);
                const trial = getTrialWindow(organization);
                return (
                  <tr key={organization.id}>
                    <td className="px-5 py-4"><strong className="block">{organization.name}</strong><span className="mt-1 block text-xs text-[#6d7487]">{organization.ownerEmail}</span></td>
                    <td className="px-5 py-4">{organization.onboarding?.displayPhoneNumber || organization.onboarding?.phoneNumber || "Not added"}</td>
                    <td className="px-5 py-4"><Status value={organization.onboarding?.kycStatus || "NOT_SUBMITTED"} /></td>
                    <td className="px-5 py-4"><Status value={organization.onboarding?.metaStatus || "NOT_STARTED"} /></td>
                    <td className="px-5 py-4">
                      <strong className="block">{guidance.action}</strong>
                      <span className="mt-1 flex items-center gap-2 text-xs text-[#6d7487]"><OwnerBadge owner={guidance.owner} /> {guidance.eta}</span>
                    </td>
                    <td className="px-5 py-4">{trial.enabled ? trial.label : organization.plan}</td>
                    <td className="px-5 py-4 text-right"><Link className="font-black text-[#c725ba]" href={`/admin/customers/${organization.id}`}>Review</Link></td>
                  </tr>
                );
              })}
              {!organizations.length ? <tr><td className="px-5 py-10 text-center text-[#6d7487]" colSpan={7}>No customer organizations yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-black/6 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#6d7487]">{label}</p><p className="mt-3 text-3xl font-black">{value}</p></div>;
}

function Status({ value }: { value: string }) {
  const tone = value === "LIVE" || value === "APPROVED" ? "secondary" : value === "REJECTED" ? "error" : "tertiary";
  return <Badge tone={tone}>{value.replaceAll("_", " ")}</Badge>;
}

function OwnerBadge({ owner }: { owner: string }) {
  const tone = owner === "AiFrogi" ? "secondary" : owner === "Meta" ? "tertiary" : "neutral";
  return <Badge tone={tone}>{owner}</Badge>;
}
