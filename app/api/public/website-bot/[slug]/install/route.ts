import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { recordWebsiteBotInstallation } from "@/lib/repositories/onboarding-repository";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const payload = await request.json().catch(() => null) as { key?: string; origin?: string } | null;
  const result = await recordWebsiteBotInstallation(slug, String(payload?.key || ""), payload?.origin || request.headers.get("origin"));
  if (!result) return NextResponse.json({ error: "Installation code is invalid." }, { status: 404, headers });
  if (result.status !== "LIVE") return NextResponse.json(result, { headers });

  const [settings, property] = await Promise.all([
    readKnowledgeSettings(slug),
    getDb()?.property.findUnique({ where: { slug }, select: { organization: { select: { name: true, botProfile: { select: { personaName: true } } } } } })
  ]);
  return NextResponse.json({
    ...result,
    appearance: {
      botName: property?.organization?.botProfile?.personaName || `${property?.organization?.name || "Business"} AI`,
      themeColor: settings.themeColor,
      widgetTheme: settings.widgetTheme || "dark",
      logoUrl: settings.logoUrl,
      welcomeMessage: settings.welcomeMessage,
      welcomeCardImageUrl: settings.welcomeCardImageUrl,
      welcomeCardTitle: settings.welcomeCardTitle,
      welcomeCardText: settings.welcomeCardText
    }
  }, { headers });
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  const origin = url.origin;
  const script = `(()=>{
    const s=document.currentScript;
    if(!s||s.dataset.aifrogiLoaded||document.getElementById("aifrogi-widget-${slug}"))return;
    s.dataset.aifrogiLoaded="true";
    fetch(${JSON.stringify(`${origin}/api/public/website-bot/${slug}/install`)},{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:${JSON.stringify(key)},origin:location.origin})})
      .then(r=>r.ok?r.json():null).then(x=>{
        if(!x||x.status!=="LIVE")return;
        const a=x.appearance||{},accent=/^#[0-9a-f]{6}$/i.test(a.themeColor||"")?a.themeColor:"#8a6a16";
        const h=document.createElement("div"),f=document.createElement("iframe"),b=document.createElement("button"),st=document.createElement("style");
        h.id="aifrogi-widget-${slug}";h.style.cssText="--aifrogi-vw:100vw;--aifrogi-vh:100dvh;--aifrogi-vtop:0px;--aifrogi-vleft:0px;position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:2147483000;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";
        st.textContent="#aifrogi-widget-${slug} .aifrogi-panel{display:none;width:min(376px,calc(100vw - 32px));height:min(640px,calc(100dvh - 32px));max-width:100vw;max-height:100dvh;border:0;border-radius:22px;background:#101112;box-shadow:0 22px 70px rgba(0,0,0,.34)}@media(max-width:640px),(max-height:520px){#aifrogi-widget-${slug}{right:0!important;bottom:0!important}#aifrogi-widget-${slug} .aifrogi-panel{position:fixed;left:var(--aifrogi-vleft);top:var(--aifrogi-vtop);width:var(--aifrogi-vw);height:var(--aifrogi-vh);max-width:none;max-height:none;border-radius:0;box-shadow:none}#aifrogi-widget-${slug} .aifrogi-launcher{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom))}}";
        f.className="aifrogi-panel";f.src=${JSON.stringify(`${origin}/embed/${slug}?mode=launcher`)};f.title=a.botName||"AiFrogi AI Bot";f.allow="clipboard-write";
        b.className="aifrogi-launcher";b.type="button";b.setAttribute("aria-label","Open "+(a.botName||"AI Bot"));b.setAttribute("aria-expanded","false");b.title=a.botName||"AI Bot";
        const mark=document.createElement(a.logoUrl?"img":"span");
        if(a.logoUrl){mark.src=a.logoUrl;mark.alt="";mark.style.cssText="width:34px;height:34px;object-fit:contain"}else{mark.textContent="AI";mark.style.cssText="font-size:15px;font-weight:800;color:#fff"}
        b.appendChild(mark);b.style.cssText="display:grid;width:58px;height:58px;place-items:center;padding:0;border:2px solid rgba(255,255,255,.82);border-radius:50%;background:"+accent+";box-shadow:0 12px 32px rgba(0,0,0,.3);cursor:pointer";
        const syncViewport=()=>{const v=window.visualViewport;h.style.setProperty("--aifrogi-vw",(v?.width||innerWidth)+"px");h.style.setProperty("--aifrogi-vh",(v?.height||innerHeight)+"px");h.style.setProperty("--aifrogi-vtop",(v?.offsetTop||0)+"px");h.style.setProperty("--aifrogi-vleft",(v?.offsetLeft||0)+"px")};
        syncViewport();window.visualViewport?.addEventListener("resize",syncViewport);window.visualViewport?.addEventListener("scroll",syncViewport);window.addEventListener("orientationchange",syncViewport);
        const open=()=>{syncViewport();f.style.display="block";b.style.display="none";b.setAttribute("aria-expanded","true")},close=()=>{f.style.display="none";b.style.display="grid";b.setAttribute("aria-expanded","false")};
        b.addEventListener("click",open);window.addEventListener("message",e=>{if(e.origin===${JSON.stringify(origin)}&&e.data&&e.data.type==="AIFROGI_WIDGET_CLOSE"&&e.data.slug===${JSON.stringify(slug)})close()});
        h.append(st,f,b);document.body.appendChild(h);
      }).catch(()=>{});
  })();`;
  return new Response(script, { headers: { ...headers, "Content-Type": "application/javascript; charset=utf-8" } });
}
