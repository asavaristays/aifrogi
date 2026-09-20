import { getDb } from "@/lib/db";

export type TenantModelUsage = { inputTokens: number; outputTokens: number; model: string; attempts: number; latencyMs: number };

export function estimatedUsageCostPaisa(usage: TenantModelUsage, rates?: { inputPaisaPerMillion: number; outputPaisaPerMillion: number }) {
  const inputRate = Math.max(0, rates?.inputPaisaPerMillion ?? (Number(process.env.OPENAI_INPUT_COST_PAISE_PER_MILLION) || 0));
  const outputRate = Math.max(0, rates?.outputPaisaPerMillion ?? (Number(process.env.OPENAI_OUTPUT_COST_PAISE_PER_MILLION) || 0));
  return Math.round((usage.inputTokens * inputRate + usage.outputTokens * outputRate) / 1_000_000);
}

export async function recordTenantAnswerUsage(input: { organizationId: string; evidenceId: string; usage: TenantModelUsage; certification?: boolean }) {
  const db = getDb();
  if (!db) return null;
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const periodEnd = new Date(periodStart.getTime() + 86_400_000);
  const metrics = [
    ["AI_INPUT_TOKENS", input.usage.inputTokens, "TOKENS"], ["AI_OUTPUT_TOKENS", input.usage.outputTokens, "TOKENS"],
    ["AI_MODEL_ATTEMPTS", input.usage.attempts, "COUNT"], ["AI_LATENCY_MS", input.usage.latencyMs, "MILLISECONDS"]
  ] as const;
  // Use the transaction delegate so all writes share the configured RLS identity.
  await db.$transaction(async (transaction) => Promise.all(metrics.map(([metric, quantity, unit]) => transaction.usageRecord.upsert({
    where: { idempotencyKey: `${input.certification ? "cert" : "answer"}:${input.evidenceId}:${metric}` },
    update: {}, create: { organizationId: input.organizationId, metric, quantity: Math.max(0, Math.round(quantity)), unit, periodStart, periodEnd, sourceRef: `${input.usage.model}:${input.evidenceId}`, idempotencyKey: `${input.certification ? "cert" : "answer"}:${input.evidenceId}:${metric}` }
  }))));
  return { costPaisa: estimatedUsageCostPaisa(input.usage), metrics: metrics.length };
}

export async function getTenantUsageCostSummary(organizationId: string, from: Date, to: Date) {
  const db = getDb(); if (!db) return { inputTokens: 0, outputTokens: 0, attempts: 0, latencyMs: 0, estimatedCostPaisa: 0 };
  const rows = await db.usageRecord.groupBy({ by: ["metric"], where: { organizationId, recordedAt: { gte: from, lt: to }, metric: { in: ["AI_INPUT_TOKENS", "AI_OUTPUT_TOKENS", "AI_MODEL_ATTEMPTS", "AI_LATENCY_MS"] } }, _sum: { quantity: true } });
  const value = (metric: string) => rows.find((row) => row.metric === metric)?._sum.quantity || 0;
  const inputTokens = value("AI_INPUT_TOKENS"); const outputTokens = value("AI_OUTPUT_TOKENS");
  return { inputTokens, outputTokens, attempts: value("AI_MODEL_ATTEMPTS"), latencyMs: value("AI_LATENCY_MS"), estimatedCostPaisa: estimatedUsageCostPaisa({ inputTokens, outputTokens, model: "PERIOD_AGGREGATE", attempts: 0, latencyMs: 0 }) };
}
