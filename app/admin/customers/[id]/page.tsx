import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CustomerReviewActions } from "@/components/admin/customer-review-actions";
import { CustomerFlowActions } from "@/components/admin/customer-flow-actions";
import { BotSubscriptionConfig } from "@/components/admin/bot-subscription-config";
import { BillingControls } from "@/components/admin/billing-controls";
import { ProductFlowCenter } from "@/components/setup/product-flow-center";
import { getCurrentUser } from "@/lib/auth-server";
import { getOrganizationById } from "@/lib/repositories/onboarding-repository";
import { getTrialWindow } from "@/lib/onboarding-guidance";
import { loadOrganizationProductFlow } from "@/lib/product-flow";
import { ensureBillingPlans, formatMoney, getCustomerBillingDetail, usagePercent } from "@/lib/billing-super-admin";
import { hasActiveSupportAccess, logSupportDataAccess } from "@/lib/support-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [organization, billing, plans, flow, user] = await Promise.all([
    getOrganizationById(id),
    getCustomerBillingDetail(id),
    ensureBillingPlans(),
    loadOrganizationProductFlow(id),
    getCurrentUser()
  ]);
  if (!organization) notFound();
  const onboarding = organization.onboarding;
  const trial = getTrialWindow(organization);
  const canReadDocuments = await hasActiveSupportAccess(organization.id, "DOCUMENTS");
  if (user) {
    await logSupportDataAccess({
      organizationId: organization.id,
      actorEmail: user.username,
      scope: "DOCUMENTS",
      targetType: "ORGANIZATION",
      targetId: organization.id,
      granted: canReadDocuments,
      summary: canReadDocuments ? "Support viewed customer document links." : "Support document links hidden because customer access was not granted."
    });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
      <Link href="/admin/customers" className="text-sm font-black text-[#c725ba]">Back to customers</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#c725ba]">Customer review</p><h1 className="mt-2 text-3xl font-black">{organization.name}</h1><p className="mt-2 text-sm text-[#6d7487]">{organization.ownerName} · {organization.ownerEmail}</p></div>
        <Badge tone={onboarding?.metaStatus === "LIVE" ? "secondary" : onboarding?.metaStatus === "REJECTED" ? "error" : "tertiary"}>{(onboarding?.metaStatus || "NOT STARTED").replaceAll("_", " ")}</Badge>
      </div>

      {trial.enabled ? <div className="mt-5"><Badge tone="primary">{trial.label}</Badge></div> : null}
      {flow ? <div className="mt-7"><ProductFlowCenter flow={flow} mode="admin" /></div> : null}

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <CustomerFlowActions
          organizationId={organization.id}
          metaBillingStatus={onboarding?.metaBillingStatus}
          templateStatus={onboarding?.templateStatus}
          firstMessageStatus={onboarding?.firstMessageStatus}
        />
        {billing ? <BillingControls
          organizationId={organization.id}
          plans={plans.map((plan) => ({ code: plan.code, name: plan.name, amountPaisa: plan.amountPaisa }))}
          initialPlan={billing.subscription.plan.code}
          invoices={billing.organization.invoices.map((invoice) => ({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, status: invoice.status, totalPaisa: invoice.totalPaisa }))}
        /> : null}
        <BotSubscriptionConfig
          organizationId={organization.id}
          initialPlan={organization.plan}
          initialConfiguration={organization.botConfiguration}
        />
        <div className="space-y-6">
          <Section title="Company details"><Detail label="Legal name" value={onboarding?.legalName} /><Detail label="Industry" value={organization.industry} /><Detail label="Website" value={organization.website} /><Detail label="GST / registration" value={onboarding?.registrationNumber || organization.gstNumber} /><Detail label="Address" value={organization.businessAddress} /></Section>
          <Section title="WhatsApp health"><Detail label="Phone" value={onboarding?.displayPhoneNumber || onboarding?.phoneNumber} /><Detail label="Phone verification" value={onboarding?.phoneVerificationStatus} /><Detail label="Connection" value={onboarding?.facebookStatus} /><Detail label="API status" value={onboarding?.metaStatus} /><Detail label="Webhook" value={onboarding?.webhookStatus} /><Detail label="Credential" value={onboarding?.tokenStatus} /><Detail label="Quality rating" value={onboarding?.qualityRating} /></Section>
          {billing ? <Section title="Subscription and usage">
            <Detail label="Plan" value={billing.subscription.plan.name} />
            <Detail label="Status" value={billing.subscription.status} />
            <Detail label="Payment mode" value={billing.subscription.paymentProvider} />
            <UsageDetail label="Messages" value={billing.usage.messages} limit={billing.limits.messages} />
            <UsageDetail label="AI replies" value={billing.usage.aiReplies} limit={billing.limits.aiReplies} />
            <UsageDetail label="Campaigns" value={billing.usage.campaigns} limit={billing.limits.campaigns} />
            <UsageDetail label="Team users" value={billing.usage.teamUsers} limit={billing.limits.teamUsers} />
          </Section> : null}
          <Section title="Business documents">
            <p className="mb-3 text-xs leading-5 text-[#6d7487]">{canReadDocuments ? "Customer granted document access. Opening a document is logged." : "Document metadata is visible for operations. File contents are locked until the customer grants document access."}</p>
            {organization.documents.map((document) => canReadDocuments ? <a key={document.id} href={`/api/onboarding/documents/${document.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-between border-b border-black/5 py-3 text-sm font-semibold"><span>{document.type.replaceAll("_", " ")}</span><span className="text-[#c725ba]">Open</span></a> : <div key={document.id} className="flex items-center justify-between border-b border-black/5 py-3 text-sm"><span><strong className="block">{document.type.replaceAll("_", " ")}</strong><small className="text-[#6d7487]">{document.fileName} · {(document.sizeBytes / 1024).toFixed(1)} KB</small></span><span className="status-pill status-success">Locked</span></div>)}
            {!organization.documents.length ? <p className="text-sm text-[#6d7487]">No documents uploaded.</p> : null}
          </Section>
        </div>
        <Section title="Activity timeline">
          <div className="space-y-4">
            {organization.activities.map((activity) => <div key={activity.id} className="border-l-2 border-[#25d366] pl-4"><p className="text-sm font-black">{activity.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs leading-5 text-[#6d7487]">{activity.detail || activity.actorEmail || "System update"}</p><p className="mt-1 text-[11px] text-[#9aa39f]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(activity.createdAt)}</p></div>)}
            {!organization.activities.length ? <p className="text-sm text-[#6d7487]">No activity yet.</p> : null}
          </div>
        </Section>
        {billing ? <Section title="Invoices">
          <div className="space-y-3">
            {billing.organization.invoices.map((invoice) => <div key={invoice.id} className="rounded-md border border-black/6 bg-[#fbfcfb] p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{invoice.invoiceNumber}</strong><p className="mt-1 text-xs text-[#6d7487]">{invoice.status.replaceAll("_", " ")}</p></div><strong>{formatMoney(invoice.totalPaisa)}</strong></div><p className="mt-2 text-xs text-[#6d7487]">Platform {formatMoney(invoice.platformFeePaisa)} · Meta {formatMoney(invoice.metaChargesPaisa)} · AI {formatMoney(invoice.aiOveragePaisa)} · Tax {formatMoney(invoice.taxPaisa)}</p></div>)}
            {!billing.organization.invoices.length ? <p className="text-sm text-[#6d7487]">No invoices issued.</p> : null}
          </div>
        </Section> : null}
        {billing ? <Section title="Platform audit trail">
          <div className="space-y-4">
            {billing.organization.auditLogs.map((log) => <div key={log.id} className="border-l-2 border-[#b923ae] pl-4"><p className="text-sm font-black">{log.summary}</p><p className="mt-1 text-xs text-[#6d7487]">{log.actorEmail} · {log.action.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-[#9aa39f]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(log.createdAt)}</p></div>)}
            {!billing.organization.auditLogs.length ? <p className="text-sm text-[#6d7487]">No billing actions recorded.</p> : null}
          </div>
        </Section> : null}
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

function UsageDetail({ label, value, limit }: { label: string; value: number; limit: number }) {
  return <div className="border-b border-black/5 py-3"><div className="flex items-center justify-between gap-4 text-sm"><span className="text-[#6d7487]">{label}</span><strong>{value.toLocaleString("en-IN")} / {limit.toLocaleString("en-IN")}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#b923ae]" style={{ width: `${Math.min(usagePercent(value, limit), 100)}%` }} /></div></div>;
}
