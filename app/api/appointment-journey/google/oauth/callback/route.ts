import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import {
  createAppointmentGoogleResources,
  exchangeGoogleAppointmentCode,
  parseGoogleAppointmentOAuthState
} from "@/lib/appointment-journey-google-oauth";
import {
  connectAppointmentTenantGoogle,
  getAppointmentTenantOAuthContext,
  markAppointmentTenantGoogleActionRequired
} from "@/lib/appointment-journey-service";

export const dynamic = "force-dynamic";

function html(title: string, body: string, status = 200) {
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  title = escape(title); body = escape(body);
  return new NextResponse(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:48px;line-height:1.5;color:#172033}a{color:#0b66c3}</style></head><body><h1>${title}</h1><p>${body}</p></body></html>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function redirectWithStatus(requestUrl: string, returnTo: string, status: string, detail?: string) {
  // The reverse proxy exposes an internal localhost request URL. Use the
  // configured OAuth callback origin, never forwarded/client-supplied hosts.
  const origin = new URL(process.env.GOOGLE_APPOINTMENT_REDIRECT_URI || "https://app.aifrogi.com").origin;
  const url = new URL(returnTo, origin);
  if (url.origin !== origin) throw new Error("Invalid Google return destination");
  url.searchParams.set("appointment_google", status);
  if (detail) url.searchParams.set("appointment_google_detail", detail.slice(0, 160));
  return NextResponse.redirect(url.toString());
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";
  const error = url.searchParams.get("error")?.trim() || "";

  if (error) {
    return html("Google connection cancelled", `Google returned: ${error}`, 400);
  }
  if (!code || !state) {
    return html("Google connection incomplete", "The callback did not include the required code and state.", 400);
  }

  try {
    const parsedState = parseGoogleAppointmentOAuthState(state);
    const tenant = await getAppointmentTenantOAuthContext(parsedState.tenantId);
    if (!tenant) return html("Google connection failed", "Appointment tenant was not found.", 404);
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      const access = await resolveClientWorkspaceAccess({ propertySlug: tenant.property.slug, requireManage: true, requireActiveSubscription: false });
      if (!access.ok) return html("Google connection denied", "Sign in with permission to manage this workspace and reconnect Google.", access.status);
    }
    const token = await exchangeGoogleAppointmentCode(code);

    let resources: { calendarId: string; sheetId: string };
    try {
      resources = await createAppointmentGoogleResources({
        accessToken: token.accessToken,
        tenantName: tenant.name,
        timezone: tenant.timezone
      });
    } catch (resourceError) {
      const message = resourceError instanceof Error ? resourceError.message : "Google resource setup failed.";
      await markAppointmentTenantGoogleActionRequired({
        tenantId: parsedState.tenantId,
        refreshToken: token.refreshToken,
        error: message
      });
      return redirectWithStatus(request.url, parsedState.returnTo, "action_required", message);
    }

    const result = await connectAppointmentTenantGoogle({
      tenantId: parsedState.tenantId,
      refreshToken: token.refreshToken,
      calendarId: resources.calendarId,
      sheetId: resources.sheetId,
      status: "GOOGLE_READY"
    });
    if (result.error) return redirectWithStatus(request.url, parsedState.returnTo, "failed", result.error);

    return redirectWithStatus(request.url, parsedState.returnTo, "connected");
  } catch (caught) {
    return html("Google connection failed", caught instanceof Error ? caught.message : "Google OAuth failed.", 400);
  }
}
