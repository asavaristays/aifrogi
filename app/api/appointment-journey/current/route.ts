import { NextResponse } from "next/server";
import { getAppointmentTenantForProperty } from "@/lib/appointment-journey-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await resolveClientWorkspaceAccess({
    propertySlug: url.searchParams.get("propertySlug"),
    requireManage: false,
    requireActiveSubscription: false
  });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const result = await getAppointmentTenantForProperty(access.propertySlug);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ tenant: result.tenant });
}
