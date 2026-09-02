import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { extractKnowledgeDocument } from "../../lib/services/knowledge-document-service";

test("extracts readable text from a production-style PDF without loading package fixtures", async () => {
  const bytes = await readFile("public/downloads/AiFrogi-Client-Onboarding-Prerequisites.pdf");
  const file = new File([bytes], "AiFrogi-Client-Onboarding-Prerequisites.pdf", { type: "application/pdf" });
  const result = await extractKnowledgeDocument(file);

  assert.ok(result.extractedText.length > 100);
  assert.match(result.extractedText, /AiFrogi/i);
});
