import { NextResponse } from "next/server";
import { getAppointmentTenantForProperty, setAppointmentJourneyEnabled } from "@/lib/appointment-journey-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (payload?.action !== "PREPARE_GOOGLE") return NextResponse.json({error:"Unsupported action"},{status:400});
  const access = await resolveClientWorkspaceAccess({propertySlug:payload.propertySlug,requireManage:true,requireActiveSubscription:false});
  if (!access.ok) return NextResponse.json({error:access.error},{status:access.status});
  const result = await setAppointmentJourneyEnabled({propertyId:access.propertyId,organizationId:access.organization.id,enabled:true,actorEmail:access.user.username});
  if(result.error) return NextResponse.json({error:result.error},{status:result.status});
  return NextResponse.json({ok:true});
}

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
