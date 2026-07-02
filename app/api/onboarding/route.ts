import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  createOnboardingOrganization,
  loadOnboardingForUser,
  saveOnboardingStep
} from "@/lib/services/onboarding-service";
import { WORKSPACE_COOKIE_NAME } from "@/lib/workspace";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await loadOnboardingForUser(user.username);
  return NextResponse.json({ organization });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await createOnboardingOrganization(user.username, payload);
  if (result.error || !result.organization) {
    return NextResponse.json({ error: result.error, organization: result.organization }, { status: result.status });
  }

  const response = NextResponse.json({ organization: result.organization }, { status: result.status });
  const workspace = result.organization.properties[0];
  if (workspace) {
    response.cookies.set(WORKSPACE_COOKIE_NAME, workspace.slug, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return response;
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await saveOnboardingStep(user.username, payload);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ organization: result.organization }, { status: result.status });
}
