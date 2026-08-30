import { TRIAL_DAYS } from "@/lib/trial-policy";

export type OnboardingOwner = "You" | "AiFrogi" | "Meta";

export type OnboardingGuidanceRecord = {
  currentStep?: number | null;
  progressPercent?: number | null;
  lifecycleStatus?: string | null;
  kycStatus?: string | null;
  phoneNumber?: string | null;
  facebookStatus?: string | null;
  metaStatus?: string | null;
  webhookStatus?: string | null;
  tokenStatus?: string | null;
  templateStatus?: string | null;
  firstMessageStatus?: string | null;
  lastError?: string | null;
  completedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type OnboardingGuidanceOrganization = {
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  status?: string | null;
  plan?: string | null;
  ownerMobile?: string | null;
  businessAddress?: string | null;
  website?: string | null;
  onboarding?: OnboardingGuidanceRecord | null;
  documents?: Array<unknown>;
  botProfile?: { channels?: string[] | null; status?: string | null } | null;
};

export type OnboardingGuidance = {
  title: string;
  description: string;
  action: string;
  owner: OnboardingOwner;
  step: number;
  tone: "ready" | "waiting" | "urgent" | "info";
  eta: string;
  supportNote: string;
};

export type TrialWindow = {
  enabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  daysLeft: number | null;
  percentElapsed: number;
  label: string;
};

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getTrialWindow(organization: OnboardingGuidanceOrganization | null, now = new Date()): TrialWindow {
  if (!organization || (organization.plan || "").toUpperCase() !== "TRIAL") {
    return { enabled: false, startsAt: null, endsAt: null, daysLeft: null, percentElapsed: 0, label: "Plan active" };
  }

  const startsAt = asDate(organization.createdAt) || now;
  const endsAt = addDays(startsAt, TRIAL_DAYS);
  const totalMs = Math.max(1, endsAt.getTime() - startsAt.getTime());
  const elapsedMs = Math.max(0, Math.min(totalMs, now.getTime() - startsAt.getTime()));
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  return {
    enabled: true,
    startsAt,
    endsAt,
    daysLeft,
    percentElapsed: Math.round((elapsedMs / totalMs) * 100),
    label: daysLeft > 0 ? `${daysLeft} trial day${daysLeft === 1 ? "" : "s"} left` : "Trial ended · actions paused"
  };
}

export function getOnboardingGuidance(organization: OnboardingGuidanceOrganization | null): OnboardingGuidance {
  if (!organization) {
    return {
      title: "Create your organization",
      description: "Start with business identity and owner details so AiFrogi can create a private workspace.",
      action: "Create organization",
      owner: "You",
      step: 1,
      tone: "urgent",
      eta: "2 minutes",
      supportNote: "No workspace exists yet."
    };
  }

  const onboarding = organization.onboarding;
  const lifecycle = onboarding?.lifecycleStatus || "";
  const kyc = onboarding?.kycStatus || "NOT_SUBMITTED";
  const meta = onboarding?.metaStatus || "NOT_STARTED";
  const usesWhatsApp = organization.botProfile?.channels?.includes("WHATSAPP") ?? false;

  if (organization.status === "PENDING_EMAIL" || lifecycle === "EMAIL_VERIFICATION") {
    return {
      title: "Activate the owner login",
      description: "The workspace is reserved. The owner must open the activation email and create a personal password.",
      action: "Check activation email",
      owner: "You",
      step: 1,
      tone: "urgent",
      eta: "24-hour link",
      supportNote: "Registration is waiting for email verification."
    };
  }

  if (!organization.ownerMobile || !organization.businessAddress || !organization.website) {
    return {
      title: "Complete company basics",
      description: "Add the mobile number, business address, and website before verification. These details reduce review back-and-forth.",
      action: "Update organization",
      owner: "You",
      step: 1,
      tone: "urgent",
      eta: "3 minutes",
      supportNote: "Business profile is incomplete."
    };
  }

  if (kyc === "REJECTED") {
    return {
      title: "Update rejected business details",
      description: onboarding?.lastError || "Business information needs correction before WhatsApp setup can continue.",
      action: "Edit and resubmit",
      owner: "You",
      step: 2,
      tone: "urgent",
      eta: "Depends on correction",
      supportNote: "KYC was rejected and needs customer action."
    };
  }

  if (kyc === "NOT_SUBMITTED") {
    return {
      title: "Submit business verification",
      description: "Upload legal details and business proof once. AiFrogi will review before enabling secure Meta connection.",
      action: "Submit KYC",
      owner: "You",
      step: 2,
      tone: "urgent",
      eta: "5 minutes",
      supportNote: "KYC has not been submitted."
    };
  }

  if (kyc === "SUBMITTED") {
    return {
      title: "AiFrogi review is in progress",
      description: "Business details are submitted. Support should approve or request exact corrections.",
      action: "Await review",
      owner: "AiFrogi",
      step: 2,
      tone: "waiting",
      eta: "Same business day",
      supportNote: "Super Admin KYC review is pending."
    };
  }

  if (!usesWhatsApp) {
    if (organization.botProfile?.status !== "CONFIGURED") {
      return {
        title: "Design your AI Business Bot",
        description: "Choose the bot's business job, website channel, approved capabilities, and human authority before adding intelligence.",
        action: "Configure AI Bot",
        owner: "You",
        step: 2,
        tone: "urgent",
        eta: "3 minutes",
        supportNote: "Website AI Bot setup does not require a WhatsApp number or Meta account."
      };
    }
    return {
      title: "Build approved business intelligence",
      description: "Your Website AI Bot profile is ready. Add and approve business sources, test safe answers, and then publish the widget.",
      action: "Open intelligence",
      owner: "You",
      step: 6,
      tone: "ready",
      eta: "Ready now",
      supportNote: "The next proof is a grounded answer and consented lead captured from your website."
    };
  }

  if (!onboarding?.phoneNumber) {
    return {
      title: "Add the WhatsApp number",
      description: "Choose the number that will receive OTP or voice verification during secure setup.",
      action: "Add phone number",
      owner: "You",
      step: 3,
      tone: "urgent",
      eta: "2 minutes",
      supportNote: "KYC is approved; phone number is missing."
    };
  }

  if (onboarding.facebookStatus !== "CONNECTED") {
    return {
      title: "Connect Meta securely",
      description: "The customer approves the business and phone number through Facebook login. No passwords or permanent tokens are shared.",
      action: "Connect WhatsApp",
      owner: "You",
      step: 4,
      tone: "urgent",
      eta: "5-15 minutes",
      supportNote: "Phone is ready; embedded signup has not completed."
    };
  }

  if (meta === "REJECTED") {
    return {
      title: "Meta needs a correction",
      description: onboarding.lastError || "Meta returned an action item. Update the business or number details and resubmit.",
      action: "Review Meta issue",
      owner: "You",
      step: 5,
      tone: "urgent",
      eta: "After correction",
      supportNote: "Meta status is rejected."
    };
  }

  if (meta !== "LIVE") {
    return {
      title: "Waiting for Meta review",
      description: "The secure connection is done. AiFrogi is monitoring activation, webhook, token, and quality status.",
      action: "Refresh status",
      owner: "Meta",
      step: 5,
      tone: "waiting",
      eta: "10 minutes to 24 hours",
      supportNote: "Connected account is not live yet."
    };
  }

  if (onboarding.webhookStatus !== "CONNECTED" || onboarding.tokenStatus !== "ACTIVE") {
    return {
      title: "Complete platform health checks",
      description: "WhatsApp is live. AiFrogi must confirm webhook delivery, token health, and a first message test.",
      action: "Run health test",
      owner: "AiFrogi",
      step: 5,
      tone: "waiting",
      eta: "10 minutes",
      supportNote: "Live account still needs platform verification."
    };
  }

  if (onboarding.templateStatus !== "APPROVED") {
    return {
      title: "Approve the first message template",
      description: "AiFrogi is checking Meta for an approved template before customer-initiated outreach begins.",
      action: "Refresh template status",
      owner: onboarding.templateStatus === "REJECTED" ? "You" : "Meta",
      step: 6,
      tone: onboarding.templateStatus === "REJECTED" ? "urgent" : "waiting",
      eta: "Usually minutes to 24 hours",
      supportNote: "WhatsApp is connected; template approval is still pending."
    };
  }

  if (onboarding.firstMessageStatus !== "VERIFIED") {
    return {
      title: "Send the first test message",
      description: "Use an approved internal number. AiFrogi records provider acceptance as the final go-live proof.",
      action: "Send test message",
      owner: "You",
      step: 6,
      tone: "urgent",
      eta: "2 minutes",
      supportNote: "Connection and template are ready; first-message proof is pending."
    };
  }

  return {
    title: "Workspace is live",
    description: "Inbound, outbound, webhook, and credential checks are ready. The team can start messaging.",
    action: "Open inbox",
    owner: "AiFrogi",
    step: 6,
    tone: "ready",
    eta: "Live now",
    supportNote: "Customer is ready for normal operations."
  };
}
