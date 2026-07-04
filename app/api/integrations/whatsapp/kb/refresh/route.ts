import { NextResponse } from "next/server";
import { getWebsiteKnowledgeBase } from "@/lib/services/website-knowledge-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export async function POST() {
  const workspace = await resolveClientWorkspaceAccess({ requireManage: true });
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  }

  const knowledgeBase = await getWebsiteKnowledgeBase(workspace.propertySlug, true);

  return NextResponse.json({
    ok: true,
    propertySlug: workspace.propertySlug,
    baseUrl: knowledgeBase.baseUrl,
    pages: knowledgeBase.pages.length,
    crawledAt: knowledgeBase.crawledAt,
    buckets: Array.from(new Set(knowledgeBase.pages.map((page) => page.bucket))).sort()
  });
}
