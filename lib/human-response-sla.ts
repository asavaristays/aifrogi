import type { Lead } from "@/types";

export type HumanResponseState = "WAITING" | "REMINDER" | "OVERDUE";
export type HumanResponseItem = { leadId: string; name: string; channel: string; state: HumanResponseState; waitingMinutes: number; dueAt: string; fallbackEligible: boolean; latestMessage: string };

export function buildHumanResponseReport(input: { leads: Lead[]; slaMinutes?: number | null; reminderPercent?: number | null; fallbackEnabled?: boolean | null; now?: Date }) {
  const now = input.now || new Date();
  const slaMinutes = Math.min(1440, Math.max(5, Math.round(input.slaMinutes || 60)));
  const reminderPercent = Math.min(90, Math.max(10, Math.round(input.reminderPercent || 50)));
  const reminderMinutes = slaMinutes * reminderPercent / 100;
  const items: HumanResponseItem[] = [];
  for (const lead of input.leads) {
    const messages = [...lead.transcript].sort((left, right) => +new Date(left.sentAtIso) - +new Date(right.sentAtIso));
    const latest = messages.at(-1);
    if (!latest || latest.from !== "guest") continue;
    const occurredAt = new Date(latest.sentAtIso);
    const waitingMinutes = Math.max(0, Math.floor((now.getTime() - occurredAt.getTime()) / 60000));
    const state: HumanResponseState = waitingMinutes >= slaMinutes ? "OVERDUE" : waitingMinutes >= reminderMinutes ? "REMINDER" : "WAITING";
    items.push({ leadId: lead.id, name: lead.name, channel: lead.source, state, waitingMinutes, dueAt: new Date(occurredAt.getTime() + slaMinutes * 60000).toISOString(), fallbackEligible: state === "OVERDUE" && input.fallbackEnabled === true, latestMessage: latest.text.slice(0, 180) });
  }
  items.sort((left, right) => right.waitingMinutes - left.waitingMinutes);
  const overdue = items.filter((item) => item.state === "OVERDUE").length;
  const reminder = items.filter((item) => item.state === "REMINDER").length;
  return { slaMinutes, reminderPercent, waiting: items.length, reminder, overdue, fallbackEligible: items.filter((item) => item.fallbackEligible).length, oldestWaitingMinutes: items[0]?.waitingMinutes || 0, items };
}
