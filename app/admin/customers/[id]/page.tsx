import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CustomerReviewActions } from "@/components/admin/customer-review-actions";
import { BotSubscriptionConfig } from "@/components/admin/bot-subscription-config";
import { getOrganizationById } from "@/lib/repositories/onboarding-repository";
import { getOnboardingGuidance, getTrialWindow } from "@/lib/onboarding-guidance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organization = await getOrganizationById(id);
  if (!organization) notFound();
  const onboarding = organization.onboarding;
  const guidance = getOnboardingGuidance(organization);
  const trial = getTrialWindow(organization);

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
      <Link href="/admin/customers" className="text-sm font-black text-[#c725ba]">Back to customers</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#c725ba]">Customer review</p><h1 className="mt-2 text-3xl font-black">{organization.name}</h1><p className="mt-2 text-sm text-[#6d7487]">{organization.ownerName} · {organization.ownerEmail}</p></div>
        <Badge tone={onboarding?.metaStatus === "LIVE" ? "secondary" : onboarding?.metaStatus === "REJECTED" ? "error" : "tertiary"}>{(onboarding?.metaStatus || "NOT STARTED").replaceAll("_", " ")}</Badge>
      </div>

      <section className="mt-7 rounded-lg border border-black/6 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="product-eyebrow">Current blocker</p>
              <OwnerBadge owner={guidance.owner} />
              <Badge tone={guidance.tone === "urgent" ? "error" : guidance.tone === "ready" ? "secondary" : "tertiary"}>{guidance.eta}</Badge>
              {trial.enabled ? <Badge tone="primary">{trial.label}</Badge> : null}
            </div>
            <h2 className="mt-3 text-2xl font-semibold">{guidance.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7487]">{guidance.description}</p>
          </div>
          <div className="rounded-md border border-black/6 bg-[#faf8fb] p-4 lg:w-72">
            <p className="text-xs font-semibold text-[#6d7487]">Support note</p>
            <p className="mt-2 text-sm font-semibold">{guidance.supportNote}</p>
          </div>
        </div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <BotSubscriptionConfig
          organizationId={organization.id}
          initialPlan={organization.plan}
          initialConfiguration={organization.botConfiguration}
        />
        <div className="space-y-6">
          <Section title="Company details"><Detail label="Legal name" value={onboarding?.legalName} /><Detail label="Industry" value={organization.industry} /><Detail label="Website" value={organization.website} /><Detail label="GST / registration" value={onboarding?.registrationNumber || organization.gstNumber} /><Detail label="Address" value={organization.businessAddress} /></Section>
          <Section title="WhatsApp health"><Detail label="Phone" value={onboarding?.displayPhoneNumber || onboarding?.phoneNumber} /><Detail label="Phone verification" value={onboarding?.phoneVerificationStatus} /><Detail label="Connection" value={onboarding?.facebookStatus} /><Detail label="API status" value={onboarding?.metaStatus} /><Detail label="Webhook" value={onboarding?.webhookStatus} /><Detail label="Credential" value={onboarding?.tokenStatus} /><Detail label="Quality rating" value={onboarding?.qualityRating} /></Section>
          <Section title="Business documents">
            {organization.documents.map((document) => <a key={document.id} href={`/api/onboarding/documents/${document.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-between border-b border-black/5 py-3 text-sm font-semibold"><span>{document.type.replaceAll("_", " ")}</span><span className="text-[#c725ba]">Open</span></a>)}
            {!organization.documents.length ? <p className="text-sm text-[#6d7487]">No documents uploaded.</p> : null}
          </Section>
        </div>
        <Section title="Activity timeline">
          <div className="space-y-4">
            {organization.activities.map((activity) => <div key={activity.id} className="border-l-2 border-[#25d366] pl-4"><p className="text-sm font-black">{activity.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs leading-5 text-[#6d7487]">{activity.detail || activity.actorEmail || "System update"}</p><p className="mt-1 text-[11px] text-[#9aa39f]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(activity.createdAt)}</p></div>)}
            {!organization.activities.length ? <p className="text-sm text-[#6d7487]">No activity yet.</p> : null}
          </div>
        </Section>
        <CustomerReviewActions organizationId={organization.id} kycStatus={onboarding?.kycStatus || "NOT_SUBMITTED"} organizationStatus={organization.status} />
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</section>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div className="flex items-start justify-between gap-5 border-b border-black/5 py-3 text-sm"><span className="text-[#6d7487]">{label}</span><strong className="max-w-[65%] text-right">{value || "Not provided"}</strong></div>;
}

function OwnerBadge({ owner }: { owner: string }) {
  const tone = owner === "AiFrogi" ? "secondary" : owner === "Meta" ? "tertiary" : "neutral";
  return <Badge tone={tone}>{owner}</Badge>;
}
