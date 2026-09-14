import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { saveConnectorApiConfiguration, testConnectorApi, type ConnectorOperationMapping } from "@/lib/connector-api-control";
import { getOrganizationById } from "@/lib/repositories/onboarding-repository";

type Payload = { action?: string; connectorKey?: string; apiBaseUrl?: string; authType?: string; secret?: string; operationMapping?: ConnectorOperationMapping };

export async function PATCH(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as Payload | null;
  const connectorKey = payload?.connectorKey?.trim() || "";
  if (!connectorKey) return NextResponse.json({ error: "Connector is required." }, { status: 400 });
  try {
    if (payload?.action === "SAVE_CONNECTOR_API") await saveConnectorApiConfiguration({ organizationId: access.organization.id, connectorKey, apiBaseUrl: payload.apiBaseUrl, authType: payload.authType, secret: payload.secret, operationMapping: payload.operationMapping, actorEmail: access.user.username });
    else if (payload?.action === "TEST_CONNECTOR_API") {
      const test = await testConnectorApi({ organizationId: access.organization.id, connectorKey, actorEmail: access.user.username });
      return NextResponse.json({ test, organization: await getOrganizationById(access.organization.id) }, { status: test.healthy ? 200 : 400 });
    } else return NextResponse.json({ error: "Unsupported connector action." }, { status: 400 });
    return NextResponse.json({ organization: await getOrganizationById(access.organization.id) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Connector API operation failed." }, { status: 400 }); }
}
