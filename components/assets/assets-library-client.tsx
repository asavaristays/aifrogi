"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Asset, AssetInput } from "@/types";

const emptyAsset: AssetInput = {
  title: "",
  description: "",
  type: "IMAGE",
  category: "ROOM",
  url: "",
  thumbnailUrl: "",
  tags: []
};

export function AssetsLibraryClient({ assets }: { assets: Asset[] }) {
  const router = useRouter();
  const [formState, setFormState] = useState<AssetInput>(emptyAsset);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function saveAsset() {
    setIsSaving(true);
    setErrorMessage(null);

    const response = await fetch("/api/assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...formState,
        tags: formState.tags ?? []
      })
    });

    const payload = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Could not save asset");
      return;
    }

    setFormState(emptyAsset);
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="p-6">
        <h2 className="text-xl font-extrabold">Add Asset / Share Link</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Add room photos, experience video links, brochures, invoice links, or payment links for the hotel team to share.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Title</span>
            <input
              className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
              value={formState.title}
              onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Description</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Type</span>
              <select
                className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                value={formState.type}
                onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value }))}
              >
                {["IMAGE", "VIDEO_LINK", "PDF", "INVOICE_LINK", "PAYMENT_LINK", "BROCHURE_LINK"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Category</span>
              <select
                className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
                value={formState.category}
                onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
              >
                {["ROOM", "EXPERIENCE", "PROPERTY", "WEDDING", "DINING", "BROCHURE", "INVOICE", "PAYMENT", "OTHER"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">URL</span>
            <input
              className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
              value={formState.url}
              onChange={(event) => setFormState((current) => ({ ...current, url: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Thumbnail URL</span>
            <input
              className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
              value={formState.thumbnailUrl}
              onChange={(event) => setFormState((current) => ({ ...current, thumbnailUrl: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Tags</span>
            <input
              className="mt-2 w-full rounded-2xl border border-black/5 bg-[var(--surface-soft)] px-4 py-3 outline-none"
              value={(formState.tags ?? []).join(", ")}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                }))
              }
            />
          </label>
        </div>

        {errorMessage ? <p className="mt-4 text-sm font-semibold text-[var(--error)]">{errorMessage}</p> : null}

        <div className="mt-6 flex justify-end">
          <Button onClick={saveAsset} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Asset"}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-extrabold">{asset.title}</h3>
                  <Badge tone="neutral">{asset.type}</Badge>
                  <Badge tone="primary">{asset.category}</Badge>
                </div>
                {asset.description ? <p className="mt-2 text-sm text-[var(--text-muted)]">{asset.description}</p> : null}
                <p className="mt-3 break-all text-sm font-medium text-[var(--primary)]">{asset.url}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">Last updated: {asset.updatedAtLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {asset.tags.map((tag) => (
                    <Badge key={tag} tone="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={asset.url} target="_blank" rel="noreferrer">
                  <Button tone="surface">Open</Button>
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
