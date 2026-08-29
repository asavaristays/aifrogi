import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "admin") return NextResponse.json({ error: "Client access required" }, { status: 403 });
  await request.json().catch(() => null);
  return NextResponse.json({ error: "Bot blueprint changes are managed by AiFrogi SuperAdmin." }, { status: 403 });
}
