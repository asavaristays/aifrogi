import assert from "node:assert/strict";
import { getWhatsAppBotConfigurationForProperty } from "@/lib/repositories/bot-configuration-repository";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";

async function main() {
  const configuration = await getWhatsAppBotConfigurationForProperty("webtechnosys");
  const contact = await buildWebsiteKnowledgeAnswer({ question: "Please share contact number", propertySlug: "webtechnosys", configuration });
  assert.match(contact?.answer || "", /\+91-7410582898/);
  assert.match(contact?.answer || "", /info@webtechnosys\.com/);
  const location = await buildWebsiteKnowledgeAnswer({ question: "Where are you based?", propertySlug: "webtechnosys", configuration });
  assert.match(location?.answer || "", /Morjim, Goa 403512/);
  const callback = await buildWebsiteKnowledgeAnswer({ question: "Please arrange a call tomorrow", propertySlug: "webtechnosys", configuration });
  assert.equal(callback?.decision.intent, "HUMAN_REQUEST");
  assert.match(callback?.answer || "", /preferred callback time/i);
  const date = await buildWebsiteKnowledgeAnswer({ question: "I want a specific date", propertySlug: "webtechnosys", configuration, priorQuestions: ["What upcoming AI training can I book?"] });
  assert.equal(date?.decision.contextUsed, true);
  assert.match(date?.answer || "", /training-booking/);
  console.log(JSON.stringify({ passed: 4, contactModel: contact?.model, locationModel: location?.model, callbackModel: callback?.model, dateModel: date?.model }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
