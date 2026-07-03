"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CampaignTemplate } from "@/lib/campaign-compliance";

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

type ConsentSource = {
  value: string;
  label: string;
};

type CampaignRun = {
  id: string;
  name: string;
  status: string;
  templateName: string | null;
  requestedCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  estimatedCostPaisa: number;
  consentSource: string | null;
  testMode: boolean;
  createdAt: string;
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
    testMode: boolean;
  };
  campaignId: string | null;
  results: BroadcastResult[];
};

function parseLines(value: string) {
  return value
    .split(/[\n,;\t ]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toFixed(2)}`;
}

export function BroadcastBuilder({
  connected,
  contacts,
  testContacts,
  propertySlug,
  templates,
  consentSources,
  campaignRuns
}: {
  connected: boolean;
  contacts: BroadcastContact[];
  testContacts: TestContact[];
  propertySlug: string;
  templates: CampaignTemplate[];
  consentSources: ConsentSource[];
  campaignRuns: CampaignRun[];
}) {
  const approvedTemplates = useMemo(() => templates.filter((template) => template.status === "APPROVED"), [templates]);
  const [campaignName, setCampaignName] = useState("AI audit campaign");
  const [templateName, setTemplateName] = useState(approvedTemplates[0]?.name || "");
  const selectedTemplate = templates.find((template) => template.name === templateName) || approvedTemplates[0] || null;
  const [recipients, setRecipients] = useState("");
  const [variables, setVariables] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState(selectedTemplate?.defaultHeaderImageUrl || "");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [consentSource, setConsentSource] = useState("internal_test");
  const [consentProof, setConsentProof] = useState("");
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BroadcastPayload | null>(null);

  const recipientList = useMemo(() => Array.from(new Set(parseLines(recipients))), [recipients]);
  const recipientCount = recipientList.length;
  const variableCount = useMemo(() => parseLines(variables).length, [variables]);
  const approvedTestContacts = testContacts.filter((contact) => contact.campaignStatus === "approved_for_test").slice(0, 20);
  const sampleContacts = contacts.slice(0, 20);
  const estimatedCostPaisa = recipientCount * (selectedTemplate?.category === "MARKETING" ? 109 : selectedTemplate?.category === "UTILITY" ? 15 : 12);
  const templateReady = Boolean(selectedTemplate && selectedTemplate.status === "APPROVED");
  const consentReady = consentConfirmed && Boolean(consentSource) && consentProof.trim().length >= 8;
  const canSend = connected && templateReady && consentReady && finalConfirmed && recipientCount > 0 && !sending;

  function selectTemplate(name: string) {
    setTemplateName(name);
    const next = templates.find((template) => template.name === name);
    setHeaderImageUrl(next?.defaultHeaderImageUrl || "");
  }

  function fillRecentContacts() {
    setRecipients(sampleContacts.map((contact) => contact.phone).join("\n"));
    setTestMode(false);
    setConsentSource("whatsapp_inbound");
    setConsentProof("Recent WhatsApp leads selected from AiFrogi inbox.");
  }

  function fillTestContacts() {
    setRecipients(approvedTestContacts.map((contact) => contact.whatsappMobile).join("\n"));
    setTestMode(true);
    setConsentSource("manual_import");
    setConsentProof("Approved test database contacts for controlled campaign QA.");
  }

  function fillSingleInternalTest() {
    const first = approvedTestContacts[0]?.whatsappMobile || "";
    setRecipients(first);
    setTestMode(true);
    setConsentSource("internal_test");
    setConsentProof("Internal test number used for campaign verification.");
  }

  async function sendBroadcast() {
    if (!canSend || !selectedTemplate) return;

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
        templateName: selectedTemplate.name,
        languageCode: selectedTemplate.languageCode,
        bodyVariables: variables,
        headerImageUrl,
        metaChargeCategory: selectedTemplate.category,
        consentConfirmed,
        consentSource,
        consentProof,
        testMode,
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
      <Card className="border border-black/6 p-6 shadow-[0_16px_44px_rgba(45,31,58,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="product-eyebrow">Guided campaign wizard</p>
            <h2 className="mt-2 text-2xl font-semibold">Send only approved, consent-backed templates</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              Choose a template, prove consent, test internally, then send. AiFrogi blocks unknown templates and records the audit trail for every run.
            </p>
          </div>
          <Badge tone={connected ? "secondary" : "error"}>{connected ? "API connected" : "API not connected"}</Badge>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <WizardStep index="1" title="Template" ready={templateReady} />
          <WizardStep index="2" title="Audience" ready={recipientCount > 0} />
          <WizardStep index="3" title="Consent" ready={consentReady} />
          <WizardStep index="4" title="Confirm" ready={finalConfirmed} />
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="field-label">Campaign name</span>
            <input className="product-input mt-2" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Approved template</span>
            <select className="product-input mt-2" value={templateName} onChange={(event) => selectTemplate(event.target.value)}>
              {templates.map((template) => (
                <option key={template.name} value={template.name} disabled={template.status !== "APPROVED"}>
                  {template.label} - {template.status}
                </option>
              ))}
            </select>
          </label>

          {selectedTemplate ? (
            <div className="md:col-span-2 rounded-md border border-black/8 bg-[#faf8fb] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={selectedTemplate.status === "APPROVED" ? "secondary" : "tertiary"}>{selectedTemplate.status}</Badge>
                <Badge tone="neutral">{selectedTemplate.category}</Badge>
                <Badge tone="neutral">{selectedTemplate.languageCode}</Badge>
                <Badge tone="neutral">{selectedTemplate.headerType} header</Badge>
              </div>
              <p className="mt-3 text-sm font-semibold">{selectedTemplate.purpose}</p>
              <div className="mt-3 whitespace-pre-wrap rounded-md border border-black/6 bg-white p-4 text-sm leading-6 text-[#493b62]">{selectedTemplate.bodyPreview}</div>
              {selectedTemplate.buttonLabels.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTemplate.buttonLabels.map((label) => <span key={label} className="status-pill status-info">{label}</span>)}
                </div>
              ) : null}
            </div>
          ) : null}

          <label className="block md:col-span-2">
            <span className="field-label">Header image URL</span>
            <input className="product-input mt-2" value={headerImageUrl} onChange={(event) => setHeaderImageUrl(event.target.value)} placeholder="Required only for approved image-header templates" />
            <p className="mt-2 text-xs text-[var(--text-muted)]">The default image is filled only when the approved template expects it.</p>
          </label>

          <label className="block md:col-span-2">
            <span className="field-label">Template variables</span>
            <textarea className="product-input mt-2 min-h-24" value={variables} onChange={(event) => setVariables(event.target.value)} placeholder="One variable per line, in template order" />
          </label>

          <label className="block md:col-span-2">
            <span className="field-label">Recipients</span>
            <textarea className="product-input mt-2 min-h-36" value={recipients} onChange={(event) => setRecipients(event.target.value)} placeholder={"+918800940082\n+917058963898"} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" tone="surface" disabled={!approvedTestContacts.length} onClick={fillSingleInternalTest}>Use 1 internal test</Button>
              <Button type="button" tone="surface" disabled={!approvedTestContacts.length} onClick={fillTestContacts}>Use approved test DB</Button>
              <Button type="button" tone="surface" disabled={!sampleContacts.length} onClick={fillRecentContacts}>Use recent contacts</Button>
              <span className="text-xs font-semibold text-[var(--text-muted)]">Limit: 20 unique recipients. Approved test DB: {approvedTestContacts.length}</span>
            </div>
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="field-label">Consent source</span>
            <select className="product-input mt-2" value={consentSource} onChange={(event) => setConsentSource(event.target.value)}>
              {consentSources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-black/8 bg-[#faf8fb] p-4 text-sm font-semibold">
            <input type="checkbox" className="size-4 accent-[#c725ba]" checked={testMode} onChange={(event) => setTestMode(event.target.checked)} />
            Mark this as a controlled test send
          </label>
          <label className="block md:col-span-2">
            <span className="field-label">Consent proof or note</span>
            <textarea className="product-input mt-2 min-h-24" value={consentProof} onChange={(event) => setConsentProof(event.target.value)} placeholder="Example: Website opt-in form collected on 2026-07-03, or internal test number owned by operator." />
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          <CheckRow checked={consentConfirmed} onChange={setConsentConfirmed} title="I confirm this audience has permission to receive this WhatsApp message." />
          <CheckRow checked={finalConfirmed} onChange={setFinalConfirmed} title={`I reviewed ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}, ${selectedTemplate?.name || "template"}, and estimated Meta charge ${formatMoney(estimatedCostPaisa)}.`} />
        </div>

        {error ? <p className="mt-4 rounded-md border border-[#f5b9b2] bg-[#fff3f1] px-4 py-3 text-sm font-semibold text-[#a3342b]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!canSend} onClick={sendBroadcast}>
            {sending ? "Sending" : testMode ? "Send test campaign" : "Send campaign"}
          </Button>
          {!connected ? <span className="text-sm font-semibold text-[#a45f16]">Connect WhatsApp API before sending.</span> : null}
          {!templateReady ? <span className="text-sm font-semibold text-[#a45f16]">Only approved templates can be sent.</span> : null}
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="border border-black/6 p-5 shadow-[0_16px_44px_rgba(45,31,58,0.08)]">
          <p className="product-eyebrow">Campaign guardrails</p>
          <div className="mt-4 space-y-3">
            <SummaryRow label="Recipients" value={String(recipientCount)} />
            <SummaryRow label="Template" value={selectedTemplate?.name || "None"} />
            <SummaryRow label="Variables" value={String(variableCount)} />
            <SummaryRow label="Image header" value={headerImageUrl ? "Included" : "None"} />
            <SummaryRow label="Estimated Meta cost" value={formatMoney(estimatedCostPaisa)} />
            <SummaryRow label="Consent" value={consentReady ? "Recorded" : "Missing"} />
            <SummaryRow label="Mode" value={testMode ? "Test send" : "Campaign send"} />
          </div>
        </Card>

        {result ? (
          <Card className="border border-black/6 p-5 shadow-[0_16px_44px_rgba(45,31,58,0.08)]">
            <p className="product-eyebrow">Last send</p>
            <h3 className="mt-2 text-xl font-semibold">{result.summary.sent}/{result.summary.requested} accepted</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Campaign ID: {result.campaignId || "Not stored"}</p>
            <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-1">
              {result.results.map((item) => (
                <div key={item.to} className="rounded-md border border-black/8 bg-[#faf8fb] p-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{item.to}</strong>
                    <span className={item.ok ? "font-bold text-[#178665]" : "font-bold text-[#a3342b]"}>{item.ok ? "Accepted" : "Failed"}</span>
                  </div>
                  {item.error ? <p className="mt-2 text-[#a3342b]">{item.error}</p> : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <Card className="border border-black/6 p-5 shadow-[0_16px_44px_rgba(45,31,58,0.08)]">
          <p className="product-eyebrow">Recent campaign runs</p>
          <div className="mt-4 space-y-3">
            {campaignRuns.map((campaign) => (
              <div key={campaign.id} className="rounded-md border border-black/8 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{campaign.templateName || "Session text"} · {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(campaign.createdAt))}</p>
                  </div>
                  <Badge tone={campaign.status === "SENT" ? "secondary" : campaign.status === "FAILED" ? "error" : "tertiary"}>{campaign.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                  <MiniMetric label="Sent" value={campaign.sentCount} />
                  <MiniMetric label="Read" value={campaign.readCount} />
                  <MiniMetric label="Failed" value={campaign.failedCount} />
                  <MiniMetric label="Cost" value={formatMoney(campaign.estimatedCostPaisa)} />
                </div>
              </div>
            ))}
            {!campaignRuns.length ? <p className="rounded-md border border-black/8 bg-[#faf8fb] p-4 text-sm text-[var(--text-muted)]">No campaign runs yet. Send one internal test first.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WizardStep({ index, title, ready }: { index: string; title: string; ready: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${ready ? "border-[#cdeee3] bg-[#effaf5]" : "border-black/8 bg-[#faf8fb]"}`}>
      <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${ready ? "bg-[#178665] text-white" : "bg-[#f0edf4] text-[#746d7c]"}`}>{ready ? "✓" : index}</span>
      <strong className="ml-2 text-sm">{title}</strong>
    </div>
  );
}

function CheckRow({ checked, onChange, title }: { checked: boolean; onChange: (value: boolean) => void; title: string }) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-black/8 bg-[#faf8fb] p-4 text-sm leading-6">
      <input type="checkbox" className="mt-1 size-4 accent-[#c725ba]" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{title}</span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-black/8 bg-[#faf8fb] px-3 py-3 text-sm">
      <span className="font-semibold text-[var(--text-muted)]">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-[#faf8fb] p-2">
      <span className="block text-[10px] font-semibold text-[var(--text-muted)]">{label}</span>
      <strong className="mt-1 block">{value}</strong>
    </div>
  );
}
