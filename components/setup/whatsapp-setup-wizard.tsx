"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WhatsAppIntegration } from "@/types";

const steps = [
  { title: "Business account", helper: "Number and Meta IDs" },
  { title: "Credentials", helper: "Permanent secure access" },
  { title: "Webhook", helper: "Receive messages and status" },
  { title: "Operation", helper: "AI and human takeover" },
  { title: "Go live", helper: "Save and validate" }
];

export function WhatsAppSetupWizard({
  integration,
  webhookUrl,
  workspaceName,
  workspaceSlug
}: {
  integration: WhatsAppIntegration;
  webhookUrl: string;
  workspaceName: string;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(integration.status === "CONNECTED");
  const [messagesSubscribed, setMessagesSubscribed] = useState(integration.status === "CONNECTED");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [form, setForm] = useState({
    provider: "META_CLOUD_API",
    businessAccountId: integration.businessAccountId ?? "",
    phoneNumberId: integration.phoneNumberId ?? "",
    displayPhoneNumber: integration.displayPhoneNumber ?? "",
    webhookVerifyToken: integration.webhookVerifyToken ?? `leados-${workspaceSlug}-verify`,
    accessToken: "",
    approvedBy: integration.approvedBy ?? "AiFrogi Admin",
    notes: integration.notes ?? "Official Meta WhatsApp Cloud API workspace",
    aiModeEnabled: integration.aiModeEnabled
  });

  const connected = integration.status === "CONNECTED";
  const completed = [
    Boolean(form.businessAccountId && form.phoneNumberId),
    Boolean(form.webhookVerifyToken && (form.accessToken || connected)),
    webhookSaved && messagesSubscribed,
    consentConfirmed,
    false
  ];

  function update(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function next() {
    setError(null);
    if (activeStep === 0 && !completed[0]) {
      setError("Enter the WhatsApp Business Account ID and Phone Number ID.");
      return;
    }
    if (activeStep === 1 && !completed[1]) {
      setError("Enter the webhook verify token and a permanent system-user access token.");
      return;
    }
    if (activeStep === 2 && !completed[2]) {
      setError("Confirm that the callback URL is saved and the messages field is subscribed in Meta.");
      return;
    }
    if (activeStep === 3 && !completed[3]) {
      setError("Confirm that campaigns will only target opted-in WhatsApp contacts.");
      return;
    }
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function copyWebhook() {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function saveAndValidate() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const saveResponse = await fetch("/api/integrations/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const savePayload = await saveResponse.json().catch(() => null);

    if (!saveResponse.ok) {
      setSaving(false);
      setError(savePayload?.error ?? "Could not save the WhatsApp configuration.");
      return;
    }

    const validationResponse = await fetch("/api/integrations/whatsapp/validate", { method: "POST" });
    const validationPayload = await validationResponse.json().catch(() => null);
    setSaving(false);

    if (!validationResponse.ok) {
      setError(validationPayload?.error ?? "Configuration was saved, but Meta validation failed.");
      router.refresh();
      return;
    }

    setSuccess(
      "Connected as " +
        (validationPayload?.phone?.verifiedName || validationPayload?.phone?.displayPhoneNumber || form.displayPhoneNumber)
    );
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="h-fit overflow-hidden border border-black/5 p-0 shadow-[0_18px_55px_rgba(15,61,53,0.08)]">
        <div className="bg-[linear-gradient(135deg,#2c243b,#c725ba)] p-6 text-white">
          <Badge tone={connected ? "secondary" : "tertiary"}>{connected ? "Connected" : "Setup required"}</Badge>
          <h2 className="mt-4 text-2xl font-black">{workspaceName}</h2>
          <p className="mt-2 text-sm leading-6 text-white/68">Connect this client to the official WhatsApp Cloud API.</p>
        </div>
        <div className="p-3">
          {steps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setActiveStep(index)}
              className={
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition " +
                (activeStep === index ? "bg-[#e8f8ee] text-[#493b62]" : "text-[var(--text-muted)] hover:bg-black/3")
              }
            >
              <span className={
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black " +
                (completed[index] || (index === 4 && connected) ? "bg-[#25d366] text-[#063f3a]" : activeStep === index ? "bg-[#c725ba] text-white" : "bg-black/5")
              }>
                {completed[index] || (index === 4 && connected) ? "✓" : index + 1}
              </span>
              <span>
                <strong className="block text-sm">{step.title}</strong>
                <small className="mt-0.5 block text-xs opacity-70">{step.helper}</small>
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="border border-black/5 p-6 shadow-[0_20px_60px_rgba(15,61,53,0.08)] sm:p-8">
        <div className="flex flex-col gap-3 border-b border-black/5 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#c725ba]">Step {activeStep + 1} of {steps.length}</p>
            <h2 className="mt-2 text-2xl font-black">{steps[activeStep].title}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{steps[activeStep].helper}</p>
          </div>
          <Badge tone="neutral">Meta Cloud API</Badge>
        </div>

        <div className="py-6">
          {activeStep === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="WhatsApp Business Account ID" value={form.businessAccountId} onChange={(value) => update("businessAccountId", value)} placeholder="WABA ID" />
              <Field label="Phone Number ID" value={form.phoneNumberId} onChange={(value) => update("phoneNumberId", value)} placeholder="Meta Phone Number ID" />
              <div className="md:col-span-2 rounded-3xl border border-[#25d366]/15 bg-[#f2faf6] p-5 text-sm leading-6 text-[var(--text-muted)]">
                Use the two IDs shown under WhatsApp Manager → API Setup. AiFrogi fetches the display number and verified business name automatically during validation.
              </div>
            </div>
          ) : null}

          {activeStep === 1 ? (
            <div className="space-y-5">
              <Field label="Webhook verify token" value={form.webhookVerifyToken} onChange={(value) => update("webhookVerifyToken", value)} placeholder="Create a private verify token" />
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.17em] text-[var(--text-muted)]">Permanent system-user access token</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-2xl border border-black/8 bg-[#f7faf8] px-4 py-3.5 outline-none focus:border-[#c725ba]"
                  value={form.accessToken}
                  onChange={(event) => update("accessToken", event.target.value)}
                  placeholder={connected ? "Leave blank to keep the encrypted token already saved" : "Paste permanent Meta token"}
                />
              </label>
              <div className="rounded-3xl border border-black/5 bg-[#2c243b] p-5 text-sm leading-6 text-white/74">
                AiFrogi encrypts both tokens before database storage. Required permissions are WhatsApp Business messaging and management for the connected business account.
              </div>
            </div>
          ) : null}

          {activeStep === 2 ? (
            <div className="space-y-5">
              <div className="rounded-3xl border border-black/5 bg-[#2c243b] p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7ff0ae]">Callback URL</p>
                <code className="mt-3 block break-all text-sm font-semibold">{webhookUrl}</code>
                <Button className="mt-4" onClick={copyWebhook}>{copied ? "Copied" : "Copy URL"}</Button>
              </div>
              <CheckRow checked={webhookSaved} onChange={setWebhookSaved} title="Callback URL verified and saved in Meta" helper="Use the same verify token entered in the previous step." />
              <CheckRow checked={messagesSubscribed} onChange={setMessagesSubscribed} title="messages webhook field subscribed" helper="This delivers inbound messages and delivery/read status updates to AiFrogi." />
            </div>
          ) : null}

          {activeStep === 3 ? (
            <div className="space-y-5">
              <CheckRow checked={form.aiModeEnabled} onChange={(value) => update("aiModeEnabled", value)} title="Enable AI first response" helper="AI can answer first; agents can take over from the shared inbox." />
              <CheckRow checked={true} onChange={() => undefined} title="Shared operator inbox" helper="Incoming conversations remain visible for human response and takeover." locked />
              <CheckRow checked={consentConfirmed} onChange={setConsentConfirmed} title="Only message opted-in contacts" helper="Template broadcasts must follow Meta policy and the contact's consent." />
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.17em] text-[var(--text-muted)]">Workspace notes</span>
                <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-black/8 bg-[#f7faf8] px-4 py-3.5 outline-none focus:border-[#c725ba]" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
              </label>
            </div>
          ) : null}

          {activeStep === 4 ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Review label="Client workspace" value={workspaceName} />
                <Review label="WhatsApp number" value={form.displayPhoneNumber || "Fetched from Meta after validation"} />
                <Review label="Business Account ID" value={form.businessAccountId} />
                <Review label="Phone Number ID" value={form.phoneNumberId} />
                <Review label="AI first response" value={form.aiModeEnabled ? "Enabled" : "Disabled"} />
                <Review label="Webhook" value={webhookSaved && messagesSubscribed ? "Configured" : "Incomplete"} />
                <Review label="Current status" value={integration.status} />
              </div>
              <div className="rounded-3xl border border-[#25d366]/20 bg-[#eaf9ef] p-5 text-sm leading-6 text-[#493b62]">
                Saving will update this workspace only. The access token is never returned to the browser after storage.
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="mb-4 rounded-2xl bg-[#fee2e2] px-4 py-3 text-sm font-bold text-[#b91c1c]">{error}</p> : null}
        {success ? <p className="mb-4 rounded-2xl bg-[#dcfce7] px-4 py-3 text-sm font-bold text-[#493b62]">{success}</p> : null}

        <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-5">
          <Button tone="surface" disabled={activeStep === 0 || saving} onClick={() => setActiveStep((current) => Math.max(0, current - 1))}>Back</Button>
          {activeStep < steps.length - 1 ? (
            <Button disabled={saving} onClick={next}>Continue</Button>
          ) : (
            <Button disabled={saving} onClick={saveAndValidate}>{saving ? "Validating..." : "Save and validate"}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.17em] text-[var(--text-muted)]">{label}</span>
      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-[#f7faf8] px-4 py-3.5 outline-none focus:border-[#c725ba]" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function CheckRow({ checked, onChange, title, helper, locked = false }: { checked: boolean; onChange: (value: boolean) => void; title: string; helper: string; locked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-black/5 bg-[#f7faf8] p-5">
      <input type="checkbox" className="mt-1 h-5 w-5 accent-[#c725ba]" checked={checked} disabled={locked} onChange={(event) => onChange(event.target.checked)} />
      <span><strong className="block text-sm">{title}</strong><small className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{helper}</small></span>
    </label>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-black/5 bg-[#f7faf8] p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p><p className="mt-2 break-all text-sm font-black">{value || "Not provided"}</p></div>;
}
