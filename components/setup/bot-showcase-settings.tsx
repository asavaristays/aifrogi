"use client";

import { useState } from "react";
import type { ShowcaseItem } from "@/lib/repositories/knowledge-repository";

const blank = (): ShowcaseItem => ({ id: crypto.randomUUID(), imageUrl: "", title: "", text: "", linkUrl: "", linkLabel: "Learn more" });

export function BotShowcaseSettings({ initialItems, canManage }: { initialItems: ShowcaseItem[]; canManage: boolean }) {
  const [items, setItems] = useState<ShowcaseItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [notice, setNotice] = useState("");
  const update = (id: string, patch: Partial<ShowcaseItem>) => setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  async function upload(id: string, file?: File) {
    if (!file) return;
    setUploading(id); setNotice("");
    const data = new FormData(); data.set("file", file);
    try {
      const response = await fetch("/api/setup/showcase-upload", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Image upload failed.");
      update(id, { imageUrl: payload.url }); setNotice("Image uploaded. Save the carousel to publish it.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Image upload failed."); }
    finally { setUploading(""); }
  }
  async function save() {
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/knowledge", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ showcaseItems: items }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save the carousel.");
      setItems(payload.settings.showcaseItems); setNotice("Showcase carousel saved. New bot loads will display it.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save the carousel."); }
    finally { setSaving(false); }
  }
  return <section id="bot-showcase" className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
    <p className="product-eyebrow">Setup · customer showcase</p><h2 className="mt-1 text-xl font-semibold">Photo carousel</h2>
    <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">Present properties, products, services, offers or facilities inside the bot. Add up to eight slides; each remains private to this workspace.</p>
    <div className="mt-5 grid gap-4">{items.map((item, index) => <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[#fbfaf7] p-4">
      <div className="flex items-center justify-between gap-3"><strong className="text-sm">Slide {index + 1}</strong><button type="button" disabled={!canManage} onClick={() => setItems(current => current.filter(value => value.id !== item.id))} className="text-xs font-semibold text-red-700 disabled:opacity-40">Remove</button></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-32 w-full rounded-lg border border-[var(--border)] object-cover" /> : <div className="grid h-32 place-items-center rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">No image</div>}
        <div className="grid gap-3 sm:grid-cols-2"><label><span className="field-label">Title</span><input className="product-input mt-1" value={item.title} maxLength={80} disabled={!canManage} onChange={event => update(item.id, { title: event.target.value })} placeholder="Property, product or service" /></label><label><span className="field-label">Image URL</span><input className="product-input mt-1" value={item.imageUrl} maxLength={500} disabled={!canManage} onChange={event => update(item.id, { imageUrl: event.target.value })} placeholder="https://…" /></label><label className="sm:col-span-2"><span className="field-label">Text below photo</span><textarea className="product-input mt-1 min-h-20 py-3" value={item.text} maxLength={240} disabled={!canManage} onChange={event => update(item.id, { text: event.target.value })} placeholder="Explain what the customer is viewing and why it matters." /></label><label><span className="field-label">Optional action link</span><input className="product-input mt-1" value={item.linkUrl} maxLength={500} disabled={!canManage} onChange={event => update(item.id, { linkUrl: event.target.value })} placeholder="https://…" /></label><label><span className="field-label">Button text</span><input className="product-input mt-1" value={item.linkLabel} maxLength={40} disabled={!canManage} onChange={event => update(item.id, { linkLabel: event.target.value })} placeholder="Learn more" /></label><label className="sm:col-span-2"><span className="field-label">Or upload an image</span><input className="mt-1 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" disabled={!canManage || uploading === item.id} onChange={event => void upload(item.id, event.target.files?.[0])} /><small className="text-xs text-[var(--text-muted)]">JPG, PNG or WebP, maximum 2 MB. Landscape images work best.</small></label></div>
      </div></article>)}</div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={!canManage || items.length >= 8} onClick={() => setItems(current => [...current, blank()])} className="min-h-11 rounded-full border border-[var(--border)] px-5 text-sm font-semibold disabled:opacity-40">Add slide</button><button type="button" disabled={!canManage || saving} onClick={save} className="min-h-11 rounded-full bg-[#9a7411] px-5 text-sm font-semibold text-white disabled:opacity-40">{saving ? "Saving…" : "Save carousel"}</button></div>
    {notice ? <p role="status" className="mt-4 rounded-lg bg-[var(--info-soft)] px-4 py-3 text-sm text-[#385d8e]">{notice}</p> : null}
  </section>;
}
