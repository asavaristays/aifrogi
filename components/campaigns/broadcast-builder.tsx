"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BroadcastContact = {
  id: string;
  name: string;
  phone: string;
  stage: string;
};

type TestContact = {
  id: string;
  businessName: string;
  whatsappMobile: string;
  campaignStatus: string;
};

type BroadcastResult = {
  to: string;
  ok: boolean;
  status: number;
  error: string | null;
  deliveryStatus: string | null;
  externalMessageId: string | null;
};

type BroadcastPayload = {
  summary: {
    requested: number;
    sent: number;
    failed: number;
    mode: string;
    templateName: string | null;
  };
  results: BroadcastResult[];
};

function parseLines(value: string) {
  return value
    .split(/[\n,;\t ]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function BroadcastBuilder({
  connected,
  contacts,
  testContacts,
  propertySlug
}: {
  connected: boolean;
  contacts: BroadcastContact[];
  testContacts: TestContact[];
  propertySlug: string;
}) {
  const [campaignName, setCampaignName] = useState("Trial follow-up");
  const [templateName, setTemplateName] = useState("");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [recipients, setRecipients] = useState("");
  const [variables, setVariables] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [metaChargeCategory, setMetaChargeCategory] = useState("MARKETING");
  const [hasConsent, setHasConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BroadcastPayload | null>(null);

  const recipientCount = useMemo(() => parseLines(recipients).length, [recipients]);
  const variableCount = useMemo(() => parseLines(variables).length, [variables]);
  const canSend = connected && hasConsent && recipientCount > 0 && Boolean(templateName.trim()) && !sending;
  const sampleContacts = contacts.slice(0, 20);
  const savedTestContacts = testContacts.slice(0, 20);
  const estimatedCost = recipientCount * (metaChargeCategory === "MARKETING" ? 1.09 : 0.15);

  function fillRecentContacts() {
    setRecipients(sampleContacts.map((contact) => contact.phone).join("\n"));
  }

  function fillTestContacts() {
    setRecipients(savedTestContacts.map((contact) => contact.whatsappMobile).join("\n"));
  }

  async function sendBroadcast() {
    if (!canSend) return;

    setSending(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/integrations/whatsapp/bulk-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "template",
        campaignName,
        recipients,
        templateName,
        languageCode,
        bodyVariables: variables,
        headerImageUrl,
        metaChargeCategory,
        propertySlug
      })
    });
    const payload = await response.json().catch(() => null);
    setSending(false);

    if (!response.ok) {
      setError(payload?.error || "Campaign could not be sent.");
      return;
    }

    setResult(payload);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
      <Card className="border border-black/6 p-6 shadow-[0_16px_44px_rgba(15,61,53,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c725ba]">Template broadcast</p>
            <h2 className="mt-2 text-2xl font-black">Send to opted-in WhatsApp contacts</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              Use this for outbound campaigns, reactivation, trial follow-ups, and announcements. Broadcasts use approved templates so delivery works outside the 24-hour reply window.
            </p>
          </div>
          <Badge tone={connected ? "secondary" : "error"}>{connected ? "API connected" : "API not connected"}</Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[#59645f]">Campaign name</span>
            <input
              className="mt-2 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#c725ba]"
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[#59645f]">Template language</span>
            <select
              className="mt-2 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#c725ba]"
              value={languageCode}
              onChange={(event) => setLanguageCode(event.target.value)}
            >
              <option value="en_US">English (US)</option>
              <option value="en">English</option>
              <option value="en_GB">English (UK)</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[#59645f]">Approved template name</span>
            <input
              className="mt-2 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#c725ba]"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Example: trial_follow_up, ai_audit_offer, hello_world"
            />
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
              The name must exactly match an approved template in the connected WhatsApp Business Account.
            </p>
          </label>
          <label className="block md:col-span-2">
            <span className="field-label">Header image URL</span>
            <input
              className="product-input mt-2"
              value={headerImageUrl}
              onChange={(event) => setHeaderImageUrl(event.target.value)}
              placeholder="Required only when the approved template has an image header"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button type="button" className="text-xs font-bold text-[#b923ae]" onClick={() => setHeaderImageUrl("https://lead.hotelradar.in/media/campaigns/goa-ai-audit-v2.jpg")}>Use approved AI audit creative</button>
              <span className="text-xs text-[var(--text-muted)]">Leave blank for text-only templates.</span>
            </div>
          </label>
          <label className="block">
            <span className="field-label">Meta category</span>
            <select className="product-input mt-2" value={metaChargeCategory} onChange={(event) => setMetaChargeCategory(event.target.value)}>
              <option value="MARKETING">Marketing</option>
              <option value="UTILITY">Utility</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>
          </label>
          <div className="rounded-md border border-black/8 bg-[#f8faf9] p-4">
            <span className="field-label">Estimated Meta charge</span>
            <p className="mt-2 text-xl font-bold">₹{estimatedCost.toFixed(2)}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Estimate for delivered messages. Meta bills separately; taxes or future rate changes may apply.</p>
          </div>
          <label className="block md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[#59645f]">Template variables</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#c725ba]"
              value={variables}
              onChange={(event) => setVariables(event.target.value)}
              placeholder="One variable per line, in template order"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[#59645f]">Recipients</span>
            <textarea
              className="mt-2 min-h-36 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#c725ba]"
              value={recipients}
              onChange={(event) => setRecipients(event.target.value)}
              placeholder={"+918800940082\n+917058963898"}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" tone="surface" disabled={!savedTestContacts.length} onClick={fillTestContacts}>
                Use test DB
              </Button>
              <Button type="button" tone="surface" disabled={!sampleContacts.length} onClick={fillRecentContacts}>
                Use recent contacts
              </Button>
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Test DB: {savedTestContacts.length} numbers. Batch limit: 20 numbers.
              </span>
            </div>
          </label>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-md border border-black/8 bg-[#f8faf9] p-4 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={hasConsent}
            onChange={(event) => setHasConsent(event.target.checked)}
          />
          <span>
            I confirm these contacts gave permission to receive WhatsApp messages from this business.
          </span>
        </label>

        {error ? <p className="mt-4 rounded-md border border-[#f5b9b2] bg-[#fff3f1] px-4 py-3 text-sm font-semibold text-[#a3342b]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!canSend} onClick={sendBroadcast}>
            {sending ? "Sending" : "Send template broadcast"}
          </Button>
          {!connected ? <span className="text-sm font-semibold text-[#a45f16]">Connect WhatsApp API before sending.</span> : null}
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="border border-black/6 p-5 shadow-[0_16px_44px_rgba(15,61,53,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c725ba]">Campaign guardrails</p>
          <div className="mt-4 space-y-3">
            <SummaryRow label="Recipients" value={String(recipientCount)} />
            <SummaryRow label="Saved test DB" value={String(savedTestContacts.length)} />
            <SummaryRow label="Variables" value={String(variableCount)} />
            <SummaryRow label="Image header" value={headerImageUrl ? "Included" : "None"} />
            <SummaryRow label="Estimated Meta cost" value={`₹${estimatedCost.toFixed(2)}`} />
            <SummaryRow label="Mode" value="Approved template" />
            <SummaryRow label="Connection" value={connected ? "Ready" : "Blocked"} />
          </div>
        </Card>

        <Card className="border border-black/6 p-5 shadow-[0_16px_44px_rgba(15,61,53,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c725ba]">What this enables</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#4d5a55]">
            <p>Send offer, reminder, review, payment, and follow-up templates to customers who opted in.</p>
            <p>Replies automatically come back to the shared WhatsApp inbox and become leads.</p>
            <p>Templates must be approved once; after that the client does not handle Meta credentials.</p>
          </div>
        </Card>

        {result ? (
          <Card className="border border-black/6 p-5 shadow-[0_16px_44px_rgba(15,61,53,0.06)]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c725ba]">Last send</p>
            <h3 className="mt-2 text-xl font-black">
              {result.summary.sent}/{result.summary.requested} accepted
            </h3>
            <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-1">
              {result.results.map((item) => (
                <div key={item.to} className="rounded-md border border-black/8 bg-[#f8faf9] p-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{item.to}</strong>
                    <span className={item.ok ? "font-black text-[#c725ba]" : "font-black text-[#a3342b]"}>
                      {item.ok ? "Accepted" : "Failed"}
                    </span>
                  </div>
                  {item.error ? <p className="mt-2 text-[#a3342b]">{item.error}</p> : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-black/8 bg-[#f8faf9] px-3 py-3 text-sm">
      <span className="font-semibold text-[var(--text-muted)]">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
