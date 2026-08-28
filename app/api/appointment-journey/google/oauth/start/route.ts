import { NextResponse } from "next/server";
import { buildGoogleAppointmentOAuthUrl } from "@/lib/appointment-journey-google-oauth";
import { getAppointmentTenantOAuthContext } from "@/lib/appointment-journey-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId")?.trim() || "";
  const returnTo = url.searchParams.get("returnTo")?.trim() || "";

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  try {
    const tenant = await getAppointmentTenantOAuthContext(tenantId);
    if (!tenant) return NextResponse.json({ error: "Appointment tenant not found." }, { status: 404 });

    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      const access = await resolveClientWorkspaceAccess({
        propertySlug: tenant.property.slug,
        requireManage: true,
        requireActiveSubscription: false
      });
      if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    }

    return NextResponse.redirect(buildGoogleAppointmentOAuthUrl({ tenantId, returnTo }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google OAuth could not start." }, { status: 503 });
  }
}
