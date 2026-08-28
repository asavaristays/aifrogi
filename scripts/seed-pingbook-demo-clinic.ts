import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";
import { Prisma } from "@/generated/prisma/client";

type DemoProfile = {
  demoId: string;
  clinic: {
    name: string;
    city: string;
    timezone: string;
    reviewLink: string;
  };
  services: Array<{
    name: string;
    durationMinutes: number;
    bookingFee: number;
  }>;
  commercialTerms: {
    quarterlyPlatformFee: number;
    trialRefundWindowDays: number;
    refundProcessingTime: string;
  };
  clinicPolicy: {
    patientCancellationCutoffHours: number;
    slotHoldMinutes: number;
  };
};

const DEMO_ORG_SLUG = "pingbook-demo-clinic";
const DEMO_OWNER_EMAIL = "demo-clinic@aifrogi.com";
const DEMO_OWNER_NAME = "Demo Clinic Owner";
const DEMO_PHONE = "+910000000000";

function readDemoProfile() {
  const filePath = path.join(process.cwd(), "data", "pingbook-demo-clinic.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as DemoProfile;
}

function appointmentWorkingHours(): Prisma.InputJsonValue {
  return {
    monday: { start: "10:00", end: "20:00", breaks: [{ start: "13:00", end: "16:00" }] },
    tuesday: { start: "10:00", end: "20:00", breaks: [{ start: "13:00", end: "16:00" }] },
    wednesday: { start: "10:00", end: "20:00", breaks: [{ start: "13:00", end: "16:00" }] },
    thursday: { start: "10:00", end: "20:00", breaks: [{ start: "13:00", end: "16:00" }] },
    friday: { start: "10:00", end: "20:00", breaks: [{ start: "13:00", end: "16:00" }] },
    saturday: { start: "10:00", end: "20:00", breaks: [{ start: "13:00", end: "16:00" }] }
  };
}

function tomorrowAt1830() {
  const slot = new Date();
  slot.setDate(slot.getDate() + 1);
  slot.setHours(13, 0, 0, 0); // 18:30 Asia/Kolkata as UTC-like stored timestamp for demo.
  return slot;
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDb }, billing, appointmentJourney] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/billing-super-admin"),
    import("@/lib/appointment-journey-service")
  ]);
  const db = getDb();
  if (!db) throw new Error("Database unavailable for PingBook demo seeding.");
  const profile = readDemoProfile();

  await billing.ensureBillingPlans();

  const organization = await db.organization.upsert({
    where: { slug: DEMO_ORG_SLUG },
    update: {
      name: profile.clinic.name,
      industry: "Clinic",
      country: "India",
      timezone: profile.clinic.timezone,
      businessAddress: profile.clinic.city,
      ownerName: DEMO_OWNER_NAME,
      ownerEmail: DEMO_OWNER_EMAIL,
      ownerMobile: DEMO_PHONE,
      status: "ACTIVE",
      plan: "PINGBOOK"
    },
    create: {
      name: profile.clinic.name,
      slug: DEMO_ORG_SLUG,
      industry: "Clinic",
      country: "India",
      timezone: profile.clinic.timezone,
      businessAddress: profile.clinic.city,
      ownerName: DEMO_OWNER_NAME,
      ownerEmail: DEMO_OWNER_EMAIL,
      ownerMobile: DEMO_PHONE,
      status: "ACTIVE",
      plan: "PINGBOOK"
    }
  });

  await db.organizationMember.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: DEMO_OWNER_EMAIL } },
    update: { name: DEMO_OWNER_NAME, role: "OWNER", status: "ACTIVE", joinedAt: new Date() },
    create: {
      organizationId: organization.id,
      email: DEMO_OWNER_EMAIL,
      name: DEMO_OWNER_NAME,
      role: "OWNER",
      status: "ACTIVE",
      joinedAt: new Date()
    }
  });

  await db.onboardingProfile.upsert({
    where: { organizationId: organization.id },
    update: {
      currentStep: 6,
      progressPercent: 95,
      lifecycleStatus: "DEMO_READY",
      businessCategory: "Clinic appointment automation",
      kycStatus: "APPROVED",
      phoneVerificationStatus: "DEMO_READY",
      facebookStatus: "DEMO_READY",
      metaStatus: "DEMO_READY",
      webhookStatus: "DEMO_READY",
      tokenStatus: "DEMO_READY",
      metaBillingStatus: "DEMO_READY",
      templateStatus: "DEMO_READY",
      firstMessageStatus: "DEMO_READY",
      completedAt: new Date()
    },
    create: {
      organizationId: organization.id,
      currentStep: 6,
      progressPercent: 95,
      lifecycleStatus: "DEMO_READY",
      businessCategory: "Clinic appointment automation",
      kycStatus: "APPROVED",
      phoneVerificationStatus: "DEMO_READY",
      facebookStatus: "DEMO_READY",
      metaStatus: "DEMO_READY",
      webhookStatus: "DEMO_READY",
      tokenStatus: "DEMO_READY",
      metaBillingStatus: "DEMO_READY",
      templateStatus: "DEMO_READY",
      firstMessageStatus: "DEMO_READY",
      completedAt: new Date()
    }
  });

  const property = await db.property.upsert({
    where: { slug: DEMO_ORG_SLUG },
    update: {
      organizationId: organization.id,
      name: profile.clinic.name,
      city: profile.clinic.city,
      state: "Goa",
      timezone: profile.clinic.timezone
    },
    create: {
      organizationId: organization.id,
      name: profile.clinic.name,
      slug: DEMO_ORG_SLUG,
      city: profile.clinic.city,
      state: "Goa",
      timezone: profile.clinic.timezone
    }
  });

  const subscription = await billing.updateOrganizationPlan({
    organizationId: organization.id,
    planCode: "PINGBOOK",
    actorEmail: "system@aifrogi.com"
  });

  const provisioned = await appointmentJourney.provisionAppointmentTenant({
    propertySlug: property.slug,
    aifrogiTenantId: DEMO_ORG_SLUG,
    name: profile.clinic.name,
    timezone: profile.clinic.timezone,
    razorpayEnabled: true,
    reviewLink: profile.clinic.reviewLink,
    workingHours: appointmentWorkingHours(),
    services: profile.services.map((service) => ({
      name: service.name,
      durationMin: service.durationMinutes,
      priceInr: service.bookingFee
    }))
  });
  if (provisioned.error || !provisioned.tenant) throw new Error(provisioned.error || "PingBook tenant provisioning failed.");

  const tenant = await db.appointmentTenant.update({
    where: { id: provisioned.tenant.id },
    data: {
      status: "DEMO_READY",
      calendarId: "demo-aarogya-smile-calendar",
      sheetId: "demo-aarogya-smile-bookings",
      workingHours: {
        ...(appointmentWorkingHours() as Record<string, unknown>),
        policy: {
          cancellationCutoffHours: profile.clinicPolicy.patientCancellationCutoffHours,
          refundWindowDays: profile.commercialTerms.trialRefundWindowDays,
          refundProcessingTime: profile.commercialTerms.refundProcessingTime,
          slotHoldMinutes: profile.clinicPolicy.slotHoldMinutes
        }
      } as Prisma.InputJsonValue
    },
    include: { services: { orderBy: { sortOrder: "asc" } } }
  });

  const cleaning = tenant.services.find((service) => service.name === "Dental cleaning") || tenant.services[0];
  const slotStart = tomorrowAt1830();
  const slotEnd = new Date(slotStart.getTime() + cleaning.durationMin * 60 * 1000);
  await db.appointmentBooking.deleteMany({
    where: {
      tenantId: tenant.id,
      customerPhone: "919876543210",
      sourceMessageId: "demo-pingbook-booking"
    }
  });
  const booking = await db.appointmentBooking.create({
    data: {
      tenantId: tenant.id,
      serviceId: cleaning.id,
      customerPhone: "919876543210",
      customerName: "Aisha Rao",
      slotStart,
      slotEnd,
      activeSlotKey: `demo:${tenant.id}:${slotStart.toISOString()}`,
      gcalEventId: "demo-calendar-event-001",
      status: "CONFIRMED",
      paymentStatus: cleaning.priceInr > 0 ? "PAID" : "NOT_REQUIRED",
      paymentLinkId: cleaning.priceInr > 0 ? "demo-razorpay-link-001" : null,
      sourceMessageId: "demo-pingbook-booking"
    }
  });
  if (cleaning.priceInr > 0) {
    await db.appointmentPayment.upsert({
      where: { paymentLinkId: "demo-razorpay-link-001" },
      update: {
        tenantId: tenant.id,
        bookingId: booking.id,
        amountPaisa: cleaning.priceInr * 100,
        status: "PAID",
        rawPayload: { demo: true, source: profile.demoId }
      },
      create: {
        tenantId: tenant.id,
        bookingId: booking.id,
        paymentLinkId: "demo-razorpay-link-001",
        externalPaymentId: "demo-payment-001",
        amountPaisa: cleaning.priceInr * 100,
        status: "PAID",
        rawPayload: { demo: true, source: profile.demoId }
      }
    });
  }

  await db.appointmentSheetSyncState.upsert({
    where: { tenantId_tabName: { tenantId: tenant.id, tabName: "Bookings" } },
    update: { cursor: booking.id, lastSyncedAt: new Date(), lastError: null },
    create: { tenantId: tenant.id, tabName: "Bookings", cursor: booking.id, lastSyncedAt: new Date() }
  });

  await db.platformAuditLog.create({
    data: {
      organizationId: organization.id,
      actorEmail: "system@aifrogi.com",
      actorRole: "SYSTEM",
      action: "PINGBOOK_DEMO_SEEDED",
      targetType: "AppointmentTenant",
      targetId: tenant.id,
      summary: "Seeded PingBook demo clinic workspace for sales and onboarding readiness.",
      metadata: {
        demoId: profile.demoId,
        propertySlug: property.slug,
        subscriptionId: subscription?.id || null,
        cancellationCutoffHours: profile.clinicPolicy.patientCancellationCutoffHours
      }
    }
  });

  console.log(JSON.stringify({
    demoId: profile.demoId,
    organizationId: organization.id,
    propertySlug: property.slug,
    plan: "PINGBOOK",
    tenantStatus: tenant.status,
    services: tenant.services.length,
    sampleBookingId: booking.id
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  const { getDb } = await import("@/lib/db");
  await getDb()?.$disconnect();
});
