import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { updateMessageMatrixPolicy } from "@/lib/message-matrix";

const integerOrNull = (value: unknown) => value === "" || value === null || value === undefined ? null : Number(value);
const rupeesToPaisa = (value: unknown) => Math.round(Number(value || 0) * 100);

export async function PATCH(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
  const { organizationId } = await context.params;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (String(payload?.action || "") !== "UPDATE_POLICY") return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  try {
    const subscription = await updateMessageMatrixPolicy({ organizationId, messageLimitOverride: integerOrNull(payload?.messageLimitOverride), aiReplyLimitOverride: integerOrNull(payload?.aiReplyLimitOverride), messageOveragePaisa: rupeesToPaisa(payload?.messageOverageRupees), aiReplyOveragePaisa: rupeesToPaisa(payload?.aiReplyOverageRupees), overageApproved: payload?.overageApproved === true, actorEmail: user.username });
    return NextResponse.json({ subscription });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Message policy could not be updated" }, { status: 400 }); }
}
