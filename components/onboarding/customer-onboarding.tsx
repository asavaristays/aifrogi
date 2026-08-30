"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOnboardingGuidance, getTrialWindow } from "@/lib/onboarding-guidance";
import { BotProfileConfigurator } from "@/components/bot-profile/bot-profile-configurator";
import { BotConnectorPlan, type BotConnectorView } from "@/components/bot-profile/bot-connector-plan";
import { WebsiteBotInstallation } from "@/components/website-bot/website-bot-installation";

type DocumentRecord = {
  id: string;
  type: string;
  fileName: string;
  sizeBytes: number;
  status: string;
};

type ActivityRecord = {
  id: string;
  action: string;
  detail: string | null;
  actorEmail: string | null;
  createdAt: string | Date;
};

type OnboardingRecord = {
  currentStep: number;
  progressPercent: number;
  lifecycleStatus: string;
  legalName: string | null;
  registrationNumber: string | null;
  facebookPage: string | null;
  googleMapsUrl: string | null;
  googleBusinessProfileUrl: string | null;
  instagramUrl: string | null;
  photoUrls: string[];
  businessCategory: string | null;
  logoUrl: string | null;
  kycStatus: string;
  phoneCountryCode: string;
  phoneNumber: string | null;
  whatsappActiveOnNumber: boolean | null;
  numberConnectionPath: string | null;
  phoneVerificationStatus: string;
  facebookStatus: string;
  metaStatus: string;
  displayPhoneNumber: string | null;
  qualityRating: string | null;
  webhookStatus: string;
  tokenStatus: string;
  lastError: string | null;
  updatedAt?: string | Date;
};

export type CustomerOnboardingOrganization = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  country: string;
  timezone: string;
  gstNumber: string | null;
  businessAddress: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  publicAddress: string | null;
  publicBusinessHours: string | null;
  status: string;
  plan: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  onboarding: OnboardingRecord | null;
  botProfile: { category: string; operatingMode: string; channels: string[]; capabilities: string[]; humanHandoffEnabled: boolean; actionApprovalNeeded: boolean; personaName?: string | null; businessObjective?: string | null; tone?: string | null; languages?: string[]; prohibitedClaims?: string[]; escalationTriggers?: string[]; responseSlaMinutes?: number; reminderPercent?: number; fallbackEnabled?: boolean; safeFallbackMessage?: string | null; status?: string; installationKey?: string | null; installationDetectedAt?: string | Date | null; liveAt?: string | Date | null } | null;
  botConnectors: BotConnectorView[];
  documents: DocumentRecord[];
  activities: ActivityRecord[];
  properties: Array<{ id: string; name: string; slug: string }>;
};

type MetaSession = { wabaId: string; phoneNumberId: string };
type OrganizationForm = {
  name: string;
  industry: string;
  website: string;
  country: string;
  timezone: string;
  gstNumber: string;
  businessAddress: string;
  ownerName: string;
  ownerMobile: string;
  publicPhone: string;
  publicEmail: string;
  publicAddress: string;
  publicBusinessHours: string;
};
type BusinessForm = {
  legalName: string;
  registrationNumber: string;
  facebookPage: string;
  googleMapsUrl: string;
  googleBusinessProfileUrl: string;
  instagramUrl: string;
  photoUrls: string;
  businessCategory: string;
  logoUrl: string;
};
type PhoneForm = {
  phoneCountryCode: string;
  phoneNumber: string;
  whatsappActiveOnNumber: boolean;
};

declare global {
  interface Window {
    FB?: {
      init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const allSteps = [
  { title: "Organization", helper: "Your company and owner profile" },
  { title: "Business details", helper: "Information used for verification" },
  { title: "WhatsApp number", helper: "Choose the number to connect" },
  { title: "Connect WhatsApp", helper: "Secure authorization" },
  { title: "Account status", helper: "We complete setup in the background" },
  { title: "Go live", helper: "Open your messaging workspace" }
];

const documentOptions = [
  { type: "GST_CERTIFICATE", label: "GST certificate", optional: false },
  { type: "TRADE_LICENSE", label: "Trade license", optional: false },
  { type: "PAN", label: "PAN", optional: true },
  { type: "VISITING_CARD", label: "Visiting card", optional: true }
];

export function CustomerOnboarding({
  initialOrganization,
  accountEmail,
  metaAppId,
  metaConfigId,
  graphVersion
}: {
  initialOrganization: CustomerOnboardingOrganization | null;
  accountEmail: string;
  metaAppId: string;
  metaConfigId: string;
  graphVersion: string;
}) {
  const router = useRouter();
  const [organization, setOrganization] = useState(initialOrganization);
  const [activeStep, setActiveStep] = useState(initialOrganization?.onboarding?.currentStep || 1);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [metaSdkReady, setMetaSdkReady] = useState(false);
  const metaCodeRef = useRef("");
  const metaSessionRef = useRef<MetaSession | null>(null);
  const metaSubmittingRef = useRef(false);
  const metaConfigured = Boolean(metaAppId && metaConfigId);
  const usesWhatsApp = organization?.botProfile?.channels?.includes("WHATSAPP") ?? false;
  const usesWebsite = organization?.botProfile?.channels?.includes("WEBSITE") ?? true;
  const websiteReady = Boolean(usesWebsite && organization?.botProfile?.status === "CONFIGURED" && organization.botProfile.personaName && organization.botProfile.businessObjective && organization.botProfile.escalationTriggers?.length && organization?.onboarding?.kycStatus === "APPROVED");
  const visibleSteps = useMemo(() => usesWhatsApp ? allSteps.map((step, index) => ({ ...step, number: index + 1 })) : [
    { ...allSteps[0], number: 1 },
    { ...allSteps[1], number: 2 },
    { title: "Go live", helper: "Review intelligence and open your AI workspace", number: 6 }
  ], [usesWhatsApp]);

  const [organizationForm, setOrganizationForm] = useState({
    name: initialOrganization?.name || "",
    industry: initialOrganization?.industry || "Hospitality",
    website: initialOrganization?.website || "",
    country: initialOrganization?.country || "India",
    timezone: initialOrganization?.timezone || "Asia/Kolkata",
    gstNumber: initialOrganization?.gstNumber || "",
    businessAddress: initialOrganization?.businessAddress || "",
    ownerName: initialOrganization?.ownerName || "",
    ownerMobile: initialOrganization?.ownerMobile || "",
    publicPhone: initialOrganization?.publicPhone || "",
    publicEmail: initialOrganization?.publicEmail || "",
    publicAddress: initialOrganization?.publicAddress || "",
    publicBusinessHours: initialOrganization?.publicBusinessHours || ""
  });
  const [businessForm, setBusinessForm] = useState({
    legalName: initialOrganization?.onboarding?.legalName || "",
    registrationNumber: initialOrganization?.onboarding?.registrationNumber || "",
    facebookPage: initialOrganization?.onboarding?.facebookPage || "",
    googleMapsUrl: initialOrganization?.onboarding?.googleMapsUrl || "",
    googleBusinessProfileUrl: initialOrganization?.onboarding?.googleBusinessProfileUrl || "",
    instagramUrl: initialOrganization?.onboarding?.instagramUrl || "",
    photoUrls: initialOrganization?.onboarding?.photoUrls?.join("\n") || "",
    businessCategory: initialOrganization?.onboarding?.businessCategory || "Hotel and accommodation",
    logoUrl: initialOrganization?.onboarding?.logoUrl || ""
  });
  const [phoneForm, setPhoneForm] = useState({
    phoneCountryCode: initialOrganization?.onboarding?.phoneCountryCode || "+91",
    phoneNumber: initialOrganization?.onboarding?.phoneNumber || "",
    whatsappActiveOnNumber: initialOrganization?.onboarding?.whatsappActiveOnNumber ?? false
  });

  const whatsappProgress = organization?.onboarding?.progressPercent || (organization ? 20 : 5);
  const websiteProgress = [
    Boolean(organization),
    Boolean(organization?.ownerMobile && organization?.businessAddress && organization?.website),
    organization?.onboarding?.kycStatus === "APPROVED",
    organization?.botProfile?.status === "CONFIGURED"
  ].filter(Boolean).length * 25;
  const progress = usesWhatsApp ? whatsappProgress : websiteProgress;
  const live = usesWhatsApp ? organization?.onboarding?.metaStatus === "LIVE" : websiteReady;
  const rejected = organization?.onboarding?.metaStatus === "REJECTED";
  const pending = ["CONNECTING", "CONFIGURING", "REVIEW"].includes(organization?.onboarding?.metaStatus || "");
  const guidance = getOnboardingGuidance(organization);
  const trial = getTrialWindow(organization);

  const completedSteps = useMemo(() => {
    const onboarding = organization?.onboarding;
    return [
      Boolean(organization),
      Boolean(onboarding && onboarding.kycStatus !== "NOT_SUBMITTED"),
      Boolean(onboarding?.phoneNumber),
      onboarding?.facebookStatus === "CONNECTED",
      live,
      live
    ];
  }, [organization, live]);

  useEffect(() => {
    if (!usesWhatsApp && activeStep >= 3 && activeStep <= 5) setActiveStep(6);
  }, [activeStep, usesWhatsApp]);

  const completeMetaConnection = useCallback(async () => {
    const code = metaCodeRef.current;
    const session = metaSessionRef.current;
    if (!code || !session || metaSubmittingRef.current) return;

    metaSubmittingRef.current = true;
    const response = await fetch("/api/onboarding/meta/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, ...session })
    });
    const payload = await response.json().catch(() => null);
    metaSubmittingRef.current = false;
    setConnecting(false);
    if (!response.ok) {
      setError(payload?.error || "WhatsApp connection needs attention. Your business details remain saved.");
      return;
    }
    setOrganization(payload.organization);
    setNotice("WhatsApp connected. We are completing the final account checks.");
    setActiveStep(5);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!usesWhatsApp || !metaConfigured || window.FB) {
      setMetaSdkReady(Boolean(window.FB));
      return;
    }

    window.fbAsyncInit = () => {
      window.FB?.init({ appId: metaAppId, cookie: true, xfbml: false, version: graphVersion });
      setMetaSdkReady(true);
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.appendChild(script);
  }, [graphVersion, metaAppId, metaConfigured, usesWhatsApp]);

  useEffect(() => {
    function receiveMetaSession(event: MessageEvent) {
      let originHost = "";
      try {
        originHost = new URL(event.origin).hostname;
      } catch {
        return;
      }
      if (originHost !== "facebook.com" && !originHost.endsWith(".facebook.com")) return;
      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (data?.type !== "WA_EMBEDDED_SIGNUP" || data?.event !== "FINISH") return;
      const wabaId = String(data?.data?.waba_id || "");
      const phoneNumberId = String(data?.data?.phone_number_id || "");
      if (!wabaId || !phoneNumberId) return;
      metaSessionRef.current = { wabaId, phoneNumberId };
      void completeMetaConnection();
    }

    window.addEventListener("message", receiveMetaSession);
    return () => window.removeEventListener("message", receiveMetaSession);
  }, [completeMetaConnection]);

  async function request(method: "POST" | "PATCH", body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/onboarding", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(payload?.error || "We could not save this step. Please try again.");
      return null;
    }
    setOrganization(payload.organization);
    return payload.organization as CustomerOnboardingOrganization;
  }

  async function continueOrganization() {
    const updated = await request(organization ? "PATCH" : "POST", {
      ...(organization ? { step: 1 } : {}),
      ...organizationForm
    });
    if (updated) setActiveStep(2);
  }

  async function continueBusiness() {
    const updated = await request("PATCH", { step: 2, ...businessForm });
    if (updated) setActiveStep(updated.botProfile?.channels?.includes("WHATSAPP") ? 3 : 6);
  }

  async function continuePhone() {
    const updated = await request("PATCH", { step: 3, ...phoneForm });
    if (updated) setActiveStep(4);
  }

  async function beginMetaConnection() {
    if (!metaConfigured || !metaSdkReady || !window.FB) {
      setError("Secure WhatsApp connection is being enabled for this platform. Your saved progress is safe.");
      return;
    }

    setConnecting(true);
    setError(null);
    await request("PATCH", { step: 4 });
    window.FB.login(
      (response) => {
        const code = response.authResponse?.code || "";
        if (!code) {
          setConnecting(false);
          setError("WhatsApp connection was not completed. You can safely try again.");
          return;
        }
        metaCodeRef.current = code;
        void completeMetaConnection();
      },
      {
        config_id: metaConfigId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3"
        }
      }
    );
  }

  async function refreshStatus() {
    setSaving(true);
    setError(null);
    const response = await fetch("/api/onboarding/meta/status", { method: "POST" });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(payload?.error || "Status could not be refreshed.");
      return;
    }
    setOrganization(payload.organization);
    if (payload.organization?.onboarding?.metaStatus === "LIVE") setActiveStep(6);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="border-b border-black bg-[var(--ink-950)] px-5 py-4 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Image
            src="/brand/aifrogi-logo-transparent.png"
            alt="AiFrogi"
            width={800}
            height={300}
            priority
            className="h-auto w-[158px] grayscale contrast-125"
          />
          <div className="text-right">
            <p className="text-xs font-bold text-white/55">Signed in as</p>
            <p className="mt-1 text-sm font-semibold">{accountEmail}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6a16]">Setup progress</p>
            <strong>{progress}%</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div className="h-full rounded-full bg-[var(--gold-600)] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#4d5a55] lg:hidden">Step {Math.max(1, visibleSteps.findIndex((step) => step.number === activeStep) + 1)} of {visibleSteps.length}: {visibleSteps.find((step) => step.number === activeStep)?.title || "Setup"}</p>
          {trial.enabled ? (
            <div className="mt-5 rounded-md border border-[var(--gold-300)] bg-[var(--primary-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-[#404040]">15-day trial</p>
                <span className="text-xs font-black text-[var(--gold-700)]">{trial.label}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[var(--gold-600)]" style={{ width: `${trial.percentElapsed}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#68645c]">Use this window to finish activation, test messaging, and prove the first workflow.</p>
            </div>
          ) : null}
          <nav className="mt-6 hidden space-y-1 lg:block" aria-label="Onboarding steps">
            {visibleSteps.map((step, index) => {
              const stepNumber = step.number;
              const active = activeStep === stepNumber;
              const complete = completedSteps[stepNumber - 1];
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => organization && stepNumber <= Math.max(organization.onboarding?.currentStep || 1, activeStep) ? setActiveStep(stepNumber) : undefined}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left ${active ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--surface-soft)]"}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${complete ? "bg-[var(--success-soft)] text-[var(--success)]" : active ? "bg-[var(--gold-600)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}>
                    {complete ? "✓" : index + 1}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">{step.title}</strong>
                    <small className="mt-0.5 block truncate text-xs text-[#68645c]">{step.helper}</small>
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="mt-6 hidden border-t border-black/5 pt-5 text-xs leading-5 text-[#68645c] lg:block">
            Your progress is saved after every step. Technical credentials are never shown or stored in your browser.
          </div>
        </aside>

        <div className="space-y-6">
          <TodayActionCard
            guidance={guidance}
            progress={progress}
            onGo={() => setActiveStep(guidance.step)}
            live={live}
            onOpenWorkspace={() => router.push("/dashboard")}
          />
          <OnboardingReadiness organization={organization} />
          {organization ? <BotProfileConfigurator initialProfile={organization.botProfile} onSaved={(updated) => setOrganization(updated as CustomerOnboardingOrganization)} /> : null}
          {organization?.botConnectors?.length ? <BotConnectorPlan connectors={organization.botConnectors} /> : null}
          {organization?.properties[0] ? <WebsiteBotInstallation slug={organization.properties[0].slug} profile={organization.botProfile} /> : null}
          {usesWhatsApp ? <TechProviderGuide /> : null}

          <section className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
            <div className="border-b border-black/5 px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6a16]">Step {Math.max(1, visibleSteps.findIndex((step) => step.number === activeStep) + 1)} of {visibleSteps.length}</p>
                  <h1 className="mt-2 text-2xl font-black sm:text-3xl">{visibleSteps.find((step) => step.number === activeStep)?.title || "Setup"}</h1>
                  <p className="mt-2 text-sm text-[#68645c]">{visibleSteps.find((step) => step.number === activeStep)?.helper || "Complete your business bot setup"}</p>
                </div>
                <Badge tone={live ? "secondary" : rejected ? "error" : "neutral"}>{live ? "Live" : rejected ? "Action required" : organization?.plan || "Trial"}</Badge>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-8">
              {activeStep === 1 ? <OrganizationStep value={organizationForm} onChange={setOrganizationForm} /> : null}
              {activeStep === 2 ? (
                <BusinessStep
                  value={businessForm}
                  onChange={setBusinessForm}
                  documents={organization?.documents || []}
                  onDocumentsChanged={(documents) => setOrganization((current) => current ? { ...current, documents } : current)}
                />
              ) : null}
              {activeStep === 3 && usesWhatsApp ? <PhoneStep value={phoneForm} onChange={setPhoneForm} /> : null}
              {activeStep === 4 && usesWhatsApp ? (
                <ConnectStep
                  configured={metaConfigured}
                  ready={metaSdkReady}
                  kycApproved={organization?.onboarding?.kycStatus === "APPROVED"}
                  connecting={connecting}
                  onConnect={beginMetaConnection}
                />
              ) : null}
              {activeStep === 5 && usesWhatsApp ? (
                <StatusStep onboarding={organization?.onboarding || null} pending={pending} rejected={rejected} live={live} onRefresh={refreshStatus} saving={saving} />
              ) : null}
              {activeStep === 6 ? <LiveStep organization={organization} onOpen={() => router.push(usesWebsite ? "/knowledge" : "/dashboard")} /> : null}

              {error ? <p className="mt-6 rounded-md border border-[#f5b9b2] bg-[#fff3f1] px-4 py-3 text-sm font-semibold text-[#a3342b]">{error}</p> : null}
              {notice ? <p className="mt-6 rounded-md border border-[#b9e9ca] bg-[#effbf3] px-4 py-3 text-sm font-semibold text-[#404040]">{notice}</p> : null}
            </div>

            {activeStep <= 3 && (activeStep < 3 || usesWhatsApp) ? (
              <div className="flex items-center justify-between gap-3 border-t border-black/5 px-6 py-5 sm:px-8">
                <Button tone="surface" disabled={activeStep === 1 || saving} onClick={() => setActiveStep((current) => Math.max(1, current - 1))}>Back</Button>
                <Button disabled={saving} onClick={activeStep === 1 ? continueOrganization : activeStep === 2 ? continueBusiness : continuePhone}>
                  {saving ? "Saving" : "Continue"}
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

function OnboardingReadiness({ organization }: { organization: CustomerOnboardingOrganization | null }) {
  const onboarding = organization?.onboarding;
  const usesWhatsApp = organization?.botProfile?.channels?.includes("WHATSAPP") ?? false;
  const usesWebsite = organization?.botProfile?.channels?.includes("WEBSITE") ?? true;
  const commonItems = [
    { label: "Business owner details", owner: "You", ready: Boolean(organization?.ownerName && organization?.ownerMobile), helper: "Company name, owner, mobile, address, and website" },
    { label: "Business proof", owner: "You", ready: onboarding?.kycStatus === "APPROVED", helper: onboarding?.kycStatus === "SUBMITTED" ? "Submitted; AiFrogi review is in progress" : "Registration or GST document and legal business details" }
  ];
  const websiteItems = usesWebsite ? [
    { label: "Bot purpose and authority", owner: "You", ready: organization?.botProfile?.status === "CONFIGURED", helper: "Business job, approved capabilities, human handoff, and action approval" },
    { label: "Approved intelligence", owner: "You", ready: organization?.botProfile?.status === "CONFIGURED", helper: "Website sources, business facts, documents, and safe-answer instructions" }
  ] : [];
  const whatsappItems = usesWhatsApp ? [
    { label: "WhatsApp phone", owner: "You", ready: Boolean(onboarding?.phoneNumber), helper: "Access to the SIM for OTP or voice verification" },
    { label: "Secure Meta connection", owner: "AiFrogi", ready: onboarding?.facebookStatus === "CONNECTED", helper: "You approve the business and number; no passwords are shared" },
    { label: "Platform review", owner: "Meta", ready: onboarding?.metaStatus === "LIVE", helper: onboarding?.metaStatus === "REJECTED" ? onboarding.lastError || "A correction is required" : "Timing is controlled by Meta; AiFrogi monitors the result" },
    { label: "First messaging test", owner: "AiFrogi", ready: onboarding?.metaStatus === "LIVE" && (onboarding?.webhookStatus === "CONNECTED" || onboarding?.webhookStatus === "CONFIGURED"), helper: "Inbound, outbound, delivery receipt, and human handoff" }
  ] : [];
  const items = [...commonItems, ...websiteItems, ...whatsappItems];
  const ready = items.filter((item) => item.ready).length;
  return (
    <section className="rounded-lg border border-black/6 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="product-eyebrow">Before you begin</p><h2 className="mt-2 text-xl font-semibold">Your onboarding checklist</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Have these items ready once. AiFrogi saves progress and shows exactly who owns each next step.</p></div>
        <span className={`status-pill ${ready === items.length ? "status-success" : "status-info"}`}>{ready}/{items.length} ready</span>
      </div>
      <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-black/7 bg-black/7 md:grid-cols-2">
        {items.map((item) => <div key={item.label} className="flex gap-3 bg-[#fbfcfb] p-4"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${item.ready ? "bg-[#dff2ea] text-[#6d5310]" : "bg-[#eef1f0] text-[#78827e]"}`}>{item.ready ? "✓" : "·"}</span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><strong className="text-sm">{item.label}</strong><small className="status-pill status-info !min-h-5 !px-2 !py-0 text-[9px]">{item.owner}</small></span><small className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{item.helper}</small></span></div>)}
      </div>
    </section>
  );
}

function TodayActionCard({
  guidance,
  progress,
  live,
  onGo,
  onOpenWorkspace
}: {
  guidance: ReturnType<typeof getOnboardingGuidance>;
  progress: number;
  live: boolean;
  onGo: () => void;
  onOpenWorkspace: () => void;
}) {
  const toneClass = {
    ready: "border-[#bce8d6] bg-[#effaf5]",
    waiting: "border-[#ded8cb] bg-[#f8f0d8]",
    urgent: "border-[#ded8cb] bg-[#f8f0d8]",
    info: "border-[#d8e2f3] bg-[#f7faff]"
  }[guidance.tone];
  const ownerClass = guidance.owner === "You" ? "status-warning" : guidance.owner === "Meta" ? "status-info" : "status-success";

  return (
    <section className={`overflow-hidden rounded-lg border p-5 shadow-sm ${toneClass}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="product-eyebrow">Today</p>
            <span className={`status-pill ${ownerClass}`}>{guidance.owner}</span>
            <span className="status-pill status-info">{guidance.eta}</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-[#101010]">{guidance.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68645c]">{guidance.description}</p>
        </div>
        <div className="shrink-0">
          <Button onClick={live ? onOpenWorkspace : onGo}>{guidance.action}</Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="rounded-md border border-white/70 bg-white/75 p-4">
          <p className="text-xs font-semibold text-[#68645c]">Why this matters</p>
          <p className="mt-1 text-sm font-semibold text-[#3a3145]">{guidance.supportNote}</p>
        </div>
        <div className="rounded-md border border-white/70 bg-white/75 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#68645c]">Activation</p>
            <strong className="text-sm">{progress}%</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ded8cb]">
            <div className="h-full rounded-full bg-[#6d5310]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TechProviderGuide() {
  const points = [
    {
      title: "Client stays in control",
      helper: "They log in with Facebook once, select their business and phone number, and approve access."
    },
    {
      title: "No password sharing",
      helper: "We do not ask for Facebook passwords, email passwords, or manual permanent token copying."
    },
    {
      title: "Your team handles setup",
      helper: "AiFrogi stores the approved connection, configures webhooks, checks health, and supports the client from Super Admin."
    }
  ];

  return (
    <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6a16]">Verified Meta access flow</p>
          <h2 className="mt-2 text-xl font-black">WhatsApp setup without exposing Meta complexity</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68645c]">
            Customers complete a guided onboarding journey. Behind the scenes, the platform connects their WhatsApp Business account, stores the approved API access, and keeps the inbox, campaigns, webhooks, and support status in one place.
          </p>
        </div>
        <Badge tone="secondary">Access-ready</Badge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {points.map((point) => (
          <div key={point.title} className="rounded-md border border-black/8 bg-[#f8faf9] p-4">
            <p className="text-sm font-black">{point.title}</p>
            <p className="mt-2 text-xs leading-5 text-[#68645c]">{point.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrganizationStep({ value, onChange }: { value: OrganizationForm; onChange: (value: OrganizationForm) => void }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Company name" required value={value.name} onChange={(name) => onChange({ ...value, name })} />
      <Field label="Industry" value={value.industry} onChange={(industry) => onChange({ ...value, industry })} />
      <Field label="Website" value={value.website} onChange={(website) => onChange({ ...value, website })} placeholder="https://example.com" />
      <Field label="Country" value={value.country} onChange={(country) => onChange({ ...value, country })} />
      <Field label="Time zone" value={value.timezone} onChange={(timezone) => onChange({ ...value, timezone })} />
      <Field label="GST number" value={value.gstNumber} onChange={(gstNumber) => onChange({ ...value, gstNumber })} optional />
      <Field label="Owner name" required value={value.ownerName} onChange={(ownerName) => onChange({ ...value, ownerName })} />
      <Field label="Mobile" required value={value.ownerMobile} onChange={(ownerMobile) => onChange({ ...value, ownerMobile })} inputMode="tel" />
      <label className="md:col-span-2">
        <FieldLabel label="Business address" />
        <textarea className="mt-2 min-h-24 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#8a6a16]" value={value.businessAddress} onChange={(event) => onChange({ ...value, businessAddress: event.target.value })} />
      </label>
      <div className="md:col-span-2 border-t border-black/8 pt-5">
        <h3 className="text-sm font-semibold">Approved public customer contact</h3>
        <p className="mt-1 text-xs leading-5 text-[#68645c]">Only these fields may be disclosed by the AI Bot. Owner login details remain private.</p>
      </div>
      <Field label="Public phone" value={value.publicPhone} onChange={(publicPhone) => onChange({ ...value, publicPhone })} inputMode="tel" optional />
      <Field label="Public email" value={value.publicEmail} onChange={(publicEmail) => onChange({ ...value, publicEmail })} inputMode="email" optional />
      <Field label="Business hours" value={value.publicBusinessHours} onChange={(publicBusinessHours) => onChange({ ...value, publicBusinessHours })} placeholder="Monday–Saturday, 9:00 AM–6:00 PM" optional />
      <label className="md:col-span-2">
        <FieldLabel label="Public address" optional />
        <textarea className="mt-2 min-h-20 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#8a6a16]" value={value.publicAddress} onChange={(event) => onChange({ ...value, publicAddress: event.target.value })} />
      </label>
    </div>
  );
}

function BusinessStep({ value, onChange, documents, onDocumentsChanged }: { value: BusinessForm; onChange: (value: BusinessForm) => void; documents: DocumentRecord[]; onDocumentsChanged: (documents: DocumentRecord[]) => void }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Business legal name" required value={value.legalName} onChange={(legalName) => onChange({ ...value, legalName })} />
        <Field label="GST or registration number" value={value.registrationNumber} onChange={(registrationNumber) => onChange({ ...value, registrationNumber })} />
        <Field label="Business category" required value={value.businessCategory} onChange={(businessCategory) => onChange({ ...value, businessCategory })} />
        <Field label="Facebook page" value={value.facebookPage} onChange={(facebookPage) => onChange({ ...value, facebookPage })} optional />
        <Field label="Google Maps location" value={value.googleMapsUrl} onChange={(googleMapsUrl) => onChange({ ...value, googleMapsUrl })} placeholder="https://maps.google.com/..." optional />
        <Field label="Google Business Profile" value={value.googleBusinessProfileUrl} onChange={(googleBusinessProfileUrl) => onChange({ ...value, googleBusinessProfileUrl })} placeholder="https://g.page/..." optional />
        <Field label="Instagram" value={value.instagramUrl} onChange={(instagramUrl) => onChange({ ...value, instagramUrl })} optional />
        <Field label="Logo URL" value={value.logoUrl} onChange={(logoUrl) => onChange({ ...value, logoUrl })} optional />
        <label className="md:col-span-2"><FieldLabel label="Approved photo URLs" optional /><textarea className="mt-2 min-h-28 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#8a6a16]" value={value.photoUrls} onChange={(event) => onChange({ ...value, photoUrls: event.target.value })} placeholder="One approved photo URL per line" /><span className="mt-2 block text-xs text-[#68645c]">Add property, product, room, team, experience, menu, or project photos relevant to the selected bot category.</span></label>
      </div>
      <div>
        <h2 className="text-base font-black">Verification documents</h2>
        <p className="mt-1 text-sm text-[#68645c]">PDF, JPG, or PNG up to 5 MB. Files remain private.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {documentOptions.map((option) => (
            <DocumentUpload key={option.type} option={option} documents={documents} onDocumentsChanged={onDocumentsChanged} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentUpload({ option, documents, onDocumentsChanged }: { option: { type: string; label: string; optional: boolean }; documents: DocumentRecord[]; onDocumentsChanged: (documents: DocumentRecord[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const document = documents.find((item) => item.type === option.type);

  async function upload(file: File) {
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.set("type", option.type);
    formData.set("file", file);
    const response = await fetch("/api/onboarding/documents", { method: "POST", body: formData });
    const payload = await response.json().catch(() => null);
    setUploading(false);
    if (!response.ok) {
      setUploadError(payload?.error || "Upload failed");
      return;
    }
    onDocumentsChanged([...documents.filter((item) => item.type !== option.type), payload.document]);
  }

  return (
    <div className="rounded-md border border-black/8 bg-[#f8faf9] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{option.label}</p>
          <p className="mt-1 text-xs text-[#68645c]">{option.optional ? "Optional" : "Recommended for review"}</p>
        </div>
        <span className={`text-xs font-black ${document ? "text-[#8a6a16]" : "text-[#9aa39f]"}`}>{document ? "Uploaded" : "Waiting"}</span>
      </div>
      {document ? <p className="mt-3 truncate text-xs text-[#4d5a55]">{document.fileName}</p> : null}
      <label className="mt-3 inline-flex cursor-pointer items-center rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-black">
        {uploading ? "Uploading" : document ? "Replace" : "Choose file"}
        <input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" disabled={uploading} onChange={(event) => event.target.files?.[0] ? void upload(event.target.files[0]) : undefined} />
      </label>
      {uploadError ? <p className="mt-2 text-xs font-semibold text-[#a3342b]">{uploadError}</p> : null}
    </div>
  );
}

function PhoneStep({ value, onChange }: { value: PhoneForm; onChange: (value: PhoneForm) => void }) {
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="Country code" value={value.phoneCountryCode} onChange={(phoneCountryCode) => onChange({ ...value, phoneCountryCode })} />
        <Field label="Mobile number" required value={value.phoneNumber} onChange={(phoneNumber) => onChange({ ...value, phoneNumber })} inputMode="tel" />
      </div>
      <fieldset>
        <legend className="text-sm font-black">Is WhatsApp already active on this number?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Choice selected={!value.whatsappActiveOnNumber} title="No" helper="Recommended for a new connection" onClick={() => onChange({ ...value, whatsappActiveOnNumber: false })} />
          <Choice selected={value.whatsappActiveOnNumber} title="Yes" helper="We will check migration or coexistence eligibility" onClick={() => onChange({ ...value, whatsappActiveOnNumber: true })} />
        </div>
      </fieldset>
      <div className="rounded-md border border-[#b9e9ca] bg-[#effbf3] p-4 text-sm leading-6 text-[#244c3d]">
        Keep access to this SIM. The secure connection flow may send an OTP by SMS or voice call.
      </div>
    </div>
  );
}

function ConnectStep({ configured, ready, kycApproved, connecting, onConnect }: { configured: boolean; ready: boolean; kycApproved: boolean; connecting: boolean; onConnect: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f8ee] text-2xl font-black text-[#8a6a16]">W</div>
      <h2 className="mt-5 text-2xl font-black">Connect your WhatsApp number</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#68645c]">A secure window will ask you to confirm your business and phone number. AiFrogi completes the technical setup automatically.</p>
      <Button className="mt-7 px-5 py-3 text-xs" disabled={!configured || !ready || !kycApproved || connecting} onClick={onConnect}>
        {connecting ? "Connecting" : "Connect WhatsApp"}
      </Button>
      {!configured ? <p className="mt-4 text-xs font-semibold text-[#a45f16]">Platform connection approval is being configured. You can return without losing progress.</p> : null}
      {configured && !kycApproved ? <p className="mt-4 text-xs font-semibold text-[#a45f16]">Business verification is under review. We will enable this button after approval.</p> : null}
      <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {["Business selected", "Number verified", "Messaging activated", "Webhook connected"].map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-md border border-black/6 bg-[#f8faf9] px-3 py-3 text-sm font-semibold"><span className="text-[#8a6a16]">✓</span>{item}</div>
        ))}
      </div>
    </div>
  );
}

function StatusStep({ onboarding, pending, rejected, live, onRefresh, saving }: { onboarding: OnboardingRecord | null; pending: boolean; rejected: boolean; live: boolean; onRefresh: () => void; saving: boolean }) {
  const title = live ? "Your WhatsApp account is live" : rejected ? "We need a small correction" : pending ? "We are completing your setup" : "Ready to connect";
  const helper = live ? "Messaging is ready." : rejected ? onboarding?.lastError || "Review the requested information and resubmit." : "Most accounts complete automatically. We will show any action required here.";
  const checks = [
    ["Business details", onboarding?.kycStatus !== "NOT_SUBMITTED"],
    ["Phone number", Boolean(onboarding?.phoneNumber)],
    ["Secure connection", onboarding?.facebookStatus === "CONNECTED"],
    ["Messaging activation", live]
  ] as const;
  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className={`rounded-lg border p-6 ${live ? "border-[#a7e5bd] bg-[#effbf3]" : rejected ? "border-[#f3b7b0] bg-[#fff3f1]" : "border-[#f0d4a4] bg-[#fff9ee]"}`}>
        <p className="text-xs font-black uppercase tracking-[0.16em]">{live ? "Live" : rejected ? "Action required" : "In progress"}</p>
        <h2 className="mt-3 text-2xl font-black">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5c6763]">{helper}</p>
      </div>
      <div className="mt-5 divide-y divide-black/6 rounded-lg border border-black/6">
        {checks.map(([label, complete]) => <div key={label} className="flex items-center justify-between px-4 py-4 text-sm font-semibold"><span>{label}</span><span className={complete ? "text-[#8a6a16]" : "text-[#a45f16]"}>{complete ? "Complete" : "Waiting"}</span></div>)}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-black/6 bg-[#f8faf9] p-4"><p className="product-eyebrow">You</p><p className="mt-2 text-sm font-semibold">Keep business details accurate and the phone SIM accessible.</p></div>
        <div className="rounded-md border border-black/6 bg-[#f8faf9] p-4"><p className="product-eyebrow">AiFrogi</p><p className="mt-2 text-sm font-semibold">Configures, checks, and reports any recoverable setup issue.</p></div>
        <div className="rounded-md border border-black/6 bg-[#f8faf9] p-4"><p className="product-eyebrow">Meta</p><p className="mt-2 text-sm font-semibold">Controls verification, review timing, templates, and quality status.</p></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button disabled={saving} onClick={onRefresh}>{saving ? "Checking" : "Refresh status"}</Button>
        <a className="inline-flex items-center rounded-md border border-black/10 bg-white px-4 py-2 text-xs font-black" href="mailto:info@aifrogi.com">Contact support</a>
      </div>
    </div>
  );
}

function LiveStep({ organization, onOpen }: { organization: CustomerOnboardingOrganization | null; onOpen: () => void }) {
  const usesWhatsApp = organization?.botProfile?.channels?.includes("WHATSAPP") ?? false;
  return (
    <div className="mx-auto max-w-xl py-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#25d366] text-3xl font-black text-[#063f3a]">✓</div>
      <h2 className="mt-6 text-3xl font-black">{usesWhatsApp ? "Your WhatsApp workspace is live" : "Your AI Business Bot foundation is ready"}</h2>
      <p className="mt-3 text-sm leading-6 text-[#68645c]">{usesWhatsApp ? `${organization?.onboarding?.displayPhoneNumber || organization?.name} is ready for inbound and outbound messaging.` : "Open Business Intelligence to approve sources, test grounded answers, and prepare the website widget."}</p>
      <Button className="mt-7 px-5 py-3" onClick={onOpen}>{usesWhatsApp ? "Go to inbox" : "Open intelligence"}</Button>
    </div>
  );
}

function Choice({ selected, title, helper, onClick }: { selected: boolean; title: string; helper: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-md border p-4 text-left ${selected ? "border-[#8a6a16] bg-[#effbf3]" : "border-black/10 bg-white"}`}><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-[#68645c]">{helper}</span></button>;
}

function Field({ label, value, onChange, placeholder, required, optional, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; optional?: boolean; inputMode?: "tel" | "url" | "email" | "text" }) {
  return <label className="block"><FieldLabel label={label} required={required} optional={optional} /><input className="mt-2 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#8a6a16]" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} inputMode={inputMode} /></label>;
}

function FieldLabel({ label, required, optional }: { label: string; required?: boolean; optional?: boolean }) {
  return <span className="text-xs font-black uppercase tracking-[0.12em] text-[#59645f]">{label}{required ? " *" : optional ? " (optional)" : ""}</span>;
}
