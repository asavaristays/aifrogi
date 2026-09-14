import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

const MAX_BYTES = 2 * 1024 * 1024;
const MIME: Record<string, { extension: string; signatures: number[][] }> = {
  "image/jpeg": { extension: "jpg", signatures: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: "png", signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { extension: "webp", signatures: [[0x52, 0x49, 0x46, 0x46]] }
};

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or Admin access is required." }, { status: 403 });
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  const format = MIME[file.type];
  if (!format || file.size > MAX_BYTES) return NextResponse.json({ error: "Upload a JPG, PNG or WebP image up to 2 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = format.signatures.some((signature) => signature.every((byte, index) => bytes[index] === byte)) && (file.type !== "image/webp" || String.fromCharCode(...bytes.slice(8, 12)) === "WEBP");
  if (!valid) return NextResponse.json({ error: "The uploaded file does not contain a valid image." }, { status: 400 });
  const slug = (await getCurrentWorkspaceSlug()).replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  const fileName = `${randomUUID()}.${format.extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", "showcase", slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), bytes, { flag: "wx" });
  return NextResponse.json({ url: `/api/media/uploads/showcase/${slug}/${fileName}` }, { status: 201 });
}
