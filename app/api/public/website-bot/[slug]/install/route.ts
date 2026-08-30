import { NextResponse } from "next/server";
import { recordWebsiteBotInstallation } from "@/lib/repositories/onboarding-repository";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const payload = await request.json().catch(() => null) as { key?: string; origin?: string } | null;
  const result = await recordWebsiteBotInstallation(slug, String(payload?.key || ""), payload?.origin || request.headers.get("origin"));
  if (!result) return NextResponse.json({ error: "Installation code is invalid." }, { status: 404, headers });
  return NextResponse.json(result, { headers });
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  const origin = url.origin;
  const script = `(()=>{const s=document.currentScript;if(!s||s.dataset.aifrogiLoaded)return;s.dataset.aifrogiLoaded="true";fetch(${JSON.stringify(`${origin}/api/public/website-bot/${slug}/install`)},{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:${JSON.stringify(key)},origin:location.origin})}).then(r=>r.ok?r.json():null).then(x=>{if(!x||x.status!=="LIVE")return;const f=document.createElement("iframe");f.src=${JSON.stringify(`${origin}/embed/${slug}`)};f.title="AiFrogi AI Business Bot";f.allow="clipboard-write";f.style.cssText="position:fixed;right:18px;bottom:18px;width:min(390px,calc(100vw - 24px));height:min(680px,calc(100vh - 24px));border:0;border-radius:22px;z-index:2147483000;background:transparent;box-shadow:0 24px 80px rgba(0,0,0,.28)";document.body.appendChild(f)}).catch(()=>{});})();`;
  return new Response(script, { headers: { ...headers, "Content-Type": "application/javascript; charset=utf-8" } });
}
