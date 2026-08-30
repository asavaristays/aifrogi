import {
  createOrganizationForOwner,
  getOrganizationForMember,
  listOrganizationsForAdmin,
  updateOnboardingProfile,
  updateOrganizationDetails
} from "@/lib/repositories/onboarding-repository";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createSlug(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return `${base || "workspace"}-${Math.random().toString(36).slice(2, 7)}`;
}

export type OnboardingOrganization = NonNullable<Awaited<ReturnType<typeof getOrganizationForMember>>>;

export async function loadOnboardingForUser(email: string) {
  return getOrganizationForMember(email.trim().toLowerCase());
}

export async function createOnboardingOrganization(email: string, payload: Record<string, unknown>) {
  const existing = await loadOnboardingForUser(email);
  if (existing) {
    return { error: "An organization already exists for this account", organization: existing, status: 409 };
  }

  const name = clean(payload.name);
  const ownerName = clean(payload.ownerName);
  const ownerMobile = clean(payload.ownerMobile);
  if (!name || !ownerName || !ownerMobile) {
    return { error: "Company name, owner name, and mobile number are required", organization: null, status: 400 };
  }

  const organization = await createOrganizationForOwner({
    name,
    slug: createSlug(name),
    industry: clean(payload.industry),
    website: clean(payload.website),
    country: clean(payload.country) || "India",
    timezone: clean(payload.timezone) || "Asia/Kolkata",
    gstNumber: clean(payload.gstNumber),
    businessAddress: clean(payload.businessAddress),
    ownerName,
    ownerEmail: email,
    ownerMobile
  });

  if (!organization) {
    return { error: "Database unavailable", organization: null, status: 503 };
  }

  return { error: null, organization, status: 201 };
}

export async function saveOnboardingStep(email: string, payload: Record<string, unknown>) {
  const organization = await loadOnboardingForUser(email);
  if (!organization?.onboarding) {
    return { error: "Create an organization before continuing", organization: null, status: 404 };
  }

  const step = Number(payload.step);
  if (!Number.isInteger(step) || step < 1 || step > 6) {
    return { error: "Invalid onboarding step", organization: null, status: 400 };
  }

  if (step === 1) {
    const updated = await updateOrganizationDetails(organization.id, {
      name: clean(payload.name) || organization.name,
      industry: clean(payload.industry) || undefined,
      website: clean(payload.website) || undefined,
      country: clean(payload.country) || organization.country,
      timezone: clean(payload.timezone) || organization.timezone,
      gstNumber: clean(payload.gstNumber) || undefined,
      businessAddress: clean(payload.businessAddress) || undefined,
      ownerName: clean(payload.ownerName) || organization.ownerName,
      ownerMobile: clean(payload.ownerMobile) || undefined,
      publicPhone: clean(payload.publicPhone) || null,
      publicEmail: clean(payload.publicEmail) || null,
      publicAddress: clean(payload.publicAddress) || null,
      publicBusinessHours: clean(payload.publicBusinessHours) || null
    });
    return { error: null, organization: updated, status: 200 };
  }

  if (step === 2) {
    const legalName = clean(payload.legalName);
    const businessCategory = clean(payload.businessCategory);
    if (!legalName || !businessCategory) {
      return { error: "Business legal name and category are required", organization: null, status: 400 };
    }

    const updated = await updateOnboardingProfile(
      organization.id,
      {
        legalName,
        registrationNumber: clean(payload.registrationNumber) || null,
        facebookPage: clean(payload.facebookPage) || null,
        googleMapsUrl: clean(payload.googleMapsUrl) || null,
        googleBusinessProfileUrl: clean(payload.googleBusinessProfileUrl) || null,
        instagramUrl: clean(payload.instagramUrl) || null,
        photoUrls: clean(payload.photoUrls).split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 50),
        businessCategory,
        logoUrl: clean(payload.logoUrl) || null,
        kycStatus: "SUBMITTED",
        kycSubmittedAt: new Date(),
        lifecycleStatus: "KYC_SUBMITTED",
        currentStep: 3,
        progressPercent: 40
      },
      { actorEmail: email, action: "KYC_SUBMITTED", detail: "Business details submitted for review" }
    );
    return { error: null, organization: updated, status: 200 };
  }

  if (step === 3) {
    const phoneNumber = clean(payload.phoneNumber).replace(/[^\d]/g, "");
    if (phoneNumber.length < 8) {
      return { error: "Enter a valid mobile number", organization: null, status: 400 };
    }

    const whatsappActive = Boolean(payload.whatsappActiveOnNumber);
    const updated = await updateOnboardingProfile(
      organization.id,
      {
        phoneCountryCode: clean(payload.phoneCountryCode) || "+91",
        phoneNumber,
        whatsappActiveOnNumber: whatsappActive,
        numberConnectionPath: whatsappActive ? "ELIGIBILITY_CHECK" : "NEW_NUMBER",
        phoneVerificationStatus: "READY_FOR_META",
        lifecycleStatus: "NUMBER_READY",
        currentStep: 4,
        progressPercent: 60
      },
      { actorEmail: email, action: "PHONE_NUMBER_ADDED", detail: "WhatsApp number is ready for connection" }
    );
    return { error: null, organization: updated, status: 200 };
  }

  if (step === 4) {
    const updated = await updateOnboardingProfile(
      organization.id,
      {
        currentStep: 4,
        progressPercent: Math.max(60, organization.onboarding.progressPercent),
        lifecycleStatus: organization.onboarding.facebookStatus === "CONNECTED" ? "WHATSAPP_CONFIGURING" : "NUMBER_READY"
      },
      { actorEmail: email, action: "META_CONNECTION_OPENED", detail: "Customer opened the secure WhatsApp connection step" }
    );
    return { error: null, organization: updated, status: 200 };
  }

  const updated = await updateOnboardingProfile(
    organization.id,
    {
      currentStep: step,
      progressPercent: step === 5 ? 85 : organization.onboarding.progressPercent
    },
    { actorEmail: email, action: "ONBOARDING_STATUS_VIEWED" }
  );
  return { error: null, organization: updated, status: 200 };
}

export async function loadAdminOrganizations() {
  return listOrganizationsForAdmin();
}
