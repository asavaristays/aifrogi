import os from "node:os";
import { statfsSync } from "node:fs";
import { getDb } from "@/lib/db";

export const CAPACITY_TARGET = { bots: 100, dailyReplies: 10_000 } as const;
export type CapacityTone = "GREEN" | "AMBER" | "RED" | "UNKNOWN";

export type CapacitySignals = {
  botPercent: number; replyPercent: number; memoryPercent: number | null; diskPercent: number | null;
  p95LatencyMs: number | null; errorPercent: number | null; queueDepth: number; oldestJobMinutes: number | null;
};

const percent = (value: number, total: number) => total > 0 ? Math.round(value / total * 1000) / 10 : 0;
const gigabytes = (bytes: number) => Math.round(bytes / 1024 / 1024 / 1024 * 10) / 10;

export function evaluateCapacity(signals: CapacitySignals) {
  const red = signals.botPercent >= 100 || signals.replyPercent >= 100 || (signals.memoryPercent ?? 0) >= 90 || (signals.diskPercent ?? 0) >= 90 || (signals.errorPercent ?? 0) >= 5 || (signals.oldestJobMinutes ?? 0) >= 30;
  const amber = signals.botPercent >= 80 || signals.replyPercent >= 80 || (signals.memoryPercent ?? 0) >= 75 || (signals.diskPercent ?? 0) >= 75 || (signals.errorPercent ?? 0) >= 2 || signals.p95LatencyMs !== null && signals.p95LatencyMs >= 8_000 || signals.queueDepth >= 50 || (signals.oldestJobMinutes ?? 0) >= 10;
  const tone: CapacityTone = red ? "RED" : amber ? "AMBER" : "GREEN";
  const actions: string[] = [];
  if (signals.botPercent >= 80 || signals.replyPercent >= 80) actions.push("Prepare the next traffic tier and repeat the staged load test before onboarding beyond the target.");
  if ((signals.memoryPercent ?? 0) >= 75) actions.push("Increase RAM only after checking process and database memory growth; target at least 16 GB if sustained.");
  if ((signals.diskPercent ?? 0) >= 75) actions.push("Prune expired builds and backups first; add storage only when retained business data drives growth.");
  if (signals.p95LatencyMs !== null && signals.p95LatencyMs >= 8_000) actions.push("Trace model and database latency before buying CPU; provider latency is not fixed by a VPS upgrade.");
  if (signals.queueDepth >= 50 || (signals.oldestJobMinutes ?? 0) >= 10) actions.push("Separate and scale the background worker before enlarging the full application server.");
  if ((signals.errorPercent ?? 0) >= 2) actions.push("Resolve the dominant error class before adding capacity.");
  if (!actions.length) actions.push("Current target has headroom. Continue monitoring; no resource purchase is recommended now.");
  return { tone, actions };
}

function hostSnapshot() {
  try {
    const totalMemory = os.totalmem(), freeMemory = os.freemem(), disk = statfsSync(process.cwd());
    const diskTotal = Number(disk.blocks) * Number(disk.bsize), diskFree = Number(disk.bavail) * Number(disk.bsize);
    return {
      cpuCores: os.cpus().length,
      load1m: Math.round(os.loadavg()[0] * 100) / 100,
      memoryPercent: percent(totalMemory - freeMemory, totalMemory),
      diskPercent: percent(diskTotal - diskFree, diskTotal),
      diskTotalGb: gigabytes(diskTotal),
      diskUsedGb: gigabytes(diskTotal - diskFree),
      diskFreeGb: gigabytes(diskFree)
    };
  } catch { return { cpuCores: null, load1m: null, memoryPercent: null, diskPercent: null, diskTotalGb: null, diskUsedGb: null, diskFreeGb: null }; }
}

export async function getCapacitySnapshot() {
  const db = getDb(), now = new Date(), startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000), fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000);
  const host = hostSnapshot();
  if (!db) return { measuredAt: now, target: CAPACITY_TARGET, configuredBots: 0, liveBots: 0, repliesToday: 0, replies7d: 0, projectedDailyReplies: 0, peakRepliesPerMinute: 0, activeConversations5m: 0, p95LatencyMs: null, errorPercent: null, queueDepth: 0, oldestJobMinutes: null, host, advisor: { tone: "UNKNOWN" as CapacityTone, actions: ["Database metrics are unavailable; investigate monitoring before changing resources."] } };
  const [configuredBots, liveBots, repliesToday, replies7d, activeConversations5m, evidence, queueDepth, oldestJob, peakRows] = await Promise.all([
    db.botProfile.count(), db.botProfile.count({ where: { status: "LIVE" } }),
    db.sovereignAnswerEvidence.count({ where: { createdAt: { gte: startToday } } }), db.sovereignAnswerEvidence.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.websiteVisitorSession.count({ where: { status: { not: "CLOSED" }, updatedAt: { gte: fiveMinutesAgo } } }),
    db.sovereignAnswerEvidence.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { latencyMs: true, failureLayer: true } }),
    db.automationJob.count({ where: { status: { in: ["QUEUED", "RETRY", "RUNNING"] } } }),
    db.automationJob.findFirst({ where: { status: { in: ["QUEUED", "RETRY"] } }, orderBy: { nextRunAt: "asc" }, select: { nextRunAt: true } }),
    db.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "SovereignAnswerEvidence" WHERE "createdAt" >= ${sevenDaysAgo} GROUP BY date_trunc('minute', "createdAt") ORDER BY count DESC LIMIT 1`
  ]);
  const latencies = evidence.map(item => item.latencyMs).sort((a,b) => a-b), failed = evidence.filter(item => item.failureLayer !== "NONE").length;
  const p95LatencyMs = latencies.length ? latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * .95) - 1)] : null;
  const errorPercent = evidence.length ? percent(failed, evidence.length) : null;
  const projectedDailyReplies = Math.round(replies7d / 7);
  const oldestJobMinutes = oldestJob ? Math.max(0, Math.round((now.getTime() - oldestJob.nextRunAt.getTime()) / 60_000)) : null;
  const signals: CapacitySignals = { botPercent: percent(configuredBots, CAPACITY_TARGET.bots), replyPercent: percent(Math.max(repliesToday, projectedDailyReplies), CAPACITY_TARGET.dailyReplies), memoryPercent: host.memoryPercent, diskPercent: host.diskPercent, p95LatencyMs, errorPercent, queueDepth, oldestJobMinutes };
  return { measuredAt: now, target: CAPACITY_TARGET, configuredBots, liveBots, repliesToday, replies7d, projectedDailyReplies, peakRepliesPerMinute: Number(peakRows[0]?.count ?? 0), activeConversations5m, p95LatencyMs, errorPercent, queueDepth, oldestJobMinutes, host, advisor: evaluateCapacity(signals) };
}
