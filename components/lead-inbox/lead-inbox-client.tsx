"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { quickActions } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icons";
import { useAppState } from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";
import type { Asset, AssetShare, Lead, LeadInput } from "@/types";

const defaultLeadForm: LeadInput = {
  name: "",
  source: "WhatsApp",
  stage: "New",
  language: "HI",
  intent: "",
  stay: "",
  party: "",
  budget: "",
  phone: "",
  score: 60,
  tags: [],
  isHighPriority: false
};

export function LeadInboxClient({
  leads,
  initialLeadId
}: {
  leads: Lead[];
  initialLeadId?: string;
}) {
  const router = useRouter();
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId ?? leads[0]?.id);
  const { preferredLanguage, setPreferredLanguage } = useAppState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showShareAsset, setShowShareAsset] = useState(false);
  const [formState, setFormState] = useState<LeadInput>(defaultLeadForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetShares, setAssetShares] = useState<AssetShare[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [shareNote, setShareNote] = useState("");

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0],
    [leads, selectedLeadId]
  );

  useEffect(() => {
    if (!selectedLead) return;

    let cancelled = false;

    async function loadAssetData() {
      const [assetsResponse, sharesResponse] = await Promise.all([
        fetch("/api/assets"),
        fetch(`/api/leads/${selectedLead.id}/assets`)
      ]);

      const assetsPayload = await assetsResponse.json();
      const sharesPayload = await sharesResponse.json();

      if (!cancelled) {
        setAssets(assetsPayload.assets ?? []);
        setAssetShares(sharesPayload.shares ?? []);
        setSelectedAssetId((assetsPayload.assets ?? [])[0]?.id ?? "");
      }
    }

    void loadAssetData();

    return () => {
      cancelled = true;
    };
  }, [selectedLead]);

  if (!selectedLead) {
    return (
      <Card className="p-8">
        <h2 className="text-xl font-extrabold">No leads yet</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Once your WhatsApp, email, AI bot, call, or manual source is connected, active leads will appear here.
        </p>
      </Card>
    );
  }

  function resetForm() {
    setFormState(defaultLeadForm);
    setErrorMessage(null);
  }

  async function submitAssetShare() {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/leads/${selectedLead.id}/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetId: selectedAssetId,
          note: shareNote,
          channel: "WHATSAPP"
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Could not share asset");
        return;
      }

      setShowShareAsset(false);
      setShareNote("");
      setSelectedAssetId(assets[0]?.id ?? "");
      router.refresh();
      const refreshed = await fetch(`/api/leads/${selectedLead.id}/assets`);
      const sharesPayload = await refreshed.json();
      setAssetShares(sharesPayload.shares ?? []);
    } catch {
      setErrorMessage("Network error while sharing asset");
    } finally {
      setIsSaving(false);
    }
  }

  function openAddForm() {
    resetForm();
    setShowEditForm(false);
    setShowAddForm(true);
  }

  function openEditForm() {
    setFormState({
      name: selectedLead.name,
      source: selectedLead.source,
      stage: selectedLead.stage,
      language: selectedLead.language,
      intent: selectedLead.intent,
      stay: selectedLead.stay,
      party: selectedLead.party,
      budget: selectedLead.budget,
      phone: selectedLead.phone,
      score: selectedLead.score,
      tags: selectedLead.tags,
      isHighPriority: selectedLead.tags.includes("High Priority")
    });
    setErrorMessage(null);
    setShowAddForm(false);
    setShowEditForm(true);
  }

  async function submitLead(endpoint: string, method: "POST" | "PATCH") {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formState,
          tags: formState.tags ?? []
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Could not save lead");
        return;
      }

      setShowAddForm(false);
      setShowEditForm(false);
      resetForm();
      router.refresh();
    } catch {
      setErrorMessage("Network error while saving lead");
    } finally {
      setIsSaving(false);
    }
  }

  function updateField<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {["Stage", "Source", "Score", "Language", "Date"].map((filter) => (
              <button
                key={filter}
                className="rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-bold text-[var(--text-muted)]"
              >
                {filter}
              </button>
            ))}
            <Button className="ml-auto" onClick={openAddForm}>
              Add Lead
            </Button>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {leads.map((lead) => {
            const selected = selectedLead.id === lead.id;
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={cn(
                  "w-full rounded-[22px] border p-4 text-left transition-all",
                  selected
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]/40 shadow-lg"
                    : "border-black/5 bg-white hover:-translate-y-0.5 hover:shadow-lg"
                )}
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-soft)] font-bold text-[var(--primary)]">
                    {lead.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{lead.name}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          Last updated: {lead.updatedAtLabel}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{lead.minutesAgo}m ago</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="neutral">{lead.source}</Badge>
                      <Badge tone={lead.score >= 80 ? "secondary" : lead.score >= 60 ? "tertiary" : "neutral"}>
                        {lead.score} score
                      </Badge>
                      <Badge tone={lead.stage === "Booked" ? "secondary" : "primary"}>{lead.stage}</Badge>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-black text-white">
                {selectedLead.initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-extrabold tracking-tight">{selectedLead.name}</h2>
                  <Badge tone="secondary">High Priority</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                  <span>{selectedLead.phone}</span>
                  <span>{selectedLead.stay}</span>
                  <span>{selectedLead.party}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium text-[var(--text-muted)]">
                    Last updated: {selectedLead.updatedAtLabel}
                  </span>
                  <Link
                    href={`/api/leads/${selectedLead.id}`}
                    target="_blank"
                    className="font-semibold text-[var(--primary)] underline underline-offset-4"
                  >
                    Check record
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button tone="surface">Call</Button>
              <Button tone="surface">Email</Button>
              <Button onClick={openEditForm}>Edit</Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Lead Intent Score
                </p>
                <div className="mt-5 flex items-center gap-6">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[var(--surface-soft)]">
                    <div
                      className="absolute inset-0 rounded-full border-[10px] border-transparent"
                      style={{
                        borderTopColor: "var(--primary)",
                        borderRightColor: "var(--secondary)",
                        transform: "rotate(40deg)"
                      }}
                    />
                    <div className="text-center">
                      <div className="text-3xl font-black">{selectedLead.score}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        /100
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {[
                      ["Seasonal fit", 88],
                      ["WhatsApp activity", 75],
                      ["Response speed", 90]
                    ].map(([label, value]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          <span>{label}</span>
                          <span className="text-[var(--primary)]">{value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--surface-soft)]">
                          <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Reservation Intent
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {[
                    ["Stay Window", selectedLead.stay],
                    ["Guests", selectedLead.party],
                    ["Source", selectedLead.source],
                    ["Budget", selectedLead.budget]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex justify-center">
                <Badge tone="neutral">Today</Badge>
              </div>
              <div className="mt-6 space-y-4">
                {selectedLead.transcript.map((message) => {
                  const outgoing = message.from !== "guest";
                  return (
                    <div
                      key={message.id}
                      className={cn("flex", outgoing ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-[22px] px-4 py-3 text-sm shadow-sm",
                          outgoing
                            ? "bg-[var(--primary)] text-white"
                            : "bg-white text-[var(--text)]"
                        )}
                      >
                        <p className="leading-relaxed">{message.text}</p>
                        <p className={cn("mt-2 text-[11px]", outgoing ? "text-white/70" : "text-[var(--text-muted)]")}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex rounded-full bg-[var(--surface-soft)] p-1">
                    {(["HI", "EN"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setPreferredLanguage(lang)}
                        className={cn(
                          "rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all",
                          preferredLanguage === lang
                            ? "bg-white text-[var(--primary)] shadow-sm"
                            : "text-[var(--text-muted)]"
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">AI-enhanced response active</span>
                </div>
                <div className="rounded-[22px] bg-[var(--surface-soft)] p-3">
                  <input
                    className="w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm outline-none"
                    placeholder={preferredLanguage === "HI" ? "Type in Hindi..." : "Type in English..."}
                    defaultValue={
                      preferredLanguage === "HI"
                        ? "हाँ, हमारे पास विशेष फैमली सुइट उपलब्ध है..."
                        : "Yes, we have a family suite available for your dates..."
                    }
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Check availability", "Send festival brochure", "Create quote"].map((pill) => (
                      <button
                        key={pill}
                        className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--primary)] shadow-sm"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Lead Context</p>
              <div className="mt-4 space-y-4">
                {selectedLead.tags.map((tag) => (
                  <div key={tag} className="rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold">
                    {tag}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Quick Actions</p>
              <div className="mt-4 grid gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    tone={action.tone === "error" ? "danger" : "surface"}
                    className="justify-start"
                    iconLeft={<Icon name={action.icon as never} />}
                    onClick={action.label === "Send Photos" ? () => setShowShareAsset(true) : undefined}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Shared Assets</p>
              <div className="mt-4 space-y-3">
                {assetShares.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No assets shared yet for this lead.</p>
                ) : (
                  assetShares.map((share) => (
                    <div key={share.id} className="rounded-2xl bg-[var(--surface-soft)] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{share.assetTitle}</p>
                        <Badge tone="neutral">{share.assetType}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">Shared: {share.sharedAtLabel}</p>
                      {share.note ? <p className="mt-2 text-sm text-[var(--text-muted)]">{share.note}</p> : null}
                      <a
                        href={share.assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm font-semibold text-[var(--primary)] underline underline-offset-4"
                      >
                        Open shared link
                      </a>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-3xl p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold">{showAddForm ? "Add Lead" : "Edit Lead"}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {showAddForm ? "Create a new lead in Prisma." : "Update the selected lead and persist changes to Prisma."}
                </p>
              </div>
              <Button
                tone="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  resetForm();
                }}
              >
                Close
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Name</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Phone</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Source</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.source}
                  onChange={(event) => updateField("source", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Stage</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.stage}
                  onChange={(event) => updateField("stage", event.target.value)}
                >
                  {["New", "Contacted", "Qualified", "Proposal Sent", "Booked", "Lost"].map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Language</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.language}
                  onChange={(event) => updateField("language", event.target.value as "HI" | "EN")}
                >
                  <option value="HI">HI</option>
                  <option value="EN">EN</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Score</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.score}
                  onChange={(event) => updateField("score", Number(event.target.value))}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Intent</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.intent}
                  onChange={(event) => updateField("intent", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Stay</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.stay}
                  onChange={(event) => updateField("stay", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Party</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.party}
                  onChange={(event) => updateField("party", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Budget</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={formState.budget}
                  onChange={(event) => updateField("budget", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Tags</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={(formState.tags ?? []).join(", ")}
                  onChange={(event) =>
                    updateField(
                      "tags",
                      event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </label>
            </div>

            <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={Boolean(formState.isHighPriority)}
                onChange={(event) => updateField("isHighPriority", event.target.checked)}
              />
              High priority
            </label>

            {errorMessage ? <p className="mt-4 text-sm font-semibold text-[var(--error)]">{errorMessage}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                tone="surface"
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  submitLead(showAddForm ? "/api/leads" : `/api/leads/${selectedLead.id}`, showAddForm ? "POST" : "PATCH")
                }
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : showAddForm ? "Create Lead" : "Save Changes"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showShareAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold">Share Asset</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Send photos, brochures, invoice links, or payment links for {selectedLead.name}.
                </p>
              </div>
              <Button tone="ghost" onClick={() => setShowShareAsset(false)}>
                Close
              </Button>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Select Asset</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={selectedAssetId}
                  onChange={(event) => setSelectedAssetId(event.target.value)}
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title} · {asset.type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Note</span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                  value={shareNote}
                  onChange={(event) => setShareNote(event.target.value)}
                  placeholder="Example: Sharing Family Suite gallery and brochure for review."
                />
              </label>
            </div>

            {errorMessage ? <p className="mt-4 text-sm font-semibold text-[var(--error)]">{errorMessage}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button tone="surface" onClick={() => setShowShareAsset(false)}>
                Cancel
              </Button>
              <Button onClick={submitAssetShare} disabled={isSaving || !selectedAssetId}>
                {isSaving ? "Sharing..." : "Share Asset"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
