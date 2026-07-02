"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";

type TeamMember = { id: string; email: string; name: string | null; role: string; status: string; invitedAt: string; joinedAt: string | null; lastLoginAt: string | null; invitationExpiresAt: string | null };

export function TeamAccessManager({ organizationName, currentEmail, initialMembers }: { organizationName: string; currentEmail: string; initialMembers: TeamMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("AGENT");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);

  async function invite(event: FormEvent) {
    event.preventDefault(); setSaving(true); setNotice(null); setInvitationUrl(null);
    try {
      const response = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, role }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not send invitation.");
      setMembers((current) => [payload.member, ...current.filter((member) => member.id !== payload.member.id)]);
      setInvitationUrl(payload.invitationUrl);
      setNotice(payload.emailSent ? `Invitation emailed to ${payload.member.email}.` : "Invitation created. Email delivery is unavailable, so share the secure link below.");
      setName(""); setEmail(""); setRole("AGENT");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not send invitation."); }
    finally { setSaving(false); }
  }

  async function update(memberId: string, input: { role?: string; status?: string }) {
    setNotice(null);
    const response = await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, ...input }) });
    const payload = await response.json();
    if (!response.ok) { setNotice(payload.error || "Could not update this team member."); return; }
    setMembers((current) => current.map((member) => member.id === memberId ? { ...member, ...payload.member } : member));
    setNotice("Team access updated.");
  }

  async function copyInvitation() {
    if (!invitationUrl) return;
    await navigator.clipboard.writeText(invitationUrl);
    setNotice("Secure invitation link copied.");
  }

  return <div className="product-surface min-h-screen"><header className="border-b border-[var(--border)] bg-white px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-col gap-3 pl-12 lg:pl-0 sm:flex-row sm:items-end sm:justify-between"><div><p className="product-eyebrow">Client administration</p><h1 className="mt-1 text-2xl font-semibold">Team access</h1><p className="mt-1 text-sm text-[var(--text-muted)]">Invite people to {organizationName}, assign least-privilege roles, and suspend access immediately.</p></div><span className="status-pill status-info">{members.filter((member) => member.status === "ACTIVE").length} active</span></div></header>
    <main className="mx-auto grid max-w-[1500px] items-start gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[390px_minmax(0,1fr)]">
      <section className="soft-card rounded-lg p-5 xl:sticky xl:top-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary-strong)]"><Icon name="link" /></span><div><h2 className="text-lg font-semibold">Invite team member</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Each person receives a private 72-hour activation link and creates their own password.</p></div></div><form onSubmit={invite} className="mt-5 space-y-4"><label className="block"><span className="field-label">Name</span><input className="product-input mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Team member name" /></label><label className="block"><span className="field-label">Work email</span><input className="product-input mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required /></label><label className="block"><span className="field-label">Access role</span><select className="product-input mt-2" value={role} onChange={(event) => setRole(event.target.value)}><option value="AGENT">Agent - conversations and contacts</option><option value="VIEWER">Viewer - read-only operations</option><option value="ADMIN">Admin - manage workspace</option><option value="OWNER">Owner - full client control</option></select></label><button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--primary-strong)] text-sm font-semibold text-white disabled:opacity-55">{saving ? "Creating invitation..." : "Send invitation"}</button></form>{notice ? <p className="mt-4 rounded-md bg-[var(--info-soft)] px-3 py-2.5 text-xs leading-5 text-[#385d8e]">{notice}</p> : null}{invitationUrl ? <div className="mt-3 rounded-md border border-[var(--border)] p-3"><p className="truncate text-[11px] text-[var(--text-muted)]">{invitationUrl}</p><button type="button" onClick={copyInvitation} className="mt-2 text-xs font-semibold text-[var(--primary-strong)]">Copy secure link</button></div> : null}</section>

      <section className="soft-card overflow-hidden rounded-lg"><div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><p className="product-eyebrow">People and permissions</p><h2 className="mt-1 text-lg font-semibold">Workspace team</h2></div><span className="text-xs text-[var(--text-muted)]">{members.length} member{members.length === 1 ? "" : "s"}</span></div><div className="divide-y divide-[var(--border)]">{members.map((member) => <MemberRow key={member.id} member={member} isCurrent={member.email.toLowerCase() === currentEmail.toLowerCase()} onUpdate={update} />)}</div></section>
    </main></div>;
}

function MemberRow({ member, isCurrent, onUpdate }: { member: TeamMember; isCurrent: boolean; onUpdate: (id: string, input: { role?: string; status?: string }) => Promise<void> }) {
  const active = member.status === "ACTIVE";
  return <article className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_150px_120px] lg:items-center"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--secondary-soft)] text-sm font-semibold text-[var(--secondary)]">{(member.name || member.email).split(/[ @]/).filter(Boolean).slice(0,2).map((part) => part[0]?.toUpperCase()).join("")}</span><span className="min-w-0"><span className="flex items-center gap-2"><strong className="truncate text-sm">{member.name || "Invited member"}</strong>{isCurrent ? <small className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] text-[var(--primary-strong)]">You</small> : null}</span><span className="block truncate text-xs text-[var(--text-muted)]">{member.email}</span><small className="mt-1 block text-[10px] text-[var(--text-muted)]">{active ? member.lastLoginAt ? `Last active ${formatDate(member.lastLoginAt)}` : "Account active" : member.status === "INVITED" ? `Invited ${formatDate(member.invitedAt)}` : "Access suspended"}</small></span></div><select aria-label={`Role for ${member.email}`} className="product-input min-h-9 py-1.5 text-xs" value={member.role} onChange={(event) => onUpdate(member.id, { role: event.target.value })} disabled={isCurrent && member.role === "OWNER"}><option value="OWNER">Owner</option><option value="ADMIN">Admin</option><option value="AGENT">Agent</option><option value="VIEWER">Viewer</option></select><button type="button" onClick={() => onUpdate(member.id, { status: active ? "SUSPENDED" : "ACTIVE" })} disabled={isCurrent} className={`min-h-9 rounded-md border px-3 text-xs font-semibold disabled:opacity-40 ${active ? "border-[#f0c8c5] text-[var(--error)]" : "border-[#cce7dc] text-[var(--success)]"}`}>{active ? "Suspend" : member.status === "INVITED" ? "Invited" : "Restore"}</button></article>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }

