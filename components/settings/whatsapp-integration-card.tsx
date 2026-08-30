"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WhatsAppIntegration } from "@/types";

export function WhatsAppIntegrationCard({
  integration,
  twilioAccountSid,
  twilioTestTo,
  webhookUrl,
  twilioReady
}: {
  integration: WhatsAppIntegration;
  twilioAccountSid: string;
  twilioTestTo: string;
  webhookUrl: string;
  twilioReady: boolean;
}) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    provider: integration.provider,
    businessAccountId: integration.businessAccountId ?? twilioAccountSid,
    phoneNumberId: integration.phoneNumberId ?? "",
    displayPhoneNumber: integration.displayPhoneNumber ?? "",
    webhookVerifyToken: integration.webhookVerifyToken ?? "lead-os-webhook-token",
    accessToken: "",
    notes: integration.notes ?? "WhatsApp connected for this workspace",
    approvedBy: integration.approvedBy ?? "AiFrogi Administrator",
    aiModeEnabled: integration.aiModeEnabled
  });
  const [testRecipient, setTestRecipient] = useState(twilioTestTo);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshingKb, setRefreshingKb] = useState(false);
  const [testingKb, setTestingKb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [kbResult, setKbResult] = useState<string | null>(null);
  const [kbQuestion, setKbQuestion] = useState("What is included in the 15-day trial?");

  async function save() {
    setSaving(true);
    setError(null);
    setTestResult(null);

    const response = await fetch("/api/integrations/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState)
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not save WhatsApp configuration");
      return;
    }

    router.refresh();
  }

  async function runTest() {
    setTesting(true);
    setError(null);
    setTestResult(null);

    const response = await fetch("/api/integrations/whatsapp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: testRecipient,
        message: "WhatsApp connection test from AiFrogi"
      })
    });

    const payload = await response.json();
    setTesting(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not run WhatsApp test");
      return;
    }

    setTestResult(`${payload.result.status}: ${payload.result.note}`);
  }

  async function refreshKnowledgeBase() {
    setRefreshingKb(true);
    setError(null);
    setKbResult(null);

    const response = await fetch("/api/integrations/whatsapp/kb/refresh", {
      method: "POST"
    });
    const payload = await response.json().catch(() => null);
    setRefreshingKb(false);

    if (!response.ok) {
      setError(payload?.error ?? "Could not refresh website knowledge base");
      return;
    }

    setKbResult(`Knowledge base refreshed: ${payload.pages} pages from ${payload.baseUrl}`);
  }

  async function testKnowledgeAnswer() {
    if (!kbQuestion.trim()) return;
    setTestingKb(true);
    setError(null);
    setKbResult(null);

    const response = await fetch("/api/integrations/whatsapp/kb/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: kbQuestion })
    });
    const payload = await response.json().catch(() => null);
    setTestingKb(false);

    if (!response.ok) {
      setError(payload?.error ?? "Could not test knowledge answer");
      return;
    }

    setKbResult(`${payload.mode === "openai_kb" ? "OpenAI KB" : "Rule fallback"}: ${payload.answer}`);
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold">WhatsApp Business</h3>
            <Badge tone={integration.status === "CONNECTED" ? "secondary" : integration.status === "CONFIGURED" ? "primary" : "tertiary"}>
              {integration.status}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Review the live WhatsApp provider setup for this workspace, validate the webhook, and control AI mode for the primary messaging flow.
          </p>
        </div>
        <div className="text-sm text-[var(--text-muted)]">
          <p>Approved by: {integration.approvedBy ?? "Pending"}</p>
          <p>Last validated: {integration.lastValidatedAtLabel ?? "Not yet validated"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Provider</span>
          <select
            className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
            value={formState.provider}
            onChange={(event) => setFormState((current) => ({ ...current, provider: event.target.value }))}
          >
            <option value="META_CLOUD_API">META_CLOUD_API</option>
            <option value="TWILIO_WHATSAPP">TWILIO_WHATSAPP</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Display Phone Number</span>
          <input
            className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
            value={formState.displayPhoneNumber}
            onChange={(event) => setFormState((current) => ({ ...current, displayPhoneNumber: event.target.value }))}
            readOnly={formState.provider === "TWILIO_WHATSAPP"}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Business Account ID</span>
          <input
            className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
            value={formState.businessAccountId}
            onChange={(event) => setFormState((current) => ({ ...current, businessAccountId: event.target.value }))}
            readOnly={formState.provider === "TWILIO_WHATSAPP"}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Phone Number ID</span>
          <input
            className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
            value={formState.phoneNumberId}
            onChange={(event) => setFormState((current) => ({ ...current, phoneNumberId: event.target.value }))}
            placeholder={formState.provider === "TWILIO_WHATSAPP" ? "Not required for Twilio Sandbox" : ""}
            readOnly={formState.provider === "TWILIO_WHATSAPP"}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Webhook Verify Token</span>
          <input
            className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
            value={formState.webhookVerifyToken}
            onChange={(event) => setFormState((current) => ({ ...current, webhookVerifyToken: event.target.value }))}
            readOnly={formState.provider === "TWILIO_WHATSAPP"}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {formState.provider === "TWILIO_WHATSAPP" ? "Twilio Auth Token" : "Access Token"}
          </span>
          <input
            type="password"
            className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
            value={formState.accessToken}
            onChange={(event) => setFormState((current) => ({ ...current, accessToken: event.target.value }))}
            placeholder={
              formState.provider === "TWILIO_WHATSAPP"
                ? "Already loaded on the server unless you want to replace it"
                : "Paste token to connect real provider"
            }
          />
          <p className="text-xs text-[var(--text-muted)]">
            Leave this blank to keep the token already saved in AiFrogi. Paste a fresh token only when rotating Meta access.
          </p>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Notes</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
            value={formState.notes}
            onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-[var(--surface-soft)] p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Webhook URL</p>
          <p className="mt-2 break-all font-semibold">{webhookUrl}</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-[var(--surface-soft)] p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Test Recipient</p>
          <input
            className="mt-2 w-full rounded-xl border border-black/5 bg-white px-3 py-2 font-semibold outline-none"
            value={testRecipient}
            onChange={(event) => setTestRecipient(event.target.value)}
            placeholder="+919876543210"
          />
        </div>
        <div className="rounded-2xl border border-black/5 bg-[var(--surface-soft)] p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Server Status</p>
          <p className="mt-2 font-semibold">{twilioReady ? "Provider credentials loaded" : "Provider credentials missing"}</p>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={formState.aiModeEnabled}
          onChange={(event) => setFormState((current) => ({ ...current, aiModeEnabled: event.target.checked }))}
        />
        AI Mode Enabled - automatically qualify new WhatsApp enquiries
      </label>

      <div className="mt-5 rounded-lg border border-black/5 bg-[#f8fafc] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black text-[#0f172a]">Website knowledge base</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Crawls the public website, answers with the bot constitution, and falls back to rule-based replies when OpenAI is unavailable.
            </p>
          </div>
          <Button tone="surface" onClick={refreshKnowledgeBase} disabled={refreshingKb}>
            {refreshingKb ? "Refreshing..." : "Refresh KB"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            className="min-h-11 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#8a6a16]"
            value={kbQuestion}
            onChange={(event) => setKbQuestion(event.target.value)}
            placeholder="Ask a test question"
          />
          <Button onClick={testKnowledgeAnswer} disabled={testingKb || !kbQuestion.trim()}>
            {testingKb ? "Testing..." : "Test KB Answer"}
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-[var(--error)]">{error}</p> : null}
      {testResult ? <p className="mt-4 text-sm font-semibold text-[var(--secondary)]">{testResult}</p> : null}
      {kbResult ? <p className="mt-4 whitespace-pre-wrap text-sm font-semibold text-[var(--secondary)]">{kbResult}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save WhatsApp Settings"}
        </Button>
        <Button tone="surface" onClick={runTest} disabled={testing || !testRecipient.trim()}>
          {testing ? "Testing..." : "Run Test Message"}
        </Button>
      </div>
    </Card>
  );
}
