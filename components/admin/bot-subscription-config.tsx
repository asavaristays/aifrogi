"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_WHATSAPP_BOT_CONFIGURATION,
  WHATSAPP_BOT_SERVICE_OPTIONS,
  normalizeWhatsAppBotConfiguration,
  type WhatsAppBotConfiguration,
  type WhatsAppBotConfigurationInput,
  type WhatsAppBotServiceKey
} from "@/lib/whatsapp-bot-config";
import { buildWhatsAppFirstReply } from "@/lib/services/whatsapp-auto-reply";

const PLAN_OPTIONS = ["TRIAL", "STARTER", "GROWTH", "AI_TOOLS", "CUSTOM"];

export function BotSubscriptionConfig({
  organizationId,
  initialPlan,
  initialConfiguration
}: {
  organizationId: string;
  initialPlan: string;
  initialConfiguration?: WhatsAppBotConfigurationInput | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan || "TRIAL");
  const [configuration, setConfiguration] = useState(() =>
    normalizeWhatsAppBotConfiguration(initialConfiguration ?? DEFAULT_WHATSAPP_BOT_CONFIGURATION)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const preview = useMemo(() => buildWhatsAppFirstReply(configuration), [configuration]);

  function setFlag(key: keyof WhatsAppBotConfiguration, value: boolean) {
    setConfiguration((current) => ({ ...current, [key]: value }));
  }

  function toggleService(key: WhatsAppBotServiceKey) {
    setConfiguration((current) => ({
      ...current,
      serviceBuckets: current.serviceBuckets.includes(key)
        ? current.serviceBuckets.filter((item) => item !== key)
        : [...current.serviceBuckets, key]
    }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/admin/customers/${organizationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "SAVE_BOT_CONFIGURATION", plan, configuration })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage(payload?.error || "Bot configuration could not be saved");
      return;
    }

    setMessage("Bot configuration saved");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6a16]">SaaS configuration</p>
          <h2 className="mt-2 text-lg font-black">WhatsApp AI bot</h2>
          <p className="mt-1 text-sm text-[#68645c]">Replies are English-only and use this client&apos;s enabled services.</p>
        </div>
        <label className="flex items-center gap-3 text-sm font-black">
          <input
            type="checkbox"
            checked={configuration.enabled}
            onChange={(event) => setFlag("enabled", event.target.checked)}
            className="size-5 accent-[#8a6a16]"
          />
          Automation active
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.12em] text-[#68645c]" htmlFor="client-plan">Client plan</label>
          <select id="client-plan" value={plan} onChange={(event) => setPlan(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 text-sm font-bold outline-none focus:border-[#8a6a16]">
            {PLAN_OPTIONS.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
          </select>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#68645c]">Enabled capabilities</p>
          <div className="mt-3 space-y-2">
            {WHATSAPP_BOT_SERVICE_OPTIONS.map((option) => (
              <label key={option.key} className="flex items-center gap-3 rounded-md border border-black/6 px-3 py-3 text-sm font-semibold">
                <input type="checkbox" checked={configuration.serviceBuckets.includes(option.key)} onChange={() => toggleService(option.key)} className="size-4 accent-[#8a6a16]" />
                {option.label}
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Toggle label="AI Audit offer" checked={configuration.auditEnabled} onChange={(value) => setFlag("auditEnabled", value)} />
            <Toggle label="15-day trial" checked={configuration.trialEnabled} onChange={(value) => setFlag("trialEnabled", value)} />
            <Toggle label="Human handoff" checked={configuration.humanHandoffEnabled} onChange={(value) => setFlag("humanHandoffEnabled", value)} />
            <Toggle label="Collect lead details" checked={configuration.collectLeadDetails} onChange={(value) => setFlag("collectLeadDetails", value)} />
            <Toggle label="First-contact welcome" checked={configuration.welcomeEnabled} onChange={(value) => setFlag("welcomeEnabled", value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.12em] text-[#68645c]" htmlFor="welcome-message">Opening message</label>
          <textarea
            id="welcome-message"
            value={configuration.welcomeMessage}
            onChange={(event) => setConfiguration((current) => ({ ...current, welcomeMessage: event.target.value }))}
            maxLength={500}
            className="mt-2 min-h-24 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#8a6a16]"
          />

          <p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#68645c]">First-reply preview</p>
          <div className="mt-2 whitespace-pre-wrap rounded-md border border-[#ccebdd] bg-[#effaf5] p-4 text-sm leading-6 text-[#173d33]">{preview}</div>
        </div>
      </div>

      {message ? <p className={`mt-4 text-sm font-semibold ${message.includes("saved") ? "text-[#8a6a16]" : "text-[#a3342b]"}`}>{message}</p> : null}
      <div className="mt-5 flex justify-end">
        <Button disabled={saving || !configuration.welcomeMessage.trim()} onClick={save}>{saving ? "Saving..." : "Save bot configuration"}</Button>
      </div>
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-black/6 px-3 py-3 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#8a6a16]" />
      {label}
    </label>
  );
}
