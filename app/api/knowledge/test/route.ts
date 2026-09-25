import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess, withClientDatabaseContext } from "@/lib/client-access";
import { getDb } from "@/lib/db";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const question = typeof payload?.question === "string" ? payload.question.trim().slice(0, 1200) : "";
  const workspace = await resolveClientWorkspaceAccess({
    propertySlug: typeof payload?.propertySlug === "string" ? payload.propertySlug : null
  });
  if (!workspace.ok) return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  if (question.length < 2) return NextResponse.json({ error: "Question is required." }, { status: 400 });

  const access = {
    user: workspace.user,
    organization: workspace.organization,
    role: workspace.role,
    department: workspace.department,
    membership: workspace.organization.members.find((member) => member.email.toLowerCase() === workspace.user.username.toLowerCase())
  };
  const result = await withClientDatabaseContext(access, "knowledge-test-answer", () =>
    buildWebsiteKnowledgeAnswer({ question, propertySlug: workspace.propertySlug })
  ).catch(() => null);
  const answer = result?.answer || "I do not have enough approved business information to answer that confidently. Add or approve the answer in Intelligence, then test again.";
  await withClientDatabaseContext(access, "knowledge-test-api", async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable.");
    await db.onboardingActivity.create({ data: {
        organizationId: workspace.organization.id,
        actorEmail: workspace.user.username,
        action: "WEBSITE_BOT_TEST_COMPLETED",
        detail: `Authenticated website-bot test completed for ${workspace.propertySlug}`
      }
    });
  });

  return NextResponse.json({
    ok: true,
    mode: result ? "approved_knowledge" : "safe_fallback",
    answer,
    sourceUrls: result?.sourceUrls || [],
    setupComplete: true
  });
}
