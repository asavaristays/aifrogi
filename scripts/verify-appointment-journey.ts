import { loadEnvConfig } from "@next/env";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  process.env.APPOINTMENT_JOURNEY_HMAC_SECRET ||= "appointment-verifier-secret";
  process.env.GOOGLE_APPOINTMENT_CLIENT_ID ||= "appointment-test-client.apps.googleusercontent.com";
  process.env.GOOGLE_APPOINTMENT_CLIENT_SECRET ||= "appointment-test-secret";
  process.env.GOOGLE_APPOINTMENT_REDIRECT_URI ||= "https://aifrogi.com/api/appointment-journey/google/oauth/callback";
  const configuredRedirectUri = process.env.GOOGLE_APPOINTMENT_REDIRECT_URI;

  const [{ parseAppointmentInboundEvent, signAppointmentPayload, validateAppointmentSignature }, state, google] = await Promise.all([
    import("@/lib/appointment-journey-contract"),
    import("@/lib/appointment-journey-state"),
    import("@/lib/appointment-journey-google-oauth")
  ]);

  const rawBody = JSON.stringify({
    tenant_id: "clinic_042",
    customer_phone: "9876543210",
    event_type: "text",
    payload: { text: "Need appointment tomorrow" },
    message_id: "wamid.verify.1",
    timestamp: 1751702400
  });
  const signature = signAppointmentPayload(rawBody);
  assert(validateAppointmentSignature({ rawBody, signatureHeader: signature }).ok, "Valid HMAC signature was rejected.");
  assert(!validateAppointmentSignature({ rawBody, signatureHeader: "sha256=" + "0".repeat(64) }).ok, "Invalid HMAC signature was accepted.");

  const oauthUrl = new URL(google.buildGoogleAppointmentOAuthUrl({ tenantId: "tenant_verify", returnTo: "/settings/integrations" }));
  assert(oauthUrl.searchParams.get("redirect_uri") === configuredRedirectUri, "Google OAuth redirect URI is wrong.");
  assert(oauthUrl.searchParams.get("access_type") === "offline", "Google OAuth must request offline access.");
  assert(oauthUrl.searchParams.get("scope")?.includes("https://www.googleapis.com/auth/calendar.app.created"), "Google OAuth must request app-created calendar access.");
  assert(oauthUrl.searchParams.get("scope")?.includes("https://www.googleapis.com/auth/drive.file"), "Google OAuth must request per-file Drive access.");
  const parsedState = google.parseGoogleAppointmentOAuthState(oauthUrl.searchParams.get("state"));
  assert(parsedState.tenantId === "tenant_verify", "Google OAuth state did not round-trip tenantId.");

  const firstEvent = parseAppointmentInboundEvent(JSON.parse(rawBody));
  assert(firstEvent.customer_phone === "919876543210", "Indian 10-digit phone was not normalized.");

  const config = {
    razorpayEnabled: false,
    services: [
      { id: "svc-consult", name: "Consultation", durationMin: 30, priceInr: 500 },
      { id: "svc-followup", name: "Follow-up", durationMin: 15, priceInr: 0 }
    ]
  };

  const first = state.transitionAppointmentState({
    state: { status: state.APPOINTMENT_SESSION_STATUS.IDLE },
    event: firstEvent,
    config
  });
  assert(first.nextState.status === state.APPOINTMENT_SESSION_STATUS.SERVICE_SELECT, "Idle session did not enter service selection.");
  assert(first.actions[0]?.type === "send_service_list", "Service list action was not reserved.");

  const serviceSelected = state.transitionAppointmentState({
    state: first.nextState,
    event: parseAppointmentInboundEvent({
      tenant_id: "clinic_042",
      customer_phone: "919876543210",
      event_type: "list_reply",
      payload: { reply_id: "svc-consult" },
      message_id: "wamid.verify.2",
      timestamp: 1751702460
    }),
    config
  });
  assert(serviceSelected.nextState.status === state.APPOINTMENT_SESSION_STATUS.COLLECT_NAME, "Service selection did not ask for name.");
  assert(serviceSelected.actions[0]?.type === "ask_customer_name", "Name collection action was not reserved.");

  const numericServiceSelected = state.transitionAppointmentState({
    state: first.nextState,
    event: parseAppointmentInboundEvent({
      tenant_id: "clinic_042",
      customer_phone: "919876543210",
      event_type: "text",
      payload: { text: "1" },
      message_id: "wamid.verify.numeric-service",
      timestamp: 1751702470
    }),
    config
  });
  assert(numericServiceSelected.nextState.selectedServiceId === "svc-consult", "Numeric service selection did not resolve the first service.");

  const nameCaptured = state.transitionAppointmentState({
    state: serviceSelected.nextState,
    event: parseAppointmentInboundEvent({
      tenant_id: "clinic_042",
      customer_phone: "919876543210",
      event_type: "text",
      payload: { text: "Manish" },
      message_id: "wamid.verify.3",
      timestamp: 1751702520
    }),
    config
  });
  assert(nameCaptured.nextState.status === state.APPOINTMENT_SESSION_STATUS.SLOT_SELECT, "Name capture did not move to slot selection.");
  assert(nameCaptured.actions[0]?.type === "send_slot_list", "Slot list action was not reserved.");

  const slotIso = "2026-07-08T10:30:00+05:30";
  const confirmed = state.transitionAppointmentState({
    state: nameCaptured.nextState,
    event: parseAppointmentInboundEvent({
      tenant_id: "clinic_042",
      customer_phone: "919876543210",
      event_type: "list_reply",
      payload: { reply_id: `slot_${slotIso}` },
      message_id: "wamid.verify.4",
      timestamp: 1751702580
    }),
    config
  });
  assert(confirmed.nextState.status === state.APPOINTMENT_SESSION_STATUS.CONFIRMED, "No-payment slot selection did not confirm.");
  assert(confirmed.actions.some((action) => action.type === "create_hold"), "Hold action was not reserved.");
  assert(confirmed.actions.some((action) => action.type === "confirm_without_payment"), "No-payment confirmation action was not reserved.");

  const numericSlot = state.transitionAppointmentState({
    state: { ...nameCaptured.nextState, offeredSlots: [new Date(slotIso).toISOString()] },
    event: parseAppointmentInboundEvent({
      tenant_id: "clinic_042",
      customer_phone: "919876543210",
      event_type: "text",
      payload: { text: "1" },
      message_id: "wamid.verify.numeric-slot",
      timestamp: 1751702590
    }),
    config
  });
  assert(numericSlot.nextState.status === state.APPOINTMENT_SESSION_STATUS.CONFIRMED, "Numeric slot selection did not confirm.");

  const paid = state.transitionAppointmentState({
    state: nameCaptured.nextState,
    event: parseAppointmentInboundEvent({
      tenant_id: "clinic_042",
      customer_phone: "919876543210",
      event_type: "list_reply",
      payload: { reply_id: `slot_${slotIso}` },
      message_id: "wamid.verify.5",
      timestamp: 1751702640
    }),
    config: { ...config, razorpayEnabled: true }
  });
  assert(paid.nextState.status === state.APPOINTMENT_SESSION_STATUS.AWAITING_PAYMENT, "Payment-enabled slot did not move to awaiting payment.");
  assert(paid.actions.some((action) => action.type === "create_payment_link"), "Payment link action was not reserved.");

  const computedSlots = google.computeAppointmentSlots({
    now: new Date("2026-07-06T02:00:00.000Z"),
    timeZone: "Asia/Kolkata",
    durationMin: 30,
    workingHours: {
      monday: { start: "09:00", end: "11:00" }
    },
    busy: [{ start: "2026-07-06T04:00:00.000Z", end: "2026-07-06T04:30:00.000Z" }],
    days: 1,
    limit: 10
  });
  assert(computedSlots.join(",") === [
    "2026-07-06T03:30:00.000Z",
    "2026-07-06T04:30:00.000Z",
    "2026-07-06T05:00:00.000Z"
  ].join(","), "Working-hours and free/busy slot calculation is wrong.");

  const originalFetch = globalThis.fetch;
  const googleCalls: Array<{ url: string; method: string; body: string }> = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || "GET";
    googleCalls.push({ url, method, body: String(init?.body || "") });
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "access-verify" }), { status: 200 });
    }
    if (url.endsWith("/calendar/v3/calendars")) {
      return new Response(JSON.stringify({ id: "calendar-verify" }), { status: 200 });
    }
    if (url.endsWith("/v4/spreadsheets")) {
      return new Response(JSON.stringify({ spreadsheetId: "sheet-verify" }), { status: 200 });
    }
    if (url.includes("values:batchUpdate")) {
      return new Response(JSON.stringify({ totalUpdatedRows: 4 }), { status: 200 });
    }
    if (url.endsWith("/calendar/v3/freeBusy")) {
      return new Response(JSON.stringify({ calendars: { "calendar-verify": { busy: [] } } }), { status: 200 });
    }
    if (url.endsWith("/calendars/calendar-verify/events") && method === "POST") {
      return new Response(JSON.stringify({ id: "event-verify" }), { status: 200 });
    }
    if (url.includes("/values/Bookings!A:J:append")) {
      return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), { status: 200 });
    }
    if (url.endsWith("/events/event-verify") && method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    return new Response(JSON.stringify({ error: { message: `Unexpected verifier URL: ${url}` } }), { status: 500 });
  };

  try {
    const refreshed = await google.refreshGoogleAppointmentAccessToken("refresh-verify");
    assert(refreshed === "access-verify", "Google refresh-token exchange failed verification.");
    const resources = await google.createAppointmentGoogleResources({
      accessToken: refreshed,
      tenantName: "Verifier",
      timezone: "Asia/Kolkata"
    });
    assert(resources.calendarId === "calendar-verify" && resources.sheetId === "sheet-verify", "Google resource provisioning failed verification.");
    assert(googleCalls.some((call) => call.url.includes("values:batchUpdate")), "Google Sheet headers were not initialized.");

    const liveSlots = await google.getGoogleAppointmentAvailableSlots({
      accessToken: refreshed,
      calendarId: resources.calendarId,
      timeZone: "Asia/Kolkata",
      durationMin: 30,
      workingHours: {
        monday: { start: "09:00", end: "11:00" },
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null
      },
      now: new Date("2026-07-06T02:00:00.000Z")
    });
    assert(liveSlots.length === 4, "Google free/busy response did not produce expected slots.");

    const eventId = await google.createGoogleAppointmentEvent({
      accessToken: refreshed,
      calendarId: resources.calendarId,
      timeZone: "Asia/Kolkata",
      bookingId: "booking-verify",
      tenantName: "Verifier",
      serviceName: "Consultation",
      customerName: "Manish",
      customerPhone: "919876543210",
      slotStart: new Date("2026-07-06T03:30:00.000Z"),
      slotEnd: new Date("2026-07-06T04:00:00.000Z"),
      status: "CONFIRMED"
    });
    assert(eventId === "event-verify", "Google Calendar event creation failed verification.");
    await google.appendAppointmentBookingToSheet({
      accessToken: refreshed,
      sheetId: resources.sheetId,
      booking: {
        id: "booking-verify",
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
        customerName: "Manish",
        customerPhone: "919876543210",
        serviceName: "Consultation",
        slotStart: new Date("2026-07-06T03:30:00.000Z"),
        slotEnd: new Date("2026-07-06T04:00:00.000Z"),
        status: "CONFIRMED",
        paymentStatus: "NOT_REQUIRED",
        gcalEventId: eventId
      }
    });
    await google.deleteGoogleAppointmentEvent({ accessToken: refreshed, calendarId: resources.calendarId, eventId });
    assert(googleCalls.some((call) => call.url.includes("Bookings!A:J:append")), "Google Sheet booking append was not called.");
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log("Appointment Journey contract, state machine, Calendar, and Sheet verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
