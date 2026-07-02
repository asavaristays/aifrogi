import { NextResponse } from "next/server";
import { createAsset, loadAssets } from "@/lib/services/assets-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function GET() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const assets = await loadAssets(propertySlug);
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const propertySlug = await getCurrentWorkspaceSlug();
  const result = await createAsset(payload, propertySlug);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ asset: result.asset }, { status: result.status });
}
