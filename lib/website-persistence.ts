import { getDb, withDatabaseTransaction } from "@/lib/db";

class RejectedPersistence extends Error {
  constructor(readonly response: Response) { super("Website persistence was not completed"); }
}

/** Commit the transcript, handover, evidence and session together, or none of them.
 * Call only after generation; nested database transactions are not supported here.
 */
export async function persistWebsiteTurn(work: () => Promise<Response>): Promise<Response> {
  const db = getDb();
  if (!db) return Response.json({ error: "Conversation storage unavailable." }, { status: 503 });
  try {
    return await db.$transaction(tx => withDatabaseTransaction(tx, async () => {
      const response = await work();
      if (!response.ok) throw new RejectedPersistence(response);
      return response;
    }), { timeout: 15000, maxWait: 3000 });
  } catch (error) {
    if (error instanceof RejectedPersistence) return error.response;
    return Response.json({ error: "Your message could not be saved. Please retry." }, { status: 503 });
  }
}
