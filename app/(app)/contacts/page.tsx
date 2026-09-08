import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { loadLeads } from "@/lib/services/lead-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const contacts = (await loadLeads(propertySlug)).filter((lead) => Boolean(lead.websiteSession) || /website|ai bot/i.test(lead.source));

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f1fbf5_0%,#ffffff_50%,#eef8f5_100%)]">
      <TopBar title="Contacts" subtitle="People who have interacted with your website AI Bot" />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border border-black/5 p-0 shadow-[0_20px_60px_rgba(15,61,53,0.08)]">
          <div className="flex flex-col gap-3 border-b border-black/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a6a16]">Website audience</p>
              <h2 className="mt-2 text-2xl font-black">{contacts.length} contacts</h2>
            </div>
            <Link href="/team-inbox" className="rounded-2xl bg-[#8a6a16] px-4 py-3 text-sm font-black text-white">
              Start conversation
            </Link>
          </div>

          {contacts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#f4faf7] text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Tags</th>
                    <th className="px-6 py-4">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="bg-white transition hover:bg-[#f8fcfa]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dcfce7] text-sm font-black text-[#8a6a16]">{contact.initials}</span>
                          <div>
                            <p className="text-sm font-black">{contact.name}</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">{contact.intent || "Website contact"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">{contact.phone}</td>
                      <td className="px-6 py-4"><Badge tone={contact.transcript.at(-1)?.from === "guest" ? "error" : "secondary"}>{contact.transcript.at(-1)?.from === "guest" ? "Awaiting reply" : "Answered"}</Badge></td>
                      <td className="px-6 py-4 text-xs text-[var(--text-muted)]">{contact.tags.length ? contact.tags.join(", ") : "—"}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)]">{contact.updatedAtLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-[var(--text-muted)]">
              No website contacts yet. Contacts are created automatically from AI Bot conversations.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
