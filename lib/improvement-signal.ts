import { createHash } from "node:crypto";

export type ImprovementSignalType = "NEGATIVE_FEEDBACK" | "INCORRECT_FACT_FLAG" | "KNOWLEDGE_GAP";

export function normalizeImprovementSignal(input: { propertyId: string; type: ImprovementSignalType; text?: string | null }) {
  const normalizedText = (input.text || "").toLowerCase().replace(/https?:\/\/\S+/g, "[url]").replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[email]").replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]").replace(/[^a-z0-9\[\]\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
  const fingerprint = createHash("sha256").update(`${input.propertyId}\u0000${input.type}\u0000${normalizedText || "unspecified"}`).digest("hex").slice(0, 20);
  return { version: "1.0" as const, type: input.type, fingerprint, normalizedText };
}

export function encodeImprovementSignalReason(signal: ReturnType<typeof normalizeImprovementSignal>, originalReason?: string | null) {
  const reason = originalReason?.trim().slice(0, 900) || "No reason supplied.";
  return `[SIGNAL_V1:${signal.type}:${signal.fingerprint}]\n${reason}`;
}
