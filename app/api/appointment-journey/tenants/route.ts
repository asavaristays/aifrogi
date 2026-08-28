import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { provisionAppointmentTenant } from "@/lib/appointment-journey-service";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = (
    process.env.APPOINTMENT_JOURNEY_INTERNAL_TOKEN?.trim() ||
    process.env.AIFROGI_INTERNAL_API_TOKEN?.trim() ||
    ""
  );
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => null) as {
    propertySlug?: string;
    aifrogiTenantId?: string;
    tenant_id?: string;
    name?: string;
    timezone?: string;
    razorpayEnabled?: boolean;
    reviewLink?: string;
    workingHours?: unknown;
    services?: Array<{ name?: string; durationMin?: number; priceInr?: number }>;
  } | null;

  const result = await provisionAppointmentTenant({
    propertySlug: String(payload?.propertySlug || "").trim(),
    aifrogiTenantId: String(payload?.aifrogiTenantId || payload?.tenant_id || "").trim(),
    name: payload?.name,
    timezone: payload?.timezone,
    razorpayEnabled: Boolean(payload?.razorpayEnabled),
    reviewLink: payload?.reviewLink,
    workingHours: payload?.workingHours as never,
    services: payload?.services?.map((service) => ({
      name: String(service.name || "").trim(),
      durationMin: service.durationMin,
      priceInr: service.priceInr
    }))
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ tenant: result.tenant }, { status: result.status });
}
