"use client";

import { useState } from "react";
import { WIDGET_MENU_ICONS, type WidgetMenuAction, type WidgetMenuConfig, type WidgetMenuItem } from "@/lib/widget-menu";

const actions: Array<{ value: WidgetMenuAction; label: string }> = [
  { value: "LINK", label: "Website link" }, { value: "CHAT", label: "Start chat" },
  { value: "CALL", label: "Phone call" }, { value: "EMAIL", label: "Email" }, { value: "SUBMENU", label: "Submenu" }
];
const needsValue = (action: WidgetMenuAction) => ["LINK", "CALL", "EMAIL"].includes(action);
const placeholder = (action: WidgetMenuAction) => action === "LINK" ? "https://example.com/page" : action === "CALL" ? "+919876543210" : "help@example.com";
const fresh = (child = false): WidgetMenuItem => ({ id: crypto.randomUUID(), label: "", action: child ? "LINK" : "LINK", value: "", icon: "link" });

export function BotMenuSettings({ initialMenu, canManage }: { initialMenu?: WidgetMenuConfig; canManage: boolean }) {
  const [menu, setMenu] = useState<WidgetMenuConfig>(initialMenu || { enabled: false, heading: "What would you like to explore?", items: [] });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const update = (index: number, patch: Partial<WidgetMenuItem>) => setMenu(current => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  const move = (index: number, direction: -1 | 1) => setMenu(current => { const items = [...current.items]; const target = index + direction; if (target < 0 || target >= items.length) return current; [items[index], items[target]] = [items[target], items[index]]; return { ...current, items }; });
  const updateChild = (parent: number, child: number, patch: Partial<WidgetMenuItem>) => update(parent, { children: (menu.items[parent].children || []).map((item, index) => index === child ? { ...item, ...patch } : item) });
  const feature = (selected: number, enabled: boolean) => setMenu(current => ({ ...current, items: current.items.map((item, index) => ({ ...item, featured: enabled && index === selected })) }));
  const valid = !menu.enabled || (menu.heading.trim() && menu.items.length > 0 && menu.items.every(item => item.label.trim() && (item.action !== "SUBMENU" || item.children?.length)));
  async function save() {
    setSaving(true); setNotice(null);
    try {
      const response = await fetch("/api/setup/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ menu }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not save the main menu.");
      setMenu(payload.menu); setNotice("Main menu saved. New widget loads will use these options.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save the main menu."); }
    finally { setSaving(false); }
  }
  return <section id="bot-menu" className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
    <p className="product-eyebrow">Setup · main menu</p><h2 className="mt-1 text-xl font-semibold">Guide visitors to useful actions</h2>
    <p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">Create safe shortcuts shown before chat. Business facts and AI answers remain in Intelligence.</p>
    <label className="mt-5 flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-4 accent-[#8a6a16]" checked={menu.enabled} disabled={!canManage} onChange={event => setMenu(current => ({ ...current, enabled: event.target.checked }))} />Show a main menu in the bot</label>
    {menu.enabled ? <div className="mt-5 space-y-4">
      <label className="block"><span className="field-label">Menu heading</span><input className="product-input mt-2" maxLength={80} value={menu.heading} disabled={!canManage} onChange={event => setMenu(current => ({ ...current, heading: event.target.value }))} /></label>
      {menu.items.map((item, index) => <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[#fbfaf7] p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_130px_auto]">
          <label><span className="field-label">Label</span><input className="product-input mt-2" maxLength={54} value={item.label} disabled={!canManage} onChange={event => update(index, { label: event.target.value })} /></label>
          <label><span className="field-label">Action</span><select className="product-input mt-2" value={item.action} disabled={!canManage} onChange={event => { const action = event.target.value as WidgetMenuAction; update(index, { action, value: "", children: action === "SUBMENU" ? [fresh(true)] : undefined }); }}>{actions.map(action => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
          <label><span className="field-label">Icon</span><select className="product-input mt-2" value={item.icon} disabled={!canManage} onChange={event => update(index, { icon: event.target.value as WidgetMenuItem["icon"] })}>{WIDGET_MENU_ICONS.map(icon => <option key={icon}>{icon}</option>)}</select></label>
          <div className="flex items-end gap-1"><button type="button" className="min-h-11 px-2" disabled={!canManage || index === 0} onClick={() => move(index, -1)} aria-label={`Move ${item.label || "option"} up`}>↑</button><button type="button" className="min-h-11 px-2" disabled={!canManage || index === menu.items.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${item.label || "option"} down`}>↓</button><button type="button" className="min-h-11 px-2 text-red-700" disabled={!canManage} onClick={() => setMenu(current => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></div>
        </div>
        {needsValue(item.action) ? <label className="mt-3 block"><span className="field-label">Destination</span><input className="product-input mt-2" value={item.value || ""} disabled={!canManage} placeholder={placeholder(item.action)} onChange={event => update(index, { value: event.target.value })} /></label> : null}
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={item.featured === true} disabled={!canManage} onChange={event => feature(index, event.target.checked)} />Feature this option</label>
        {item.action === "SUBMENU" ? <div className="mt-4 space-y-3 border-l-2 border-[#d8c795] pl-4"><p className="field-label">Submenu options</p>{(item.children || []).map((child, childIndex) => <div key={child.id} className="grid gap-2 md:grid-cols-[1fr_140px_1fr_auto]"><input aria-label="Submenu label" className="product-input" maxLength={54} value={child.label} disabled={!canManage} placeholder="Option label" onChange={event => updateChild(index, childIndex, { label: event.target.value })} /><select aria-label="Submenu action" className="product-input" value={child.action} disabled={!canManage} onChange={event => updateChild(index, childIndex, { action: event.target.value as WidgetMenuAction, value: "" })}>{actions.filter(action => action.value !== "SUBMENU").map(action => <option key={action.value} value={action.value}>{action.label}</option>)}</select>{needsValue(child.action) ? <input aria-label="Submenu destination" className="product-input" value={child.value || ""} disabled={!canManage} placeholder={placeholder(child.action)} onChange={event => updateChild(index, childIndex, { value: event.target.value })} /> : <span /> }<button type="button" className="text-sm text-red-700" disabled={!canManage} onClick={() => update(index, { children: item.children?.filter((_, i) => i !== childIndex) })}>Remove</button></div>)}<button type="button" className="text-sm font-semibold text-[var(--primary-strong)]" disabled={!canManage || (item.children?.length || 0) >= 8} onClick={() => update(index, { children: [...(item.children || []), fresh(true)] })}>+ Add submenu option</button></div> : null}
      </article>)}
      <button type="button" disabled={!canManage || menu.items.length >= 6} onClick={() => setMenu(current => ({ ...current, items: [...current.items, fresh()] }))} className="min-h-11 rounded-full border border-[var(--border)] px-5 text-sm font-semibold">+ Add menu option</button>
      <aside aria-label="Main menu preview" className="max-w-md rounded-[22px] bg-[#101112] p-4 text-white shadow-lg"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/45">Live preview</p><h3 className="mt-4 font-semibold">{menu.heading || "What would you like to explore?"}</h3><div className="mt-3 grid gap-2">{menu.items.length ? menu.items.map(item => <div key={item.id} className={`flex min-h-12 items-center justify-between rounded-xl border px-3 text-sm ${item.featured ? "border-[#e4ca8266] bg-[#373124]" : "border-white/15 bg-white/5"}`}><span>{item.label || "Untitled option"}</span><span aria-hidden="true">›</span></div>) : <p className="rounded-xl border border-dashed border-white/20 p-3 text-sm text-white/50">Add your first menu option.</p>}</div></aside>
    </div> : null}
    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[var(--text-muted)]">Maximum 6 main options and one submenu level. Chat always remains available.</p><button type="button" disabled={!canManage || !valid || saving} onClick={save} className="min-h-11 rounded-full bg-[#101010] px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save main menu"}</button></div>
    {notice ? <p role="status" className="mt-4 rounded-lg bg-[var(--info-soft)] px-4 py-3 text-sm text-[#385d8e]">{notice}</p> : null}
  </section>;
}
