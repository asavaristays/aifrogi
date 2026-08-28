import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { setAppointmentJourneyEnabled } from "@/lib/appointment-journey-service";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null) as { action?: string; propertyId?: string } | null;
  const action = payload?.action?.trim().toUpperCase();
  if (action !== "ENABLE_APPOINTMENT_JOURNEY" && action !== "DISABLE_APPOINTMENT_JOURNEY") {
    return NextResponse.json({ error: "Unsupported appointment action" }, { status: 400 });
  }
  const propertyId = payload?.propertyId?.trim() || "";
  if (!propertyId) return NextResponse.json({ error: "Workspace is required." }, { status: 400 });

  const result = await setAppointmentJourneyEnabled({
    propertyId,
    enabled: action === "ENABLE_APPOINTMENT_JOURNEY",
    actorEmail: user.username
  });
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
