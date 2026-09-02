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
import { AppointmentJourneyAdminControl } from "@/components/admin/appointment-journey-admin-control";
import { getAppointmentJourneyAdminWorkspaces } from "@/lib/appointment-journey-service";
import { BotProfileConfigurator } from "@/components/bot-profile/bot-profile-configurator";
import { WebsiteBotInstallation } from "@/components/website-bot/website-bot-installation";
import { BotConnectorPlan } from "@/components/bot-profile/bot-connector-plan";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCustomerDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ onboarding?: string }> }) {
  const { id } = await params;
  const requestedTrack = (await searchParams).onboarding;
  const [organization, billing, plans, flow, user, appointmentWorkspaces] = await Promise.all([
    getOrganizationById(id),
    getCustomerBillingDetail(id),
    ensureBillingPlans(),
    loadOrganizationProductFlow(id),
    getCurrentUser(),
    getAppointmentJourneyAdminWorkspaces(id)
  ]);
  if (!organization) notFound();
  const onboarding = organization.onboarding;
  const trial = getTrialWindow(organization);
  const channels = organization.botProfile?.channels || [];
  const whatsappEnabled = channels.includes("WHATSAPP");
  const websiteEnabled = channels.includes("WEBSITE") || !channels.length;
  const activeTrack = requestedTrack === "whatsapp" ? "whatsapp" : "ai-bot";
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
      <Link href="/admin/customers" className="text-sm font-black text-[#8a6a16]">Back to customers</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6a16]">Customer review</p><h1 className="mt-2 text-3xl font-black">{organization.name}</h1><p className="mt-2 text-sm text-[#68645c]">{organization.ownerName} · {organization.ownerEmail}</p></div>
        <Badge tone={activeTrack === "ai-bot" && organization.botProfile?.status === "LIVE" ? "secondary" : activeTrack === "whatsapp" && onboarding?.metaStatus === "LIVE" ? "secondary" : "tertiary"}>{activeTrack === "ai-bot" ? `AI BOT · ${(organization.botProfile?.status || "DRAFT").replaceAll("_", " ")}` : `WHATSAPP · ${whatsappEnabled ? (onboarding?.metaStatus || "NOT STARTED").replaceAll("_", " ") : "NOT ENABLED"}`}</Badge>
      </div>

      {trial.enabled ? <div className="mt-5"><Badge tone="primary">{trial.label}</Badge></div> : null}

      <nav aria-label="Customer onboarding tracks" className="mt-7 grid gap-3 sm:grid-cols-2">
        <TrackLink href={`/admin/customers/${organization.id}?onboarding=ai-bot`} active={activeTrack === "ai-bot"} title="AI Bot Onboarding" copy="Persona, approved intelligence, connectors, installation and bot go-live" status={organization.botProfile?.status || "DRAFT"} />
        <TrackLink href={`/admin/customers/${organization.id}?onboarding=whatsapp`} active={activeTrack === "whatsapp"} title="WhatsApp Onboarding" copy="Number, Meta approval, webhook, template and first-message proof" status={whatsappEnabled ? onboarding?.metaStatus || "NOT_STARTED" : "NOT_ENABLED"} />
      </nav>

      {activeTrack === "ai-bot" ? <section className="mt-7">
        <div className="mb-5 rounded-lg border border-[#d8c278] bg-[#fff9e8] p-5"><p className="product-eyebrow">AI Bot onboarding only</p><h2 className="mt-2 text-xl font-black">Prepare and activate the governed AI Bot.</h2><p className="mt-2 text-sm leading-6 text-[#68645c]">This track does not require a WhatsApp number, Meta approval, templates or webhooks.</p></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <BotProfileConfigurator organizationId={organization.id} initialProfile={organization.botProfile} />
          <BotConnectorPlan organizationId={organization.id} connectors={organization.botConnectors} />
          {websiteEnabled ? <div className="lg:col-span-2"><WebsiteBotInstallation organizationId={organization.id} slug={organization.properties[0]?.slug || organization.slug} profile={organization.botProfile} superAdmin /></div> : <Section title="Website installation"><p className="text-sm text-[#68645c]">Website delivery is not enabled for this bot. Add the Website channel in the bot profile when embed or standalone delivery is required.</p></Section>}
          <Section title="Company and approved source details"><Detail label="Legal name" value={onboarding?.legalName} /><Detail label="Industry" value={organization.industry} /><Detail label="Website" value={organization.website} /><Detail label="Address" value={organization.businessAddress} /></Section>
          <Section title="AI Bot readiness"><Detail label="Persona" value={organization.botProfile?.personaName} /><Detail label="Channel" value={channels.length ? channels.join(", ") : "Website"} /><Detail label="Lifecycle" value={organization.botProfile?.status || "DRAFT"} /><p className="mt-4 text-sm leading-6 text-[#68645c]">Approve business knowledge and preview answers before installation approval. Super Admin can make the bot live only after installation detection.</p></Section>
        </div>
      </section> : <section className="mt-7">
        {!whatsappEnabled ? <div className="rounded-lg border border-[#d8c278] bg-[#fff9e8] p-6"><p className="product-eyebrow">WhatsApp not enabled</p><h2 className="mt-2 text-2xl font-black">This pilot is currently an AI Bot onboarding.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[#68645c]">Meta, phone, webhook and template controls remain hidden until WHATSAPP is deliberately added to the bot channels.</p></div> : <>
          {flow ? <ProductFlowCenter flow={flow} mode="admin" /> : null}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <CustomerFlowActions
          organizationId={organization.id}
          metaBillingStatus={onboarding?.metaBillingStatus}
          templateStatus={onboarding?.templateStatus}
          firstMessageStatus={onboarding?.firstMessageStatus}
            />
            <AppointmentJourneyAdminControl organizationId={organization.id} workspaces={appointmentWorkspaces} />
            <Section title="WhatsApp readiness"><Detail label="Phone" value={onboarding?.displayPhoneNumber || onboarding?.phoneNumber} /><Detail label="Phone verification" value={onboarding?.phoneVerificationStatus} /><Detail label="Meta connection" value={onboarding?.facebookStatus} /><Detail label="API status" value={onboarding?.metaStatus} /><Detail label="Webhook" value={onboarding?.webhookStatus} /><Detail label="Credential" value={onboarding?.tokenStatus} /><Detail label="Template" value={onboarding?.templateStatus} /><Detail label="First message" value={onboarding?.firstMessageStatus} /></Section>
          </div>
        </>}
      </section>}

      <section className="mt-8 border-t border-black/8 pt-8"><p className="product-eyebrow">Shared account operations</p><h2 className="mt-2 text-2xl font-black">Billing, documents and audit</h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        {billing ? <BillingControls
          organizationId={organization.id}
          plans={plans.map((plan) => ({ code: plan.code, name: plan.name, amountPaisa: plan.amountPaisa }))}
          initialPlan={billing.subscription.plan.code}
          invoices={billing.organization.invoices.map((invoice) => ({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, status: invoice.status, totalPaisa: invoice.totalPaisa }))}
          addons={billing.organization.billingAddons.map((addon) => ({ id: addon.id, name: addon.name, category: addon.category, provisioningStatus: addon.provisioningStatus, paymentStatus: addon.paymentStatus, setupFeePaisa: addon.setupFeePaisa, recurringFeePaisa: addon.recurringFeePaisa }))}
        /> : null}
        <BotSubscriptionConfig
          organizationId={organization.id}
          initialPlan={organization.plan}
          initialConfiguration={organization.botConfiguration}
        />
        <div className="space-y-6">
          <Section title="Company details"><Detail label="Legal name" value={onboarding?.legalName} /><Detail label="Industry" value={organization.industry} /><Detail label="Website" value={organization.website} /><Detail label="Google Maps" value={onboarding?.googleMapsUrl} /><Detail label="Google Business Profile" value={onboarding?.googleBusinessProfileUrl} /><Detail label="Instagram" value={onboarding?.instagramUrl} /><Detail label="Approved photos" value={onboarding?.photoUrls?.length ? `${onboarding.photoUrls.length} supplied` : null} /><Detail label="GST / registration" value={onboarding?.registrationNumber || organization.gstNumber} /><Detail label="Address" value={organization.businessAddress} /></Section>
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
            <p className="mb-3 text-xs leading-5 text-[#68645c]">{canReadDocuments ? "Customer granted document access. Opening a document is logged." : "Document metadata is visible for operations. File contents are locked until the customer grants document access."}</p>
            {organization.documents.map((document) => canReadDocuments ? <a key={document.id} href={`/api/onboarding/documents/${document.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-between border-b border-black/5 py-3 text-sm font-semibold"><span>{document.type.replaceAll("_", " ")}</span><span className="text-[#8a6a16]">Open</span></a> : <div key={document.id} className="flex items-center justify-between border-b border-black/5 py-3 text-sm"><span><strong className="block">{document.type.replaceAll("_", " ")}</strong><small className="text-[#68645c]">{document.fileName} · {(document.sizeBytes / 1024).toFixed(1)} KB</small></span><span className="status-pill status-success">Locked</span></div>)}
            {!organization.documents.length ? <p className="text-sm text-[#68645c]">No documents uploaded.</p> : null}
          </Section>
        </div>
        <Section title="Activity timeline">
          <div className="space-y-4">
            {organization.activities.map((activity) => <div key={activity.id} className="border-l-2 border-[#25d366] pl-4"><p className="text-sm font-black">{activity.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs leading-5 text-[#68645c]">{activity.detail || activity.actorEmail || "System update"}</p><p className="mt-1 text-[11px] text-[#9aa39f]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(activity.createdAt)}</p></div>)}
            {!organization.activities.length ? <p className="text-sm text-[#68645c]">No activity yet.</p> : null}
          </div>
        </Section>
        {billing ? <Section title="Invoices">
          <div className="space-y-3">
            {billing.organization.invoices.map((invoice) => <div key={invoice.id} className="rounded-md border border-black/6 bg-[#fbfcfb] p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{invoice.invoiceNumber}</strong><p className="mt-1 text-xs text-[#68645c]">{invoice.status.replaceAll("_", " ")}</p></div><strong>{formatMoney(invoice.totalPaisa)}</strong></div><p className="mt-2 text-xs text-[#68645c]">Platform {formatMoney(invoice.platformFeePaisa)} · Meta {formatMoney(invoice.metaChargesPaisa)} · AI {formatMoney(invoice.aiOveragePaisa)} · Tax {formatMoney(invoice.taxPaisa)}</p>{invoice.paymentReference ? <p className="mt-2 break-all text-xs font-semibold text-[#6d5310]">Razorpay payment: {invoice.paymentReference}</p> : null}{invoice.notes ? <p className="mt-1 break-all text-[11px] text-[#68645c]">{invoice.notes}</p> : null}</div>)}
            {!billing.organization.invoices.length ? <p className="text-sm text-[#68645c]">No invoices issued.</p> : null}
          </div>
        </Section> : null}
        {billing ? <Section title="Platform audit trail">
          <div className="space-y-4">
            {billing.organization.auditLogs.map((log) => <div key={log.id} className="border-l-2 border-[#6d5310] pl-4"><p className="text-sm font-black">{log.summary}</p><p className="mt-1 text-xs text-[#68645c]">{log.actorEmail} · {log.action.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-[#9aa39f]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(log.createdAt)}</p></div>)}
            {!billing.organization.auditLogs.length ? <p className="text-sm text-[#68645c]">No billing actions recorded.</p> : null}
          </div>
        </Section> : null}
        <CustomerReviewActions organizationId={organization.id} kycStatus={onboarding?.kycStatus || "NOT_SUBMITTED"} organizationStatus={organization.status} />
      </div>
      </section>
    </main>
  );
}

function TrackLink({ href, active, title, copy, status }: { href: string; active: boolean; title: string; copy: string; status: string }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-lg border p-5 transition ${active ? "border-[#8a6a16] bg-[#101010] text-white shadow-lg" : "border-black/8 bg-white hover:border-[#8a6a16]/50"}`}><div className="flex items-start justify-between gap-4"><div><strong className="text-lg">{title}</strong><p className={`mt-2 text-sm leading-6 ${active ? "text-white/60" : "text-[#68645c]"}`}>{copy}</p></div><Badge tone={status === "LIVE" ? "secondary" : "tertiary"}>{status.replaceAll("_", " ")}</Badge></div></Link>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</section>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div className="flex items-start justify-between gap-5 border-b border-black/5 py-3 text-sm"><span className="text-[#68645c]">{label}</span><strong className="max-w-[65%] text-right">{value || "Not provided"}</strong></div>;
}

function UsageDetail({ label, value, limit }: { label: string; value: number; limit: number }) {
  return <div className="border-b border-black/5 py-3"><div className="flex items-center justify-between gap-4 text-sm"><span className="text-[#68645c]">{label}</span><strong>{value.toLocaleString("en-IN")} / {limit.toLocaleString("en-IN")}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#6d5310]" style={{ width: `${Math.min(usagePercent(value, limit), 100)}%` }} /></div></div>;
}
