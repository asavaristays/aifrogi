import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  createManualInvoice,
  addConnectorBilling,
  grantComplimentarySubscription,
  createPlatformIncident,
  markInvoicePaid,
  resolvePlatformIncident,
  updateOrganizationPlan
} from "@/lib/billing-super-admin";

function rupeesToPaisa(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export async function PATCH(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
  }
  const { organizationId } = await context.params;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(payload?.action || "").trim().toUpperCase();

  try {
    if (action === "CHANGE_PLAN") {
      const planCode = String(payload?.planCode || "").trim().toUpperCase();
      if (!planCode) return NextResponse.json({ error: "Select a billing plan" }, { status: 400 });
      const subscription = await updateOrganizationPlan({ organizationId, planCode, actorEmail: user.username });
      return NextResponse.json({ subscription });
    }

    if (action === "GRANT_COMPLIMENTARY") {
      const planCode = String(payload?.planCode || "").trim().toUpperCase();
      const reason = String(payload?.reason || "").trim();
      const endsAt = new Date(String(payload?.endsAt || ""));
      if (!planCode || !reason || Number.isNaN(endsAt.getTime())) return NextResponse.json({ error: "Plan, future expiry date and reason are required" }, { status: 400 });
      const subscription = await grantComplimentarySubscription({ organizationId, planCode, endsAt, reason, actorEmail: user.username });
      return NextResponse.json({ subscription });
    }

    if (action === "ADD_CONNECTOR") {
      const category = String(payload?.category || "").trim().toUpperCase();
      const name = String(payload?.name || "").trim();
      if (!category || !name) return NextResponse.json({ error: "Connector category and name are required" }, { status: 400 });
      const addon = await addConnectorBilling({ organizationId, category, name, setupFeePaisa: rupeesToPaisa(payload?.setupFeeRupees), recurringFeePaisa: rupeesToPaisa(payload?.recurringFeeRupees), billingInterval: String(payload?.billingInterval || "ONE_TIME").trim().toUpperCase(), externalFeeNote: String(payload?.externalFeeNote || "").trim() || null, notes: String(payload?.notes || "").trim() || null, actorEmail: user.username });
      return NextResponse.json({ addon });
    }

    if (action === "CREATE_INVOICE") {
      const platformFeePaisa = rupeesToPaisa(payload?.platformFeeRupees);
      if (platformFeePaisa < 0) return NextResponse.json({ error: "Platform fee cannot be negative" }, { status: 400 });
      const dueAt = payload?.dueAt ? new Date(String(payload.dueAt)) : null;
      if (dueAt && Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "Enter a valid due date" }, { status: 400 });
      const invoice = await createManualInvoice({
        organizationId,
        actorEmail: user.username,
        platformFeePaisa,
        metaChargesPaisa: rupeesToPaisa(payload?.metaChargesRupees),
        aiOveragePaisa: rupeesToPaisa(payload?.aiOverageRupees),
        servicesPaisa: rupeesToPaisa(payload?.servicesRupees),
        taxPaisa: rupeesToPaisa(payload?.taxRupees),
        adjustmentPaisa: rupeesToPaisa(payload?.adjustmentRupees),
        dueAt,
        notes: String(payload?.notes || "").trim() || null
      });
      return NextResponse.json({ invoice });
    }

    if (action === "MARK_INVOICE_PAID") {
      const invoiceId = String(payload?.invoiceId || "").trim();
      const paymentReference = String(payload?.paymentReference || "").trim();
      if (!invoiceId || !paymentReference) {
        return NextResponse.json({ error: "Invoice and payment reference are required" }, { status: 400 });
      }
      const invoice = await markInvoicePaid({ organizationId, invoiceId, actorEmail: user.username, paymentReference, renewSubscription: payload?.renewSubscription === true });
      return NextResponse.json({ invoice });
    }

    if (action === "OPEN_INCIDENT") {
      const title = String(payload?.title || "").trim();
      const description = String(payload?.description || "").trim();
      if (!title || !description) return NextResponse.json({ error: "Incident title and description are required" }, { status: 400 });
      const incident = await createPlatformIncident({
        organizationId,
        actorEmail: user.username,
        severity: String(payload?.severity || "MEDIUM").toUpperCase(),
        category: String(payload?.category || "PLATFORM").toUpperCase(),
        title,
        description
      });
      return NextResponse.json({ incident });
    }

    if (action === "RESOLVE_INCIDENT") {
      const incidentId = String(payload?.incidentId || "").trim();
      const resolution = String(payload?.resolution || "").trim();
      if (!incidentId || !resolution) return NextResponse.json({ error: "Incident and resolution are required" }, { status: 400 });
      const incident = await resolvePlatformIncident({ organizationId, incidentId, actorEmail: user.username, resolution });
      return NextResponse.json({ incident });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Billing action failed" }, { status: 400 });
  }

  return NextResponse.json({ error: "Unsupported billing action" }, { status: 400 });
}
