import { getDb } from "@/lib/db";

export async function recordUserSession(input: {
  sessionId: string;
  email: string;
  role: string;
  authSource: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const db = getDb();
  if (!db) return null;
  const membership = await db.organizationMember.findFirst({
    where: { email: input.email.toLowerCase(), status: "ACTIVE" },
    select: { organizationId: true }
  });
  return db.userSession.upsert({
    where: { sessionId: input.sessionId },
    update: { lastSeenAt: new Date(), expiresAt: input.expiresAt, revokedAt: null, revokedBy: null },
    create: {
      sessionId: input.sessionId,
      organizationId: membership?.organizationId || null,
      email: input.email.toLowerCase(),
      role: input.role,
      authSource: input.authSource,
      expiresAt: input.expiresAt,
      userAgent: input.userAgent?.slice(0, 300) || null,
      ipAddress: input.ipAddress?.slice(0, 100) || null
    }
  });
}

export async function isRegisteredSessionActive(sessionId: string) {
  const db = getDb();
  if (!db) return false;
  const session = await db.userSession.findUnique({ where: { sessionId }, select: { revokedAt: true, expiresAt: true } });
  return Boolean(session && !session.revokedAt && session.expiresAt > new Date());
}

export async function listUserSessions(email: string) {
  const db = getDb();
  if (!db) return [];
  return db.userSession.findMany({
    where: { email: email.toLowerCase(), expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { sessionId: true, authSource: true, userAgent: true, ipAddress: true, createdAt: true, lastSeenAt: true, expiresAt: true, revokedAt: true }
  });
}

export async function revokeUserSession(input: { sessionId: string; email: string; revokedBy: string }) {
  const db = getDb();
  if (!db) return null;
  return db.userSession.updateMany({
    where: { sessionId: input.sessionId, email: input.email.toLowerCase(), revokedAt: null },
    data: { revokedAt: new Date(), revokedBy: input.revokedBy }
  });
}
