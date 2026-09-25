export function inStayTicketReference(leadId: string) {
  const suffix = leadId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase().padStart(8, "0");
  return `STAY-${suffix}`;
}

export function inStayTicketAcknowledgement(leadId: string) {
  return `Your request has been recorded. Ticket no. ${inStayTicketReference(leadId)}. The front desk will reply here.`;
}

export const IN_STAY_FRONT_DESK_COPY = [
  "The front desk has received your message and is reviewing it.",
  "Please share any additional details that will help the front desk assist you.",
  "The front desk is checking this and will update you here.",
  "We are sorry for the delay. The front desk is still reviewing your request.",
  "If this is an emergency, please call the front desk immediately."
] as const;
