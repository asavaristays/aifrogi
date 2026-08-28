import { loadEnvConfig } from "@next/env";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  process.env.GOOGLE_APPOINTMENT_CLIENT_ID ||= "integration-client.apps.googleusercontent.com";
  process.env.GOOGLE_APPOINTMENT_CLIENT_SECRET ||= "integration-client-secret";

  const [{ getDb }, { encryptSecretValue }, { processAppointmentInboundEvent }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/field-encryption"),
    import("@/lib/appointment-journey-service")
  ]);
  const db = getDb();
  if (!db) throw new Error("Database unavailable for Appointment Journey integration verification.");

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const slug = `appointment-verifier-${suffix}`;
  const phone = "919999999999";
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method: string }> = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || "GET";
    calls.push({ url, method });
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "integration-access-token" }), { status: 200 });
    }
    if (url.endsWith("/calendar/v3/freeBusy")) {
      return new Response(JSON.stringify({ calendars: { "integration-calendar": { busy: [] } } }), { status: 200 });
    }
    if (url.endsWith("/calendars/integration-calendar/events") && method === "POST") {
      return new Response(JSON.stringify({ id: "integration-event" }), { status: 200 });
    }
    if (url.endsWith("/events/integration-event") && method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (url.includes("/values/Bookings!A:J:append")) {
      return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: { message: `Unexpected integration URL: ${url}` } }), { status: 500 });
  };

  let propertyId = "";
  try {
    const property = await db.property.create({
      data: {
        name: "Appointment Integration Verifier",
        slug,
        timezone: "Asia/Kolkata",
        appointmentTenants: {
          create: {
            aifrogiTenantId: slug,
            name: "Appointment Integration Verifier",
            status: "GOOGLE_READY",
            timezone: "Asia/Kolkata",
            googleRefreshTokenEnc: encryptSecretValue("integration-refresh-token"),
            calendarId: "integration-calendar",
            sheetId: "integration-sheet",
            workingHours: {},
            services: {
              create: { name: "Consultation", durationMin: 30, priceInr: 0, sortOrder: 1 }
            }
          }
        }
      }
    });
    propertyId = property.id;

    const event = (messageId: string, text: string) => ({
      tenant_id: slug,
      customer_phone: phone,
      event_type: "text" as const,
      payload: { text },
      message_id: `${slug}-${messageId}`,
      timestamp: Math.floor(Date.now() / 1000)
    });

    const started = await processAppointmentInboundEvent(event("1", "Need an appointment"));
    assert(!started.error && started.result && "actions" in started.result, "Appointment journey did not start.");

    const selected = await processAppointmentInboundEvent(event("2", "1"));
    assert(!selected.error && selected.result && "actions" in selected.result, "Service selection failed.");

    const named = await processAppointmentInboundEvent(event("3", "Manish"));
    assert(!named.error && named.result && "actions" in named.result, "Customer-name capture failed.");
    const slotAction = named.result.actions?.find((action) => action.type === "send_slot_list");
    assert(slotAction?.type === "send_slot_list" && slotAction.slots?.length, "Google free/busy slots were not offered.");

    const booked = await processAppointmentInboundEvent(event("4", "1"));
    assert(!booked.error && booked.result && "bookingId" in booked.result && booked.result.bookingId, "Slot booking failed.");
    const booking = await db.appointmentBooking.findUnique({ where: { id: booked.result.bookingId } });
    assert(booking?.status === "CONFIRMED", "Booking was not confirmed after Calendar synchronization.");
    assert(booking.gcalEventId === "integration-event", "Google Calendar event ID was not stored.");
    const sheetState = await db.appointmentSheetSyncState.findUnique({
      where: { tenantId_tabName: { tenantId: booking.tenantId, tabName: "Bookings" } }
    });
    assert(sheetState?.cursor === booking.id && !sheetState.lastError, "Google Sheet booking synchronization was not recorded.");

    const cancelled = await processAppointmentInboundEvent(event("5", "cancel"));
    assert(!cancelled.error, "Appointment cancellation failed.");
    const cancelledBooking = await db.appointmentBooking.findUnique({ where: { id: booking.id } });
    assert(cancelledBooking?.status === "CANCELLED" && cancelledBooking.activeSlotKey === null, "Cancelled booking did not release its slot.");
    assert(calls.some((call) => call.url.endsWith("/events/integration-event") && call.method === "DELETE"), "Calendar event deletion was not called.");
    assert(calls.filter((call) => call.url.includes("Bookings!A:J:append")).length === 2, "Booking and cancellation Sheet rows were not both appended.");

    console.log("Appointment Journey Postgres, Calendar, and Sheet integration verification passed.");
  } finally {
    globalThis.fetch = originalFetch;
    if (propertyId) await db.property.delete({ where: { id: propertyId } }).catch(() => null);
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
