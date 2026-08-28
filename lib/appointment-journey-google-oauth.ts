import { createHmac, timingSafeEqual } from "node:crypto";

const CALLBACK_PATH = "/api/appointment-journey/google/oauth/callback";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.app.created",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/drive.file"
];

type GoogleTokenPayload = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export type GoogleBusyPeriod = { start: string; end: string };

export type AppointmentWorkingHours = Record<string, {
  enabled?: boolean;
  start?: string;
  end?: string;
} | null>;

function baseUrl() {
  return (
    process.env.PUBLIC_BASE_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/$/, "") ||
    "https://aifrogi.com"
  );
}

export function getGoogleAppointmentOAuthConfig() {
  return {
    clientId: process.env.GOOGLE_APPOINTMENT_CLIENT_ID?.trim() || "",
    clientSecret: process.env.GOOGLE_APPOINTMENT_CLIENT_SECRET?.trim() || "",
    redirectUri:
      process.env.GOOGLE_APPOINTMENT_REDIRECT_URI?.trim() ||
      `${baseUrl()}${CALLBACK_PATH}`
  };
}

function stateSecret() {
  return (
    process.env.GOOGLE_APPOINTMENT_STATE_SECRET?.trim() ||
    process.env.APPOINTMENT_JOURNEY_HMAC_SECRET?.trim() ||
    process.env.AUTH_SESSION_SECRET?.trim() ||
    ""
  );
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function safeReturnTo(value?: string | null) {
  const candidate = String(value || "").trim();
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return "/settings/integrations";
  return candidate;
}

function sign(value: string) {
  const secret = stateSecret();
  if (!secret) throw new Error("Google Appointment OAuth state secret is not configured.");
  return createHmac("sha256", secret).update(value, "utf8").digest("base64url");
}

export function createGoogleAppointmentOAuthState(input: {
  tenantId: string;
  returnTo?: string | null;
  now?: Date;
}) {
  const issuedAt = input.now?.getTime() ?? Date.now();
  const payload = base64UrlJson({
    tenantId: input.tenantId,
    returnTo: safeReturnTo(input.returnTo),
    exp: issuedAt + 15 * 60 * 1000
  });
  return `${payload}.${sign(payload)}`;
}

export function parseGoogleAppointmentOAuthState(value?: string | null): {
  tenantId: string;
  returnTo: string;
} {
  const [payload, signature] = String(value || "").split(".");
  if (!payload || !signature) throw new Error("OAuth state is missing.");

  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new Error("OAuth state signature is invalid.");
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    tenantId?: string;
    returnTo?: string;
    exp?: number;
  };
  if (!parsed.tenantId) throw new Error("OAuth state tenant is missing.");
  if (!parsed.exp || parsed.exp < Date.now()) throw new Error("OAuth state has expired.");

  return {
    tenantId: parsed.tenantId,
    returnTo: safeReturnTo(parsed.returnTo)
  };
}

export function buildGoogleAppointmentOAuthUrl(input: {
  tenantId: string;
  returnTo?: string | null;
}) {
  const config = getGoogleAppointmentOAuthConfig();
  if (!config.clientId) throw new Error("GOOGLE_APPOINTMENT_CLIENT_ID is not configured.");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", createGoogleAppointmentOAuthState(input));
  return url.toString();
}

export async function exchangeGoogleAppointmentCode(code: string) {
  const config = getGoogleAppointmentOAuthConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error("Google Appointment OAuth client is not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code"
    }),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => null) as GoogleTokenPayload | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || "Google OAuth token exchange failed.");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || "",
    expiresIn: payload.expires_in || 0,
    scope: payload.scope || ""
  };
}

export async function refreshGoogleAppointmentAccessToken(refreshToken: string) {
  const config = getGoogleAppointmentOAuthConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error("Google Appointment OAuth client is not configured.");
  }
  if (!refreshToken.trim()) throw new Error("Google Appointment refresh token is missing.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token"
    }),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => null) as GoogleTokenPayload | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || "Google access-token refresh failed.");
  }
  return payload.access_token;
}

async function googleJson<T>(input: {
  url: string;
  accessToken: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}) {
  const response = await fetch(input.url, {
    method: input.method || "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json"
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => null) as (T & { error?: { message?: string } }) | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Google API request failed with status ${response.status}.`);
  }
  return payload as T;
}

export async function createAppointmentGoogleResources(input: {
  accessToken: string;
  tenantName: string;
  timezone: string;
}) {
  const calendar = await googleJson<{ id?: string }>({
    url: "https://www.googleapis.com/calendar/v3/calendars",
    accessToken: input.accessToken,
    method: "POST",
    body: {
      summary: `Appointment Journey - ${input.tenantName}`,
      timeZone: input.timezone || "Asia/Kolkata"
    }
  });
  if (!calendar.id) throw new Error("Google Calendar was created without an ID.");

  const spreadsheet = await googleJson<{ spreadsheetId?: string }>({
    url: "https://sheets.googleapis.com/v4/spreadsheets",
    accessToken: input.accessToken,
    method: "POST",
    body: {
      properties: { title: `Appointment Journey - ${input.tenantName}` },
      sheets: [
        { properties: { title: "Settings" } },
        { properties: { title: "Services" } },
        { properties: { title: "Bookings" } },
        { properties: { title: "Feedback" } }
      ]
    }
  });
  if (!spreadsheet.spreadsheetId) throw new Error("Google Sheet was created without an ID.");

  await initializeAppointmentGoogleSheet({
    accessToken: input.accessToken,
    sheetId: spreadsheet.spreadsheetId,
    timezone: input.timezone
  });

  return {
    calendarId: calendar.id,
    sheetId: spreadsheet.spreadsheetId
  };
}

async function initializeAppointmentGoogleSheet(input: {
  accessToken: string;
  sheetId: string;
  timezone: string;
}) {
  await googleJson({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(input.sheetId)}/values:batchUpdate`,
    accessToken: input.accessToken,
    method: "POST",
    body: {
      valueInputOption: "RAW",
      data: [
        {
          range: "Settings!A1:B5",
          values: [
            ["Setting", "Value"],
            ["Timezone", input.timezone || "Asia/Kolkata"],
            ["Working days", "Monday-Saturday"],
            ["Working hours", "09:00-18:00"],
            ["Payment enabled", "FALSE"]
          ]
        },
        {
          range: "Services!A1:E1",
          values: [["Service ID", "Name", "Duration minutes", "Price INR", "Active"]]
        },
        {
          range: "Bookings!A1:J1",
          values: [["Booking ID", "Created at", "Customer", "Phone", "Service", "Start", "End", "Status", "Payment", "Calendar event ID"]]
        },
        {
          range: "Feedback!A1:F1",
          values: [["Booking ID", "Customer", "Phone", "Rating", "Comment", "Submitted at"]]
        }
      ]
    }
  });
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return representedAsUtc - date.getTime();
}

function zonedDateTimeToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timeZone: string;
}) {
  const guess = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute));
  const first = new Date(guess.getTime() - timeZoneOffsetMs(guess, input.timeZone));
  return new Date(guess.getTime() - timeZoneOffsetMs(first, input.timeZone));
}

function localDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: String(values.weekday || "").toLowerCase()
  };
}

function workingWindow(workingHours: AppointmentWorkingHours | null | undefined, weekday: string) {
  const aliases: Record<string, string[]> = {
    sun: ["sun", "sunday", "0"],
    mon: ["mon", "monday", "1"],
    tue: ["tue", "tuesday", "2"],
    wed: ["wed", "wednesday", "3"],
    thu: ["thu", "thursday", "4"],
    fri: ["fri", "friday", "5"],
    sat: ["sat", "saturday", "6"]
  };
  const configuredKey = aliases[weekday]?.find((key) => workingHours && key in workingHours);
  const configured = configuredKey ? workingHours?.[configuredKey] : undefined;
  if (configured === null || configured?.enabled === false) return null;
  if (configured) return { start: configured.start || "09:00", end: configured.end || "18:00" };
  if (weekday === "sun") return null;
  return { start: "09:00", end: "18:00" };
}

function parseClock(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function computeAppointmentSlots(input: {
  now: Date;
  timeZone: string;
  durationMin: number;
  workingHours?: AppointmentWorkingHours | null;
  busy?: GoogleBusyPeriod[];
  days?: number;
  limit?: number;
}) {
  const durationMs = Math.max(5, input.durationMin) * 60 * 1000;
  const earliest = input.now.getTime() + 30 * 60 * 1000;
  const busy = (input.busy || []).map((period) => ({
    start: new Date(period.start).getTime(),
    end: new Date(period.end).getTime()
  })).filter((period) => Number.isFinite(period.start) && Number.isFinite(period.end));
  const slots: string[] = [];

  for (let dayOffset = 0; dayOffset < (input.days || 7) && slots.length < (input.limit || 10); dayOffset += 1) {
    const probe = new Date(input.now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const local = localDateParts(probe, input.timeZone);
    const window = workingWindow(input.workingHours, local.weekday);
    if (!window) continue;
    const startClock = parseClock(window.start);
    const endClock = parseClock(window.end);
    if (!startClock || !endClock) continue;
    const dayStart = zonedDateTimeToUtc({ ...local, ...startClock, timeZone: input.timeZone }).getTime();
    const dayEnd = zonedDateTimeToUtc({ ...local, ...endClock, timeZone: input.timeZone }).getTime();

    for (let start = dayStart; start + durationMs <= dayEnd && slots.length < (input.limit || 10); start += durationMs) {
      const end = start + durationMs;
      if (start < earliest) continue;
      if (busy.some((period) => start < period.end && end > period.start)) continue;
      slots.push(new Date(start).toISOString());
    }
  }
  return slots;
}

export async function getGoogleAppointmentAvailableSlots(input: {
  accessToken: string;
  calendarId: string;
  timeZone: string;
  durationMin: number;
  workingHours?: AppointmentWorkingHours | null;
  now?: Date;
}) {
  const now = input.now || new Date();
  const timeMax = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
  const payload = await googleJson<{
    calendars?: Record<string, { busy?: GoogleBusyPeriod[] }>;
  }>({
    url: "https://www.googleapis.com/calendar/v3/freeBusy",
    accessToken: input.accessToken,
    method: "POST",
    body: {
      timeMin: now.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: input.timeZone,
      items: [{ id: input.calendarId }]
    }
  });
  return computeAppointmentSlots({
    now,
    timeZone: input.timeZone,
    durationMin: input.durationMin,
    workingHours: input.workingHours,
    busy: payload.calendars?.[input.calendarId]?.busy || [],
    days: 7,
    limit: 10
  });
}

export async function createGoogleAppointmentEvent(input: {
  accessToken: string;
  calendarId: string;
  timeZone: string;
  bookingId: string;
  tenantName: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  slotStart: Date;
  slotEnd: Date;
  status: "HOLD" | "CONFIRMED";
}) {
  const event = await googleJson<{ id?: string }>({
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events`,
    accessToken: input.accessToken,
    method: "POST",
    body: {
      summary: `${input.status === "HOLD" ? "Hold" : "Appointment"}: ${input.customerName} - ${input.serviceName}`,
      description: `Appointment Journey booking ${input.bookingId}\nCustomer phone: ${input.customerPhone}\nWorkspace: ${input.tenantName}`,
      start: { dateTime: input.slotStart.toISOString(), timeZone: input.timeZone },
      end: { dateTime: input.slotEnd.toISOString(), timeZone: input.timeZone },
      transparency: "opaque",
      extendedProperties: { private: { appointmentBookingId: input.bookingId } }
    }
  });
  if (!event.id) throw new Error("Google Calendar event was created without an ID.");
  return event.id;
}

export async function deleteGoogleAppointmentEvent(input: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}) {
  await googleJson({
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    accessToken: input.accessToken,
    method: "DELETE"
  });
}

export async function appendAppointmentBookingToSheet(input: {
  accessToken: string;
  sheetId: string;
  booking: {
    id: string;
    createdAt: Date;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    slotStart: Date;
    slotEnd: Date;
    status: string;
    paymentStatus: string;
    gcalEventId?: string | null;
  };
}) {
  await googleJson({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(input.sheetId)}/values/Bookings!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken: input.accessToken,
    method: "POST",
    body: {
      values: [[
        input.booking.id,
        input.booking.createdAt.toISOString(),
        input.booking.customerName,
        input.booking.customerPhone,
        input.booking.serviceName,
        input.booking.slotStart.toISOString(),
        input.booking.slotEnd.toISOString(),
        input.booking.status,
        input.booking.paymentStatus,
        input.booking.gcalEventId || ""
      ]]
    }
  });
}
