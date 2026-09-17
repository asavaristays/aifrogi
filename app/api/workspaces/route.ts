import { NextResponse } from "next/server";
import { createPropertyWorkspace, listProperties } from "@/lib/repositories/property-repository";
import { getCurrentUser } from "@/lib/auth-server";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Super Admin access is required." }, { status: 403 });
  const workspaces = await listProperties();
  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Super Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const name = String(payload?.name || "").trim();
  const slug = slugify(String(payload?.slug || name));

  if (!name || !slug) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }

  const workspace = await createPropertyWorkspace({ name, slug });
  if (!workspace) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  return NextResponse.json({ workspace }, { status: 201 });
}
