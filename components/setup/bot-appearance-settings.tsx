"use client";

import { useMemo, useState } from "react";
import type { KnowledgeSettings } from "@/lib/repositories/knowledge-repository";

type Props = {
  initialSettings: Pick<KnowledgeSettings, "welcomeMessage" | "themeColor" | "widgetTheme" | "logoUrl" | "welcomeCardImageUrl" | "welcomeCardTitle" | "welcomeCardText">;
  initialBotName: string;
  canManage: boolean;
};

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrastText(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;
  return whiteContrast >= blackContrast ? { color: "#ffffff", ratio: whiteContrast } : { color: "#111111", ratio: blackContrast };
}

export function BotAppearanceSettings({ initialSettings, initialBotName, canManage }: Props) {
  const [botName, setBotName] = useState(initialBotName);
  const [welcomeMessage, setWelcomeMessage] = useState(initialSettings.welcomeMessage);
  const [themeColor, setThemeColor] = useState(initialSettings.themeColor);
  const [widgetTheme, setWidgetTheme] = useState(initialSettings.widgetTheme || "dark");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [welcomeCardImageUrl, setWelcomeCardImageUrl] = useState(initialSettings.welcomeCardImageUrl);
  const [welcomeCardTitle, setWelcomeCardTitle] = useState(initialSettings.welcomeCardTitle);
  const [welcomeCardText, setWelcomeCardText] = useState(initialSettings.welcomeCardText);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const accentText = useMemo(() => contrastText(themeColor), [themeColor]);
  const logoIsValid = !logoUrl.trim() || (() => {
    try { return new URL(logoUrl).protocol === "https:"; } catch { return false; }
  })();
  const cardImageIsValid = !welcomeCardImageUrl.trim() || (() => {
    try { return new URL(welcomeCardImageUrl).protocol === "https:"; } catch { return false; }
  })();
  const canSave = canManage && botName.trim().length > 0 && welcomeMessage.trim().length > 0 && logoIsValid && cardImageIsValid;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setNotice(null);
    try {
      if (botName.trim() !== initialBotName.trim()) {
        const profileResponse = await fetch("/api/onboarding/bot-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaName: botName.trim() })
        });
        const profilePayload = await profileResponse.json();
        if (!profileResponse.ok) throw new Error(profilePayload.error || "Could not save the bot name.");
      }
      const appearanceResponse = await fetch("/api/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ welcomeMessage, themeColor, widgetTheme, logoUrl, welcomeCardImageUrl, welcomeCardTitle, welcomeCardText })
      });
      const appearancePayload = await appearanceResponse.json();
      if (!appearanceResponse.ok) throw new Error(appearancePayload.error || "Could not save bot appearance.");
      setNotice("Bot appearance saved. New widget loads will use these settings.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save bot appearance.");
    } finally {
      setSaving(false);
    }
  }

  return <section id="bot-appearance" className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="product-eyebrow">Setup · bot appearance</p><h2 className="mt-1 text-xl font-semibold">Brand your website bot</h2><p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">These settings control how the launcher and bot header look. They do not change what the bot knows or how answers are approved.</p></div>
      <span className="status-pill status-success">Website widget</span>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="field-label">Bot name</span><input className="product-input mt-2" value={botName} maxLength={80} disabled={!canManage} onChange={(event) => setBotName(event.target.value)} placeholder="Business Assistant" /><small className="mt-2 block text-xs text-[var(--text-muted)]">Shown in the widget header. Keep it short enough to read on a phone.</small></label>
        <label><span className="field-label">Brand colour</span><div className="mt-2 flex min-h-11 items-center gap-3 rounded-md border border-[var(--border)] px-3"><input type="color" value={themeColor} disabled={!canManage} onChange={(event) => setThemeColor(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent" /><span className="text-xs font-semibold uppercase">{themeColor}</span></div><small className="mt-2 block text-xs text-[var(--text-muted)]">We automatically use readable light or dark text over this colour.</small></label>
        <fieldset className="sm:col-span-2"><legend className="field-label">Widget theme</legend><div className="mt-2 grid grid-cols-3 gap-2">{(["dark", "light", "system"] as const).map(mode => <label key={mode} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-semibold capitalize ${widgetTheme === mode ? "border-[#9a7411] bg-[#f4ecd5] text-[#624b0c]" : "border-[var(--border)]"}`}><input type="radio" name="widget-theme" className="sr-only" value={mode} checked={widgetTheme === mode} disabled={!canManage} onChange={() => setWidgetTheme(mode)} />{mode}</label>)}</div><small className="mt-2 block text-xs text-[var(--text-muted)]">System follows the visitor&apos;s device preference automatically.</small></fieldset>
        <label className="sm:col-span-2"><span className="field-label">Welcome message</span><input className="product-input mt-2" value={welcomeMessage} maxLength={300} disabled={!canManage} onChange={(event) => setWelcomeMessage(event.target.value)} placeholder="Hello. How can I help?" /><small className="mt-2 block text-xs text-[var(--text-muted)]">The first message visitors see when they open the bot.</small></label>
        <label className="sm:col-span-2"><span className="field-label">Logo URL (optional)</span><input className="product-input mt-2" value={logoUrl} maxLength={500} disabled={!canManage} aria-invalid={!logoIsValid} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://yourwebsite.com/logo.png" /><small className={`mt-2 block text-xs ${logoIsValid ? "text-[var(--text-muted)]" : "text-red-700"}`}>{logoIsValid ? "Use a square 512 × 512 px PNG or WebP, maximum 1 MB. The logo displays at 30–36 px, so avoid small text." : "Enter a public HTTPS image URL."}</small></label>
        <div className="sm:col-span-2 rounded-xl border border-[var(--border)] bg-[#fbfaf7] p-4"><p className="field-label">Welcome highlight / today&apos;s offer (optional)</p><p className="mt-1 text-xs text-[var(--text-muted)]">Add a visual card above the conversation. Clear all three fields to hide it.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="text-xs font-semibold">Heading</span><input className="product-input mt-2" value={welcomeCardTitle} maxLength={80} disabled={!canManage} onChange={(event) => setWelcomeCardTitle(event.target.value)} placeholder="Today’s offer" /></label><label><span className="text-xs font-semibold">Short text</span><input className="product-input mt-2" value={welcomeCardText} maxLength={240} disabled={!canManage} onChange={(event) => setWelcomeCardText(event.target.value)} placeholder="Book this week and receive…" /></label><label className="sm:col-span-2"><span className="text-xs font-semibold">Image URL</span><input className="product-input mt-2" value={welcomeCardImageUrl} maxLength={500} disabled={!canManage} aria-invalid={!cardImageIsValid} onChange={(event) => setWelcomeCardImageUrl(event.target.value)} placeholder="https://yourwebsite.com/offer.webp" /><small className={`mt-2 block text-xs ${cardImageIsValid ? "text-[var(--text-muted)]" : "text-red-700"}`}>{cardImageIsValid ? "Use a public HTTPS landscape image. Recommended 1200 × 630 px, WebP or JPG, maximum 1 MB." : "Enter a public HTTPS image URL."}</small></label></div></div>
        <div className="sm:col-span-2 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text-muted)]">{canManage ? "Changes affect new widget loads after saving." : "Owner or Admin access is required to edit appearance."}</p>
          <button type="button" onClick={save} disabled={!canSave || saving} className="min-h-11 rounded-full bg-[#9a7411] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save appearance"}</button>
        </div>
        {notice ? <p role="status" className="sm:col-span-2 rounded-lg bg-[var(--info-soft)] px-4 py-3 text-sm text-[#385d8e]">{notice}</p> : null}
      </div>
      <aside aria-label="Bot appearance preview" className={`rounded-[24px] p-5 shadow-[0_20px_55px_rgba(0,0,0,.18)] ${widgetTheme === "light" ? "bg-[#f7f5ef] text-[#191919]" : "bg-[#111214] text-white"}`}>
        <p className={`text-[10px] font-bold uppercase tracking-[.16em] ${widgetTheme === "light" ? "text-black/45" : "text-white/45"}`}>Live preview · {widgetTheme}</p>
        <div className="mt-5 flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] border" style={{ borderColor: `${themeColor}88`, color: themeColor }}>{logoUrl && logoIsValid ? <img src={logoUrl} alt="" className="h-[30px] w-[30px] object-contain" /> : <strong>{(botName.trim() || "B").slice(0, 1).toUpperCase()}</strong>}</span><strong className="truncate text-base">{botName.trim() || "Business Assistant"}</strong></div>
        <div className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${widgetTheme === "light" ? "bg-black/5 text-black/80" : "bg-white/8 text-white/85"}`}>{welcomeMessage.trim() || "Hello. How can I help?"}</div>
        {(welcomeCardTitle || welcomeCardText || welcomeCardImageUrl) ? <div className={`mt-3 overflow-hidden rounded-2xl border ${widgetTheme === "light" ? "border-black/10 bg-white" : "border-white/10 bg-white/5"}`}>{welcomeCardImageUrl && cardImageIsValid ? <img src={welcomeCardImageUrl} alt="" className="h-28 w-full object-cover" /> : null}<div className="p-4">{welcomeCardTitle ? <strong className="block text-sm">{welcomeCardTitle}</strong> : null}{welcomeCardText ? <p className={`mt-1 text-xs leading-5 ${widgetTheme === "light" ? "text-black/60" : "text-white/60"}`}>{welcomeCardText}</p> : null}</div></div> : null}
        <div className={`mt-6 flex items-center justify-between border-t pt-4 ${widgetTheme === "light" ? "border-black/10" : "border-white/10"}`}><span className={`text-xs ${widgetTheme === "light" ? "text-black/45" : "text-white/45"}`}>Launcher</span><span className="grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-full shadow-lg" style={{ backgroundColor: themeColor, color: accentText.color }} title={`Text contrast ${accentText.ratio.toFixed(1)}:1`}>{logoUrl && logoIsValid ? <img src={logoUrl} alt="" className="h-[34px] w-[34px] object-contain" /> : <strong>AI</strong>}</span></div>
      </aside>
    </div>
  </section>;
}
