import type { Lead } from "@/types";

const MAX_RESPONSE_SAMPLE_MINUTES = 24 * 60;

function formatResponseTime(minutes: number) {
  const roundedMinutes = Math.max(1, Math.round(minutes));
  if (roundedMinutes < 60) return `${roundedMinutes}m`;

  const hours = roundedMinutes / 60;
  return `${hours >= 10 ? Math.round(hours) : hours.toFixed(1)}h`;
}

export function isWhatsAppLead(lead: Lead) {
  return lead.source.toLowerCase().includes("whatsapp");
}

export function filterWhatsAppLeads(leads: Lead[]) {
  return leads.filter(isWhatsAppLead);
}

export function buildWhatsAppMetrics(leads: Lead[]) {
  let incoming = 0;
  let outgoing = 0;
  let delivered = 0;
  let read = 0;
  let failed = 0;
  let unanswered = 0;
  const responseSamples: number[] = [];

  for (const lead of leads) {
    const messages = [...lead.transcript].sort(
      (left, right) => new Date(left.sentAtIso).getTime() - new Date(right.sentAtIso).getTime()
    );
    let pendingInboundAt: number | null = null;

    for (const message of messages) {
      if (message.from === "guest") {
        incoming += 1;
        if (pendingInboundAt === null) {
          pendingInboundAt = new Date(message.sentAtIso).getTime();
        }
        continue;
      }

      outgoing += 1;
      const status = String(message.status || "").toLowerCase();
      if (status === "read") read += 1;
      if (status === "delivered") delivered += 1;
      if (status.startsWith("failed") || status === "error") failed += 1;

      if (pendingInboundAt !== null) {
        const responseAt = new Date(message.sentAtIso).getTime();
        const minutes = (responseAt - pendingInboundAt) / 60000;
        if (Number.isFinite(minutes) && minutes >= 0 && minutes <= MAX_RESPONSE_SAMPLE_MINUTES) {
          responseSamples.push(minutes);
        }
        pendingInboundAt = null;
      }
    }

    if (messages.at(-1)?.from === "guest") unanswered += 1;
  }

  const averageResponseMinutes = responseSamples.length
    ? responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length
    : 0;
  const deliveryBase = read + delivered + failed;

  return {
    contacts: leads.length,
    incoming,
    outgoing,
    unanswered,
    delivered,
    read,
    failed,
    averageResponseMinutes,
    averageResponseLabel: averageResponseMinutes > 0 ? formatResponseTime(averageResponseMinutes) : "—",
    deliveryRate: deliveryBase > 0 ? Math.round(((read + delivered) / deliveryBase) * 100) : 0,
    readRate: outgoing > 0 ? Math.round((read / outgoing) * 100) : 0
  };
}
