"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BOT_CAPABILITIES, BOT_CATEGORIES, BOT_CHANNELS, BOT_OPERATING_MODES, type BotProfileInput } from "@/lib/bot-profile";

type StoredProfile = { category?: string; operatingMode?: string; channels?: string[]; capabilities?: string[]; humanHandoffEnabled?: boolean; actionApprovalNeeded?: boolean; status?: string };

const labels: Record<string, string> = {
  BUSINESS_AI: "Regular AI Business Bot", PINGBOOK: "PingBook Appointment Bot", FLOWCART: "FlowCart Commerce Bot", STAY: "Stay / Hospitality Bot", CUSTOM: "Custom Business Bot",
  ANSWER_ONLY: "Answer questions only", LEAD_CAPTURE: "Capture and qualify leads", APPROVED_ACTIONS: "Perform approved actions", HUMAN_APPROVAL: "Human approval required",
  WEBSITE: "Website Bot", WHATSAPP: "WhatsApp Bot", ANSWER_QUESTIONS: "Answer service questions", CAPTURE_LEADS: "Capture leads", QUALIFY_LEADS: "Qualify requirements", BOOK_APPOINTMENTS: "Book appointments", CREATE_ORDERS: "Create orders"
};

const defaults: BotProfileInput = { category: "BUSINESS_AI", operatingMode: "LEAD_CAPTURE", channels: ["WEBSITE"], capabilities: ["ANSWER_QUESTIONS", "CAPTURE_LEADS", "QUALIFY_LEADS"], humanHandoffEnabled: true, actionApprovalNeeded: true };

const setupPaths = [
  { key: "website", title: "AI Website Bot", helper: "Use approved business intelligence on your website and capture consented enquiries.", channels: ["WEBSITE"] as BotProfileInput["channels"] },
  { key: "whatsapp", title: "WhatsApp Bot", helper: "Run customer conversations through a securely connected WhatsApp Business number.", channels: ["WHATSAPP"] as BotProfileInput["channels"] },
  { key: "both", title: "Website + WhatsApp", helper: "One business bot and intelligence layer operating across both customer channels.", channels: ["WEBSITE", "WHATSAPP"] as BotProfileInput["channels"] }
] as const;

function normalized(initial?: StoredProfile | null): BotProfileInput {
  return {
    ...defaults,
    humanHandoffEnabled: initial?.humanHandoffEnabled ?? defaults.humanHandoffEnabled,
    actionApprovalNeeded: initial?.actionApprovalNeeded ?? defaults.actionApprovalNeeded,
    category: BOT_CATEGORIES.includes(initial?.category as never) ? initial?.category as BotProfileInput["category"] : defaults.category,
    operatingMode: BOT_OPERATING_MODES.includes(initial?.operatingMode as never) ? initial?.operatingMode as BotProfileInput["operatingMode"] : defaults.operatingMode,
    channels: initial?.channels?.filter((item): item is BotProfileInput["channels"][number] => BOT_CHANNELS.includes(item as never)) || defaults.channels,
    capabilities: initial?.capabilities?.filter((item): item is BotProfileInput["capabilities"][number] => BOT_CAPABILITIES.includes(item as never)) || defaults.capabilities
  };
}

export function BotProfileConfigurator({ initialProfile, organizationId, compact = false, onSaved }: { initialProfile?: StoredProfile | null; organizationId?: string; compact?: boolean; onSaved?: (organization: unknown) => void }) {
  const router = useRouter();
  const [profile, setProfile] = useState(() => normalized(initialProfile));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function setCategory(category: BotProfileInput["category"]) {
    const required = category === "PINGBOOK" ? "BOOK_APPOINTMENTS" : category === "FLOWCART" ? "CREATE_ORDERS" : null;
    setProfile((current) => ({ ...current, category, capabilities: required && !current.capabilities.includes(required) ? [...current.capabilities, required] : current.capabilities }));
  }
  function toggleChannel(channel: BotProfileInput["channels"][number]) {
    setProfile((current) => ({ ...current, channels: current.channels.includes(channel) ? current.channels.filter((item) => item !== channel) : [...current.channels, channel] }));
  }
  function toggleCapability(capability: BotProfileInput["capabilities"][number]) {
    setProfile((current) => ({ ...current, capabilities: current.capabilities.includes(capability) ? current.capabilities.filter((item) => item !== capability) : [...current.capabilities, capability] }));
  }
  async function save() {
    setSaving(true); setMessage("");
    const response = await fetch(organizationId ? `/api/admin/customers/${organizationId}` : "/api/onboarding/bot-profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(organizationId ? { action: "SAVE_BOT_PROFILE", profile } : profile)
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? "Bot profile saved" : payload?.error || "Bot profile could not be saved");
    if (response.ok) {
      onSaved?.(payload.organization);
      router.refresh();
    }
  }

  return <section className={`rounded-lg border border-black/6 bg-white shadow-sm ${compact ? "p-5" : "p-6 sm:p-8"}`}>
    <div><p className="product-eyebrow">Bot design</p><h2 className="mt-2 text-xl font-black">Choose how customers will use your bot</h2><p className="mt-2 text-sm leading-6 text-[#6d7487]">Select the customer journey first. AiFrogi will show only the setup, intelligence, and connection inputs required for those channels.</p></div>
    <div className="mt-6 grid gap-3 lg:grid-cols-3">
      {setupPaths.map((path) => {
        const selected = path.channels.length === profile.channels.length && path.channels.every((channel) => profile.channels.includes(channel));
        return <button key={path.key} type="button" onClick={() => setProfile((current) => ({ ...current, channels: [...path.channels] }))} className={`rounded-lg border p-4 text-left transition ${selected ? "border-[#c725ba] bg-[#fff4fd] ring-1 ring-[#c725ba]" : "border-black/8 bg-[#fbfcfb] hover:border-[#d9a4d4]"}`}><span className="block text-sm font-black">{path.title}</span><span className="mt-2 block text-xs leading-5 text-[#6d7487]">{path.helper}</span></button>;
      })}
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <label className="block"><span className="field-label">Bot category</span><select className="product-input mt-2" value={profile.category} onChange={(event) => setCategory(event.target.value as BotProfileInput["category"])}>{BOT_CATEGORIES.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
      <label className="block"><span className="field-label">Operating mode</span><select className="product-input mt-2" value={profile.operatingMode} onChange={(event) => setProfile((current) => ({ ...current, operatingMode: event.target.value as BotProfileInput["operatingMode"] }))}>{BOT_OPERATING_MODES.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
    </div>
    <div className="mt-5"><p className="field-label">Customer channels</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{BOT_CHANNELS.map((item) => <Check key={item} label={labels[item]} checked={profile.channels.includes(item)} onChange={() => toggleChannel(item)} />)}</div><p className="mt-2 text-xs text-[#6d7487]">{profile.channels.includes("WHATSAPP") ? "WhatsApp setup will request a business number and secure Meta authorization." : "Website-only setup does not require a WhatsApp number or Meta account."}</p></div>
    <div className="mt-5"><p className="field-label">Approved capabilities</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{BOT_CAPABILITIES.map((item) => <Check key={item} label={labels[item]} checked={profile.capabilities.includes(item)} onChange={() => toggleCapability(item)} />)}</div></div>
    <div className="mt-5 grid gap-2 sm:grid-cols-2"><Check label="Human takeover available" checked={profile.humanHandoffEnabled} onChange={() => setProfile((current) => ({ ...current, humanHandoffEnabled: !current.humanHandoffEnabled }))} /><Check label="Approval before business actions" checked={profile.actionApprovalNeeded} onChange={() => setProfile((current) => ({ ...current, actionApprovalNeeded: !current.actionApprovalNeeded }))} /></div>
    {message ? <p className={`mt-4 text-sm font-semibold ${message.includes("saved") ? "text-[#16794a]" : "text-[#a3342b]"}`}>{message}</p> : null}
    <div className="mt-5 flex justify-end"><Button disabled={saving || !profile.channels.length || !profile.capabilities.length} onClick={save}>{saving ? "Saving..." : "Save bot profile"}</Button></div>
  </section>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className="flex items-center gap-3 rounded-md border border-black/7 bg-[#fbfcfb] px-3 py-3 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-[#c725ba]" />{label}</label>;
}
