import { NextResponse } from "next/server";
import { getWhatsAppBotConfigurationForProperty } from "@/lib/repositories/bot-configuration-repository";
import { buildWhatsAppAutoReply } from "@/lib/services/whatsapp-auto-reply";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const question = typeof payload?.question === "string" ? payload.question.trim() : "";
  const workspace = await resolveClientWorkspaceAccess({
    propertySlug: typeof payload?.propertySlug === "string" ? payload.propertySlug : null
  });
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  }

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const configuration = await getWhatsAppBotConfigurationForProperty(workspace.propertySlug);
  const knowledgeAnswer = await buildWebsiteKnowledgeAnswer({ question, propertySlug: workspace.propertySlug, configuration });

  if (knowledgeAnswer) {
    return NextResponse.json({
      ok: true,
      mode: "openai_kb",
      answer: knowledgeAnswer.answer,
      sourceUrls: knowledgeAnswer.sourceUrls
    });
  }

  return NextResponse.json({
    ok: true,
    mode: "rule_fallback",
    answer: buildWhatsAppAutoReply(question),
    sourceUrls: []
  });
}
