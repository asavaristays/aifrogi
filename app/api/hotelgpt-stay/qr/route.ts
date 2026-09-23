import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await resolveClientWorkspaceAccess({ propertySlug: url.searchParams.get("propertySlug") });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const profile = access.organization.botProfile;
  if (profile?.category !== "STAY") return NextResponse.json({ error: "HotelGPT is not selected for this workspace." }, { status: 404 });
  if (profile.status !== "LIVE") return NextResponse.json({ error: "The stay QR becomes available after Super Admin approval." }, { status: 409 });
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://app.aifrogi.com").replace(/\/$/, "");
  const stayUrl = `${appUrl}/stay/${encodeURIComponent(access.propertySlug)}`;
  const image = await QRCode.toBuffer(stayUrl, { width: 960, margin: 3, errorCorrectionLevel: "H", color: { dark: "#071722", light: "#FFFFFF" } });
  const disposition = url.searchParams.get("download") === "1" ? `attachment; filename="${access.propertySlug}-hotelgpt-stay-qr.png"` : "inline";
  return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png", "Content-Disposition": disposition, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
