import { getDb } from "@/lib/db";

/** Cross-process exclusion shared by visitor turns and operator transitions. */
export async function withWebsiteTurnLock(key: string, work: () => Promise<Response>) {
  const db = getDb();
  if (!db) return Response.json({ error: "Conversation is temporarily unavailable." }, { status: 503 });
  return db.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${key}, 0)) AS acquired`;
    if (!rows[0]?.acquired) return Response.json({ error: "A conversation update is in progress. Please retry shortly." }, { status: 409 });
    return work();
  }, { timeout: 30000, maxWait: 3000 });
}
