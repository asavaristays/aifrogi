import { Prisma } from "../generated/prisma/client";
import { getDb } from "@/lib/db";
import { decryptSecretValue, encryptSecretValue } from "@/lib/field-encryption";
import type { AppointmentInboundEvent } from "@/lib/appointment-journey-contract";
import {
  appendAppointmentBookingToSheet,
  createGoogleAppointmentEvent,
  deleteGoogleAppointmentEvent,
  getGoogleAppointmentAvailableSlots,
  refreshGoogleAppointmentAccessToken,
  type AppointmentWorkingHours
} from "@/lib/appointment-journey-google-oauth";
import {
  APPOINTMENT_SESSION_STATUS,
  transitionAppointmentState,
  type AppointmentAction,
  type AppointmentServiceOption,
  type AppointmentState
} from "@/lib/appointment-journey-state";

const SESSION_TTL_MS = 30 * 60 * 1000;

export type ProvisionAppointmentTenantInput = {
  propertySlug: string;
  aifrogiTenantId: string;
  name?: string;
  timezone?: string;
  razorpayEnabled?: boolean;
  reviewLink?: string;
  workingHours?: Prisma.InputJsonValue;
  services?: Array<{
    name: string;
    durationMin?: number;
    priceInr?: number;
  }>;
};

export type AppointmentTenantSummary = {
  id: string;
  aifrogiTenantId: string;
  name: string;
  status: string;
  timezone: string;
  calendarId: string | null;
  sheetId: string | null;
  razorpayEnabled: boolean;
  serviceCount: number;
  bookingCount: number;
  hasGoogleConnection: boolean;
  updatedAtIso: string;
};

export type AppointmentJourneyAdminWorkspace = {
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  whatsappStatus: string;
  whatsappNumber: string | null;
  tenantId: string | null;
  appointmentStatus: string;
  googleReady: boolean;
};

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return {};
  return value as Prisma.InputJsonValue;
}

function defaultServices(input?: ProvisionAppointmentTenantInput["services"]) {
  const services = input?.filter((service) => service.name.trim()) ?? [];
  if (services.length) return services;
  return [{ name: "Appointment", durationMin: 30, priceInr: 0 }];
}

function normalizeState(session?: {
  status: string;
  selectedServiceId: string | null;
  customerName: string | null;
  selectedSlotStartIso: string | null;
  data: Prisma.JsonValue | null;
  expiresAt: Date;
} | null): AppointmentState {
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return { status: APPOINTMENT_SESSION_STATUS.IDLE };
  }

  const data = session.data && typeof session.data === "object" && !Array.isArray(session.data)
    ? session.data as Record<string, unknown>
    : {};

  return {
    status: Object.values(APPOINTMENT_SESSION_STATUS).includes(session.status as never)
      ? session.status as AppointmentState["status"]
      : APPOINTMENT_SESSION_STATUS.IDLE,
    selectedServiceId: session.selectedServiceId,
    customerName: session.customerName,
    selectedSlotStartIso: session.selectedSlotStartIso,
    offeredSlots: Array.isArray(data.offeredSlots)
      ? data.offeredSlots.filter((value): value is string => typeof value === "string")
      : [],
    retryCount: Number(data.retryCount || 0)
  };
}

function stateData(state: AppointmentState): Prisma.InputJsonValue {
  return { retryCount: state.retryCount ?? 0, offeredSlots: state.offeredSlots ?? [] };
}

function actionLabel(action: AppointmentAction) {
  return action.type;
}

function mapTenantSummary(tenant: {
  id: string;
  aifrogiTenantId: string;
  name: string;
  status: string;
  timezone: string;
  calendarId: string | null;
  sheetId: string | null;
  razorpayEnabled: boolean;
  googleRefreshTokenEnc: string | null;
  updatedAt: Date;
  _count: { services: number; bookings: number };
}): AppointmentTenantSummary {
  return {
    id: tenant.id,
    aifrogiTenantId: tenant.aifrogiTenantId,
    name: tenant.name,
    status: tenant.status,
    timezone: tenant.timezone,
    calendarId: tenant.calendarId,
    sheetId: tenant.sheetId,
    razorpayEnabled: tenant.razorpayEnabled,
    serviceCount: tenant._count.services,
    bookingCount: tenant._count.bookings,
    hasGoogleConnection: Boolean(tenant.googleRefreshTokenEnc),
    updatedAtIso: tenant.updatedAt.toISOString()
  };
}

export async function getOrCreateAppointmentTenantForProperty(propertySlug: string) {
  const db = getDb();
  if (!db) return { error: "Database unavailable.", status: 503 as const, tenant: null };

  const property = await db.property.findUnique({
    where: { slug: propertySlug },
    select: { id: true, name: true, slug: true, timezone: true }
  });
  if (!property) return { error: "Workspace not found.", status: 404 as const, tenant: null };

  const tenant = await db.$transaction(async (tx) => {
    const existing = await tx.appointmentTenant.findUnique({
      where: { propertyId: property.id },
      include: { _count: { select: { services: true, bookings: true } } }
    });
    if (existing) return existing;

    const created = await tx.appointmentTenant.create({
      data: {
        propertyId: property.id,
        aifrogiTenantId: property.slug,
        name: property.name,
        timezone: property.timezone || "Asia/Kolkata",
        workingHours: {}
      }
    });
    await tx.appointmentService.create({
      data: {
        tenantId: created.id,
        name: "Appointment",
        durationMin: 30,
        priceInr: 0,
        sortOrder: 1
      }
    });
    return tx.appointmentTenant.findUniqueOrThrow({
      where: { id: created.id },
      include: { _count: { select: { services: true, bookings: true } } }
    });
  });

  return { error: null, status: 200 as const, tenant: mapTenantSummary(tenant) };
}

export async function getAppointmentTenantForProperty(propertySlug: string) {
  const db = getDb();
  if (!db) return { error: "Database unavailable.", status: 503 as const, tenant: null };

  const tenant = await db.appointmentTenant.findFirst({
    where: { property: { slug: propertySlug } },
    include: { _count: { select: { services: true, bookings: true } } }
  });
  if (!tenant || tenant.status === "DISABLED") {
    return {
      error: "Appointment Journey has not been enabled by Super Admin for this workspace.",
      status: 404 as const,
      tenant: null
    };
  }

  return { error: null, status: 200 as const, tenant: mapTenantSummary(tenant) };
}

export async function getAppointmentJourneyAdminWorkspaces(organizationId?: string | null): Promise<AppointmentJourneyAdminWorkspace[]> {
  const db = getDb();
  if (!db) return [];

  const properties = await db.property.findMany({
    where: organizationId ? { organizationId } : undefined,
    select: {
      id: true,
      slug: true,
      name: true,
      whatsappIntegration: { select: { status: true, displayPhoneNumber: true } },
      appointmentTenants: {
        select: {
          id: true,
          status: true,
          googleRefreshTokenEnc: true,
          calendarId: true,
          sheetId: true
        },
        take: 1
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return properties.map((property) => {
    const tenant = property.appointmentTenants[0] || null;
    return {
      propertyId: property.id,
      propertySlug: property.slug,
      propertyName: property.name,
      whatsappStatus: property.whatsappIntegration?.status || "DISCONNECTED",
      whatsappNumber: property.whatsappIntegration?.displayPhoneNumber || null,
      tenantId: tenant?.id || null,
      appointmentStatus: tenant?.status || "DISABLED",
      googleReady: Boolean(
        tenant?.status === "GOOGLE_READY" &&
        tenant.googleRefreshTokenEnc &&
        tenant.calendarId &&
        tenant.sheetId
      )
    };
  });
}

export async function setAppointmentJourneyEnabled(input: {
  organizationId?: string | null;
  propertyId: string;
  enabled: boolean;
  actorEmail: string;
}) {
  const db = getDb();
  if (!db) return { error: "Database unavailable.", status: 503 as const };

  const property = await db.property.findFirst({
    where: { id: input.propertyId, ...(input.organizationId ? { organizationId: input.organizationId } : {}) },
    include: {
      whatsappIntegration: { select: { status: true } },
      appointmentTenants: { include: { _count: { select: { services: true } } }, take: 1 }
    }
  });
  if (!property) return { error: "Workspace not found for this customer.", status: 404 as const };
  if (input.enabled && property.whatsappIntegration?.status !== "CONNECTED") {
    return { error: "Connect and validate the workspace WhatsApp API before enabling Appointment Journey.", status: 409 as const };
  }

  await db.$transaction(async (tx) => {
    const existing = property.appointmentTenants[0] || null;
    if (!input.enabled) {
      if (existing) {
        await tx.appointmentTenant.update({ where: { id: existing.id }, data: { status: "DISABLED" } });
      }
    } else if (existing) {
      const connected = Boolean(existing.googleRefreshTokenEnc && existing.calendarId && existing.sheetId);
      await tx.appointmentTenant.update({
        where: { id: existing.id },
        data: { status: connected ? "GOOGLE_READY" : "AWAITING_GOOGLE" }
      });
      if (existing._count.services === 0) {
        await tx.appointmentService.create({
          data: { tenantId: existing.id, name: "Appointment", durationMin: 30, priceInr: 0, sortOrder: 1 }
        });
      }
    } else {
      await tx.appointmentTenant.create({
        data: {
          propertyId: property.id,
          aifrogiTenantId: property.slug,
          name: property.name,
          timezone: property.timezone || "Asia/Kolkata",
          status: "AWAITING_GOOGLE",
          workingHours: {},
          services: {
            create: { name: "Appointment", durationMin: 30, priceInr: 0, sortOrder: 1 }
          }
        }
      });
    }

    if (input.organizationId) {
      await tx.onboardingActivity.create({
        data: {
          organizationId: input.organizationId,
          actorEmail: input.actorEmail,
          action: input.enabled ? "APPOINTMENT_JOURNEY_ENABLED" : "APPOINTMENT_JOURNEY_DISABLED",
          detail: `${property.name} (${property.slug})`
        }
      });
    }
  });

  return { error: null, status: 200 as const };
}

export async function getAppointmentTenantOAuthContext(tenantId: string) {
  const db = getDb();
  if (!db) return null;
  return db.appointmentTenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      timezone: true,
      property: { select: { slug: true } }
    }
  });
}

export async function provisionAppointmentTenant(input: ProvisionAppointmentTenantInput) {
  const db = getDb();
  if (!db) return { error: "Database unavailable.", status: 503 as const, tenant: null };

  const propertySlug = input.propertySlug.trim();
  const aifrogiTenantId = input.aifrogiTenantId.trim();
  if (!propertySlug || !aifrogiTenantId) {
    return { error: "propertySlug and aifrogiTenantId are required.", status: 400 as const, tenant: null };
  }

  const property = await db.property.findUnique({ where: { slug: propertySlug }, select: { id: true, name: true, timezone: true } });
  if (!property) return { error: "Workspace not found.", status: 404 as const, tenant: null };

  const services = defaultServices(input.services);
  const tenant = await db.$transaction(async (tx) => {
    const record = await tx.appointmentTenant.upsert({
      where: { propertyId: property.id },
      update: {
        aifrogiTenantId,
        name: input.name?.trim() || property.name,
        timezone: input.timezone?.trim() || property.timezone || "Asia/Kolkata",
        razorpayEnabled: Boolean(input.razorpayEnabled),
        reviewLink: input.reviewLink?.trim() || null,
        workingHours: toInputJson(input.workingHours)
      },
      create: {
        propertyId: property.id,
        aifrogiTenantId,
        name: input.name?.trim() || property.name,
        timezone: input.timezone?.trim() || property.timezone || "Asia/Kolkata",
        razorpayEnabled: Boolean(input.razorpayEnabled),
        reviewLink: input.reviewLink?.trim() || null,
        workingHours: toInputJson(input.workingHours)
      }
    });

    await tx.appointmentService.deleteMany({ where: { tenantId: record.id } });
    await tx.appointmentService.createMany({
      data: services.map((service, index) => ({
        tenantId: record.id,
        name: service.name.trim(),
        durationMin: Math.max(5, Number(service.durationMin || 30)),
        priceInr: Math.max(0, Number(service.priceInr || 0)),
        sortOrder: index + 1
      }))
    });

    return tx.appointmentTenant.findUnique({
      where: { id: record.id },
      include: { services: { orderBy: { sortOrder: "asc" } } }
    });
  });

  return { error: null, status: 200 as const, tenant };
}

export async function connectAppointmentTenantGoogle(input: {
  tenantId: string;
  refreshToken: string;
  calendarId?: string | null;
  sheetId?: string | null;
  status?: string;
}) {
  const db = getDb();
  if (!db) return { error: "Database unavailable.", status: 503 as const, tenant: null };

  const tenantId = input.tenantId.trim();
  const refreshToken = input.refreshToken.trim();
  if (!tenantId) return { error: "Appointment tenant is required.", status: 400 as const, tenant: null };
  if (!refreshToken) {
    return {
      error: "Google did not return a refresh token. Reconnect with consent prompt enabled.",
      status: 400 as const,
      tenant: null
    };
  }

  const tenant = await db.appointmentTenant.update({
    where: { id: tenantId },
    data: {
      googleRefreshTokenEnc: encryptSecretValue(refreshToken),
      calendarId: input.calendarId || "primary",
      sheetId: input.sheetId || null,
      status: input.status || "GOOGLE_CONNECTED",
      lastSyncedAt: new Date()
    },
    select: {
      id: true,
      aifrogiTenantId: true,
      name: true,
      status: true,
      calendarId: true,
      sheetId: true,
      updatedAt: true
    }
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
    throw error;
  });

  if (!tenant) return { error: "Appointment tenant not found.", status: 404 as const, tenant: null };
  return { error: null, status: 200 as const, tenant };
}

export async function markAppointmentTenantGoogleActionRequired(input: {
  tenantId: string;
  refreshToken: string;
  error: string;
}) {
  const db = getDb();
  if (!db) return null;
  return db.appointmentTenant.update({
    where: { id: input.tenantId },
    data: {
      googleRefreshTokenEnc: encryptSecretValue(input.refreshToken),
      calendarId: "primary",
      status: "GOOGLE_ACTION_REQUIRED",
      lastSyncedAt: new Date()
    }
  }).catch(() => null);
}

export async function processAppointmentInboundEvent(event: AppointmentInboundEvent) {
  const db = getDb();
  if (!db) return { error: "Database unavailable.", status: 503 as const, result: null };

  const tenant = await db.appointmentTenant.findUnique({
    where: { aifrogiTenantId: event.tenant_id },
    include: { services: { where: { active: true }, orderBy: { sortOrder: "asc" } } }
  });
  if (!tenant) return { error: "Appointment tenant not found.", status: 404 as const, result: null };
  if (tenant.status === "DISABLED") {
    return { error: "Appointment Journey is disabled for this tenant.", status: 403 as const, result: null };
  }
  if (tenant.status !== "GOOGLE_READY") {
    return { error: "Appointment Journey is waiting for Google setup.", status: 409 as const, result: null };
  }

  const duplicate = await db.appointmentMessageLog.findUnique({ where: { inboundMessageId: event.message_id } });
  if (duplicate) {
    return {
      error: null,
      status: 200 as const,
      result: { duplicate: true, tenantId: tenant.id, messageId: event.message_id }
    };
  }

  const session = await db.appointmentSession.findUnique({
    where: { tenantId_customerPhone: { tenantId: tenant.id, customerPhone: event.customer_phone } }
  });
  const state = normalizeState(session);
  const serviceOptions: AppointmentServiceOption[] = tenant.services.map((service) => ({
    id: service.id,
    name: service.name,
    durationMin: service.durationMin,
    priceInr: service.priceInr
  }));

  const transition = transitionAppointmentState({
    state,
    event,
    config: {
      razorpayEnabled: tenant.razorpayEnabled,
      services: serviceOptions
    }
  });

  let offeredSlots: string[] = [];
  const slotAction = transition.actions.find((action) => action.type === "send_slot_list");
  if (slotAction) {
    const selectedService = tenant.services.find((service) => service.id === slotAction.serviceId);
    if (!selectedService) {
      return { error: "Selected appointment service was not found.", status: 409 as const, result: null };
    }
    try {
      const accessToken = await getAppointmentGoogleAccessToken(tenant.googleRefreshTokenEnc);
      offeredSlots = await getGoogleAppointmentAvailableSlots({
        accessToken,
        calendarId: tenant.calendarId || "",
        timeZone: tenant.timezone,
        durationMin: selectedService.durationMin,
        workingHours: normalizeWorkingHours(tenant.workingHours)
      });
    } catch (error) {
      await markGoogleRuntimeError(tenant.id, error);
      return {
        error: error instanceof Error ? error.message : "Google Calendar availability could not be loaded.",
        status: 502 as const,
        result: null
      };
    }
  }
  const resolvedActions = transition.actions.map((action) => action.type === "send_slot_list"
    ? { ...action, slots: offeredSlots }
    : action) as AppointmentAction[];
  const nextState = slotAction
    ? { ...transition.nextState, offeredSlots }
    : transition.nextState;

  if (resolvedActions.some((action) => action.type === "release_hold")) {
    try {
      await cancelLatestAppointmentBooking({ tenantId: tenant.id, customerPhone: event.customer_phone });
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Appointment cancellation could not be synchronized.",
        status: 502 as const,
        result: null
      };
    }
  }

  const bookingActions = resolvedActions.filter((action) => action.type === "create_hold");
  let booking = null;
  if (bookingActions[0]) {
    try {
      const created = await createBookingFromAction({
        tenantId: tenant.id,
        customerPhone: event.customer_phone,
        sourceMessageId: event.message_id,
        paymentRequired: tenant.razorpayEnabled,
        action: bookingActions[0]
      });
      booking = await synchronizeBookingToGoogle(created.id);
    } catch (error) {
      const slotConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      return {
        error: slotConflict
          ? "That appointment slot was just booked. Please request the available slots again."
          : error instanceof Error ? error.message : "Appointment booking could not be synchronized.",
        status: slotConflict ? 409 as const : 502 as const,
        result: null
      };
    }
  }

  await db.$transaction([
    db.appointmentMessageLog.create({
      data: {
        tenantId: tenant.id,
        bookingId: booking?.id || null,
        direction: "INBOUND",
        eventType: event.event_type,
        body: typeof event.payload.text === "string" ? event.payload.text : null,
        inboundMessageId: event.message_id,
        metadata: event.payload as Prisma.InputJsonValue
      }
    }),
    db.appointmentSession.upsert({
      where: { tenantId_customerPhone: { tenantId: tenant.id, customerPhone: event.customer_phone } },
      update: {
        status: nextState.status,
        selectedServiceId: nextState.selectedServiceId || null,
        customerName: nextState.customerName || null,
        selectedSlotStartIso: nextState.selectedSlotStartIso || null,
        data: stateData(nextState),
        lastInboundMessageId: event.message_id,
        expiresAt: sessionExpiresAt()
      },
      create: {
        tenantId: tenant.id,
        customerPhone: event.customer_phone,
        status: nextState.status,
        selectedServiceId: nextState.selectedServiceId || null,
        customerName: nextState.customerName || null,
        selectedSlotStartIso: nextState.selectedSlotStartIso || null,
        data: stateData(nextState),
        lastInboundMessageId: event.message_id,
        expiresAt: sessionExpiresAt()
      }
    }),
    ...resolvedActions.map((action, index) => db.appointmentMessageLog.create({
      data: {
        tenantId: tenant.id,
        bookingId: booking?.id || null,
        direction: "OUTBOUND_RESERVED",
        eventType: action.type,
        template: actionLabel(action),
        body: outboundPreview(action),
        idempotencyKey: `appointment:${tenant.id}:${event.message_id}:${index}:${action.type}`,
        metadata: action as unknown as Prisma.InputJsonValue
      }
    }))
  ]);

  return {
    error: null,
    status: 202 as const,
    result: {
      duplicate: false,
      tenantId: tenant.id,
      session: nextState,
      actions: resolvedActions,
      bookingId: booking?.id || null
    }
  };
}

async function createBookingFromAction(input: {
  tenantId: string;
  customerPhone: string;
  sourceMessageId: string;
  paymentRequired: boolean;
  action: Extract<AppointmentAction, { type: "create_hold" }>;
}) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");

  const service = await db.appointmentService.findFirst({
    where: { id: input.action.serviceId, tenantId: input.tenantId, active: true }
  });
  if (!service) throw new Error("Selected appointment service was not found.");

  const slotStart = new Date(input.action.slotStartIso);
  const slotEnd = new Date(slotStart.getTime() + service.durationMin * 60 * 1000);
  const activeSlotKey = `${input.tenantId}:${slotStart.toISOString()}`;

  const existing = await db.appointmentBooking.findFirst({
    where: { tenantId: input.tenantId, sourceMessageId: input.sourceMessageId }
  });
  if (existing) return existing;

  return db.appointmentBooking.create({
    data: {
      tenantId: input.tenantId,
      serviceId: service.id,
      customerPhone: input.customerPhone,
      customerName: input.action.customerName,
      slotStart,
      slotEnd,
      activeSlotKey,
      status: input.paymentRequired ? "AWAITING_PAYMENT" : "PENDING_CALENDAR",
      paymentStatus: input.paymentRequired ? "PENDING" : "NOT_REQUIRED",
      sourceMessageId: input.sourceMessageId
    },
  });
}

function normalizeWorkingHours(value: Prisma.JsonValue | null): AppointmentWorkingHours | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AppointmentWorkingHours;
}

async function getAppointmentGoogleAccessToken(encryptedRefreshToken: string | null) {
  const refreshToken = decryptSecretValue(encryptedRefreshToken);
  if (!refreshToken) throw new Error("Google refresh token is missing. Reconnect Google from Appointment Journey settings.");
  return refreshGoogleAppointmentAccessToken(refreshToken);
}

async function markGoogleRuntimeError(tenantId: string, error: unknown) {
  const db = getDb();
  if (!db) return;
  const message = error instanceof Error ? error.message : "Google runtime operation failed.";
  await db.appointmentSheetSyncState.upsert({
    where: { tenantId_tabName: { tenantId, tabName: "Runtime" } },
    update: { lastError: message.slice(0, 1000) },
    create: { tenantId, tabName: "Runtime", lastError: message.slice(0, 1000) }
  }).catch(() => null);
}

async function synchronizeBookingToGoogle(bookingId: string) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const booking = await db.appointmentBooking.findUnique({
    where: { id: bookingId },
    include: { service: true, tenant: true }
  });
  if (!booking || !booking.service) throw new Error("Appointment booking could not be loaded for Google synchronization.");
  if (!booking.tenant.calendarId || !booking.tenant.sheetId) throw new Error("Google Calendar or Sheet is not configured for this tenant.");

  const accessToken = await getAppointmentGoogleAccessToken(booking.tenant.googleRefreshTokenEnc);
  let eventId = booking.gcalEventId;
  try {
    if (!eventId) {
      eventId = await createGoogleAppointmentEvent({
        accessToken,
        calendarId: booking.tenant.calendarId,
        timeZone: booking.tenant.timezone,
        bookingId: booking.id,
        tenantName: booking.tenant.name,
        serviceName: booking.service.name,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        slotStart: booking.slotStart,
        slotEnd: booking.slotEnd,
        status: booking.paymentStatus === "PENDING" ? "HOLD" : "CONFIRMED"
      });
    }
  } catch (error) {
    await db.appointmentBooking.update({ where: { id: booking.id }, data: { status: "CALENDAR_ERROR" } });
    await markGoogleRuntimeError(booking.tenantId, error);
    throw error;
  }

  const updated = await db.appointmentBooking.update({
    where: { id: booking.id },
    data: {
      gcalEventId: eventId,
      status: booking.paymentStatus === "PENDING" ? "AWAITING_PAYMENT" : "CONFIRMED"
    },
    include: { service: true }
  });

  try {
    const previousSync = await db.appointmentSheetSyncState.findUnique({
      where: { tenantId_tabName: { tenantId: booking.tenantId, tabName: "Bookings" } }
    });
    if (previousSync?.cursor !== updated.id || previousSync.lastError) {
      await appendAppointmentBookingToSheet({
        accessToken,
        sheetId: booking.tenant.sheetId,
        booking: {
          id: updated.id,
          createdAt: updated.createdAt,
          customerName: updated.customerName,
          customerPhone: updated.customerPhone,
          serviceName: updated.service?.name || "Appointment",
          slotStart: updated.slotStart,
          slotEnd: updated.slotEnd,
          status: updated.status,
          paymentStatus: updated.paymentStatus,
          gcalEventId: updated.gcalEventId
        }
      });
    }
    await db.$transaction([
      db.appointmentTenant.update({ where: { id: booking.tenantId }, data: { lastSyncedAt: new Date() } }),
      db.appointmentSheetSyncState.upsert({
        where: { tenantId_tabName: { tenantId: booking.tenantId, tabName: "Bookings" } },
        update: { lastSyncedAt: new Date(), lastError: null, cursor: updated.id },
        create: { tenantId: booking.tenantId, tabName: "Bookings", lastSyncedAt: new Date(), cursor: updated.id }
      })
    ]);
  } catch (error) {
    await db.appointmentSheetSyncState.upsert({
      where: { tenantId_tabName: { tenantId: booking.tenantId, tabName: "Bookings" } },
      update: { lastError: error instanceof Error ? error.message.slice(0, 1000) : "Sheet append failed." },
      create: { tenantId: booking.tenantId, tabName: "Bookings", lastError: error instanceof Error ? error.message.slice(0, 1000) : "Sheet append failed." }
    });
  }
  return updated;
}

async function cancelLatestAppointmentBooking(input: { tenantId: string; customerPhone: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const booking = await db.appointmentBooking.findFirst({
    where: {
      tenantId: input.tenantId,
      customerPhone: input.customerPhone,
      status: { in: ["PENDING_CALENDAR", "HOLD", "AWAITING_PAYMENT", "CONFIRMED", "CALENDAR_ERROR"] }
    },
    include: { tenant: true, service: true },
    orderBy: { createdAt: "desc" }
  });
  if (!booking) return null;
  if (!booking.tenant.calendarId || !booking.tenant.sheetId) throw new Error("Google Calendar or Sheet is not configured for this tenant.");
  const accessToken = await getAppointmentGoogleAccessToken(booking.tenant.googleRefreshTokenEnc);
  if (booking.gcalEventId) {
    await deleteGoogleAppointmentEvent({
      accessToken,
      calendarId: booking.tenant.calendarId,
      eventId: booking.gcalEventId
    });
  }
  const cancelled = await db.appointmentBooking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", activeSlotKey: null },
    include: { service: true }
  });
  try {
    await appendAppointmentBookingToSheet({
      accessToken,
      sheetId: booking.tenant.sheetId,
      booking: {
        id: cancelled.id,
        createdAt: cancelled.createdAt,
        customerName: cancelled.customerName,
        customerPhone: cancelled.customerPhone,
        serviceName: cancelled.service?.name || "Appointment",
        slotStart: cancelled.slotStart,
        slotEnd: cancelled.slotEnd,
        status: cancelled.status,
        paymentStatus: cancelled.paymentStatus,
        gcalEventId: cancelled.gcalEventId
      }
    });
  } catch (error) {
    await markGoogleRuntimeError(booking.tenantId, error);
  }
  return cancelled;
}

function outboundPreview(action: AppointmentAction) {
  if (action.type === "send_service_list") return `Offer ${action.services.length} appointment service option(s).`;
  if (action.type === "ask_customer_name") return "Ask customer for their name.";
  if (action.type === "send_slot_list") return `Offer slots: ${(action.slots || []).join(", ")}`;
  if (action.type === "create_hold") return `Create a tentative hold for ${action.slotStartIso}.`;
  if (action.type === "create_payment_link") return "Create and send Razorpay payment link.";
  if (action.type === "confirm_without_payment") return "Confirm appointment without payment.";
  if (action.type === "release_hold") return "Release any active appointment hold.";
  if (action.type === "handoff_to_inbox") return action.reason;
  return action.message;
}

export function appointmentActionMessage(action: AppointmentAction) {
  if (action.type === "send_service_list") {
    const options = action.services.map((service, index) => `${index + 1}. ${service.name} (${service.durationMin} min)`).join("\n");
    return `Please choose an appointment service by replying with its number:\n${options}`;
  }
  if (action.type === "ask_customer_name") return "Please reply with the customer name for this appointment.";
  if (action.type === "send_slot_list") {
    const options = (action.slots || []).map((slot, index) => `${index + 1}. ${new Date(slot).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}`).join("\n");
    return options ? `Please choose a slot by replying with its number:\n${options}` : "No appointment slots are available right now.";
  }
  if (action.type === "create_payment_link") return "Your slot is held. The payment link will follow shortly.";
  if (action.type === "confirm_without_payment") return `Your appointment is confirmed for ${new Date(action.slotStartIso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}.`;
  if (action.type === "release_hold") return "Your appointment selection has been cancelled.";
  if (action.type === "handoff_to_inbox") return "I could not complete the appointment flow. A team member will assist you.";
  if (action.type === "send_reprompt") return action.message;
  return null;
}
