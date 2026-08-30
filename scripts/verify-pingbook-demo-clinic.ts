import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  if (!db) throw new Error("Database unavailable for ClinicGPT demo verification.");
  const profile = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "pingbook-demo-clinic.json"), "utf8"));
  const organization = await db.organization.findUnique({
    where: { slug: "pingbook-demo-clinic" },
    include: {
      subscription: { include: { plan: true } },
      properties: {
        include: {
          appointmentTenants: {
            include: {
              services: { orderBy: { sortOrder: "asc" } },
              bookings: { orderBy: { createdAt: "desc" }, take: 5 },
              sheetSyncStates: true
            }
          }
        }
      }
    }
  });

  assert(organization, "Demo organization is missing.");
  assert(organization.industry === "Clinic", "Demo organization is not clinic-first.");
  assert(organization.plan === "PINGBOOK", "Demo organization plan is not PINGBOOK.");
  assert(organization.subscription?.plan.code === "PINGBOOK", "Demo subscription is not on the ClinicGPT plan.");
  assert(organization.subscription.status === "ACTIVE", "Demo subscription is not active.");

  const property = organization.properties.find((item) => item.slug === "pingbook-demo-clinic");
  assert(property, "Demo property is missing.");
  const tenant = property.appointmentTenants[0];
  assert(tenant, "Demo appointment tenant is missing.");
  assert(tenant.status === "DEMO_READY", "Demo appointment tenant is not ready.");
  assert(tenant.razorpayEnabled, "Demo appointment tenant should have Razorpay enabled.");
  assert(tenant.reviewLink === profile.clinic.reviewLink, "Demo review link does not match profile.");
  assert(tenant.services.length === profile.services.length, "Demo service count does not match profile.");
  assert(tenant.services.some((service) => service.name === "Dental cleaning" && service.priceInr === 500), "Dental cleaning service is missing or incorrectly priced.");
  assert(tenant.bookings.some((booking) => booking.customerName === "Aisha Rao" && booking.status === "CONFIRMED" && booking.paymentStatus === "PAID"), "Paid demo booking is missing.");
  assert(tenant.sheetSyncStates.some((state) => state.tabName === "Bookings" && state.cursor), "Bookings sheet sync state is missing.");

  console.log(JSON.stringify({
    demoId: profile.demoId,
    organization: organization.name,
    plan: organization.subscription.plan.code,
    tenantStatus: tenant.status,
    serviceCount: tenant.services.length,
    bookingCount: tenant.bookings.length,
    cancellationCutoffHours: profile.clinicPolicy.patientCancellationCutoffHours,
    refundProcessingTime: profile.commercialTerms.refundProcessingTime
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  const { getDb } = await import("@/lib/db");
  await getDb()?.$disconnect();
});
