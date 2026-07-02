import { NextResponse } from "next/server";
import { getWebsiteKnowledgeBase } from "@/lib/services/website-knowledge-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function POST() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const knowledgeBase = await getWebsiteKnowledgeBase(propertySlug, true);

  return NextResponse.json({
    ok: true,
    propertySlug,
    baseUrl: knowledgeBase.baseUrl,
    pages: knowledgeBase.pages.length,
    crawledAt: knowledgeBase.crawledAt,
    buckets: Array.from(new Set(knowledgeBase.pages.map((page) => page.bucket))).sort()
  });
}
