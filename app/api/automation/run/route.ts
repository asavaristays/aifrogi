import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDueAutomationJobs } from "@/lib/automation-engine";
import { processKnowledgeFlagSla } from "@/lib/repositories/knowledge-verification-repository";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.AUTOMATION_CRON_SECRET?.trim() || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [result, knowledgeFlagSla] = await Promise.all([
    runDueAutomationJobs({ workerId: `cron-${Date.now()}`, take: 25, dryRun: false }),
    processKnowledgeFlagSla()
  ]);
  return NextResponse.json({ status: "ok", result, knowledgeFlagSla });
}
