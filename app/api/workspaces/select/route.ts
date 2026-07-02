import { NextResponse } from "next/server";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { WORKSPACE_COOKIE_NAME } from "@/lib/workspace";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const slug = String(payload?.slug || "").trim();
  const workspace = slug ? await getPropertyBySlug(slug) : null;

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, workspace: { name: workspace.name, slug: workspace.slug } });
  response.cookies.set(WORKSPACE_COOKIE_NAME, workspace.slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
