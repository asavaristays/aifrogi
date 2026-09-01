export const SUPPORT_STATUSES = ["OPEN", "ACKNOWLEDGED", "INVESTIGATING", "WAITING_FOR_CLIENT", "RESOLVED", "CLOSED"] as const;

export function supportSlaHours(priority: string) {
  if (priority === "URGENT") return { acknowledge: 1, resolve: 8 };
  if (priority === "HIGH") return { acknowledge: 4, resolve: 24 };
  if (priority === "LOW") return { acknowledge: 24, resolve: 120 };
  return { acknowledge: 8, resolve: 72 };
}

export function supportSlaState(input: { priority: string; status: string; createdAt: Date; updatedAt: Date }, now = new Date()) {
  const hours = supportSlaHours(input.priority);
  const acknowledgeDueAt = new Date(input.createdAt.getTime() + hours.acknowledge * 3_600_000);
  const resolveDueAt = new Date(input.createdAt.getTime() + hours.resolve * 3_600_000);
  const acknowledged = !["OPEN"].includes(input.status);
  const resolved = ["RESOLVED", "CLOSED"].includes(input.status);
  return { acknowledgeDueAt, resolveDueAt, acknowledgmentOverdue: !acknowledged && acknowledgeDueAt < now, resolutionOverdue: !resolved && resolveDueAt < now };
}

export function containsUnsafeSupportSecret(value: string) {
  return /(password\s*[:=]|otp\s*[:=]|api[_ -]?key\s*[:=]|secret\s*[:=]|bearer\s+[a-z0-9._-]{12,}|\b(?:\d[ -]*?){13,19}\b)/i.test(value);
}

export function structuredResolution(input: { cause: string; action: string; verification: string; prevention: string }) {
  return `CAUSE\n${input.cause.trim()}\n\nACTION TAKEN\n${input.action.trim()}\n\nVERIFICATION EVIDENCE\n${input.verification.trim()}\n\nPREVENTION\n${input.prevention.trim()}`;
}
