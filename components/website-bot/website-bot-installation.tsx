"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Profile = { status?: string | null; installationKey?: string | null; installationDetectedAt?: string | Date | null; liveAt?: string | Date | null; channels?: string[] };

export function WebsiteBotInstallation({ organizationId, slug, profile, superAdmin = false, sectionId }: { organizationId?: string; slug: string; profile?: Profile | null; superAdmin?: boolean; sectionId?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  if (!profile?.channels?.includes("WEBSITE")) return null;
  const base = "https://app.aifrogi.com";
  const script = profile.installationKey ? `<script async src="${base}/api/public/website-bot/${slug}/install?key=${profile.installationKey}"></script>` : "Save the Website Bot blueprint to generate installation code.";
  const iframe = `<iframe src="${base}/embed/${slug}" title="AI Business Bot" width="390" height="680" style="border:0;border-radius:22px" loading="lazy"></iframe>`;
  const standalone = `${base}/bot/${slug}`;
  const status = profile.status || "DRAFT";
  const detected = Boolean(profile.installationDetectedAt);
  const live = status === "LIVE";
  const statusLabel = status === "CONFIGURED" ? "APPROVAL REQUIRED" : status.replaceAll("_", " ");

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setMessage(`${label} copied.`);
  }
  async function act(action: "MAKE_LIVE" | "PAUSE" | "DELETE" | "RESTORE" | "RESEND_LIVE_EMAIL") {
    if (!organizationId) return;
    setSaving(true); setMessage("");
    const response = await fetch(`/api/admin/customers/${organizationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const payload = await response.json().catch(() => null);
    setSaving(false); setMessage(response.ok ? payload?.notification?.message || "Website Bot status updated." : payload?.error || "Status could not be updated.");
    if (response.ok) router.refresh();
  }

  return <section id={sectionId} className="scroll-mt-6 rounded-lg border border-black/6 bg-white p-6 shadow-sm sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="product-eyebrow">Website installation</p><h2 className="mt-2 text-xl font-black">Install and activate the AI Bot</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#68645c]">Add one approved code option to the customer website. AiFrogi detects the first load, but the bot remains unavailable until Super Admin confirms the installation and makes it live.</p></div><span className={`status-pill ${live ? "status-success" : status === "PAUSED" || status === "DELETED" ? "status-error" : detected ? "status-warning" : "status-info"}`}>{statusLabel}</span></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <CodeCard title="JavaScript" helper="Recommended for HTML, React, Shopify and most websites." value={script} onCopy={() => copy(script, "JavaScript")} disabled={!profile.installationKey} />
      <CodeCard title="iFrame" helper="Use when scripts are restricted. Super Admin approval still controls live access." value={iframe} onCopy={() => copy(iframe, "iFrame")} />
      <CodeCard title="WordPress" helper="Add the JavaScript in a Custom HTML block before the closing body tag." value={script} onCopy={() => copy(script, "WordPress code")} disabled={!profile.installationKey} />
      <CodeCard title="Standalone web app" helper="Use for QR codes, social profiles, SMS or businesses without a website. It uses the same bot and knowledge base." value={standalone} onCopy={() => copy(standalone, "Standalone link")} />
    </div>
    <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-black/7 bg-black/7 sm:grid-cols-4">{[
      ["1", "Code generated", Boolean(profile.installationKey)], ["2", "Installed on website", detected], ["3", "Super Admin approved", live], ["4", "AI Bot live", live]
    ].map(([number, label, complete]) => <div key={String(number)} className="bg-[#fbfcfb] p-4"><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${complete ? "bg-[#dff2ea] text-[#16794a]" : "bg-[#eeeae0] text-[#68645c]"}`}>{complete ? "✓" : number}</span><p className="mt-3 text-sm font-semibold">{label}</p></div>)}</div>
    {superAdmin ? <div className="mt-6 flex flex-wrap gap-3">{status === "INSTALLATION_DETECTED" || status === "PAUSED" ? <Action disabled={saving || !detected} onClick={() => act("MAKE_LIVE")}>Make Bot Live</Action> : null}{live ? <Action disabled={saving} onClick={() => act("PAUSE")}>Pause Bot</Action> : null}{status !== "DELETED" ? <Action danger disabled={saving} onClick={() => act("DELETE")}>Delete Bot</Action> : <Action disabled={saving} onClick={() => act("RESTORE")}>Restore Bot</Action>}</div> : <p className="mt-5 rounded-lg border border-[#ded8cb] bg-[#f8f0d8] p-4 text-sm leading-6 text-[#5f4a18]">These embed options remain available after installation. AiFrogi detects valid website loads automatically; installation status appears above when the code is active.</p>}
    {superAdmin && status === "CONFIGURED" ? <Action disabled={saving || !detected} onClick={() => act("MAKE_LIVE")}>Review and make live</Action> : null}
    {superAdmin && live ? <div className="mt-3"><Action disabled={saving} onClick={() => act("RESEND_LIVE_EMAIL")}>Retry live email</Action></div> : null}
    {message ? <p role="status" className={`mt-4 text-sm font-semibold ${message.includes("could not") || message.includes("required") ? "text-[#a3342b]" : "text-[#16794a]"}`}>{message}</p> : null}
  </section>;
}

function CodeCard({ title, helper, value, onCopy, disabled = false }: { title: string; helper: string; value: string; onCopy: () => void; disabled?: boolean }) {
  return <div className="rounded-lg border border-black/8 bg-[#101010] p-5 text-white"><p className="text-sm font-black text-[#e2c66d]">{title}</p><p className="mt-2 min-h-10 text-xs leading-5 text-white/55">{helper}</p><pre className="mt-4 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-md bg-white/7 p-3 text-[10px] leading-5 text-white/72">{value}</pre><button disabled={disabled} onClick={onCopy} className="mt-4 min-h-10 rounded-md bg-[#8a6a16] px-4 text-xs font-bold text-white disabled:opacity-40">Copy code</button></div>;
}

function Action({ children, onClick, disabled, danger = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className={`min-h-11 rounded-md px-5 text-sm font-bold disabled:opacity-40 ${danger ? "border border-[#a3342b]/25 bg-[#fff0ee] text-[#a3342b]" : "bg-[#8a6a16] text-white"}`}>{children}</button>;
}
