import { NextResponse } from "next/server";
import { getWhatsAppBotConfigurationForProperty } from "@/lib/repositories/bot-configuration-repository";
import { buildWhatsAppAutoReply } from "@/lib/services/whatsapp-auto-reply";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const question = typeof payload?.question === "string" ? payload.question.trim() : "";
  const propertySlug = typeof payload?.propertySlug === "string" && payload.propertySlug.trim()
    ? payload.propertySlug.trim()
    : await getCurrentWorkspaceSlug();

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const configuration = await getWhatsAppBotConfigurationForProperty(propertySlug);
  const knowledgeAnswer = await buildWebsiteKnowledgeAnswer({ question, propertySlug, configuration });

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
