import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertCanonicalFactualEnvelope } from "../../lib/canonical-channel-boundary";

const env={NODE_ENV:"test",AIFROGI_CANONICAL_SERVING_REQUIRED:"1",AIFROGI_LEGACY_FACT_FALLBACK:"0",AIFROGI_REQUIRED_SERVING_CONTRACT:"1",AIFROGI_BUILD_ID:"build",AIFROGI_ADMITTED_RELEASE_ID:"build"} as NodeJS.ProcessEnv;

test("canonical website factual answers require one unambiguous evidence envelope",()=>{
  const decision={claim:"The company provides automation services.",supported:true,matchedTerms:["company","provides","automation","services"],missingNumbers:[]};
  assert.equal(assertCanonicalFactualEnvelope({channel:"WEBSITE",factual:true,answer:decision.claim,crawlGenerationId:"g1",chunkIds:["c1"],materialClaimDecisions:[decision]},env).evidenceKind,"ACTIVE_CRAWL");
  assert.throws(()=>assertCanonicalFactualEnvelope({channel:"WEBSITE",factual:true,answer:"Invented answer"},env),/EVIDENCE_AMBIGUOUS/);
  assert.throws(()=>assertCanonicalFactualEnvelope({channel:"WEBSITE",factual:true,answer:decision.claim,claimIds:["e1"],crawlGenerationId:"g1",chunkIds:["c1"],materialClaimDecisions:[decision]},env),/EVIDENCE_AMBIGUOUS/);
  assert.throws(()=>assertCanonicalFactualEnvelope({channel:"API",factual:true,answer:decision.claim,crawlGenerationId:"g1",chunkIds:["c1"],materialClaimDecisions:[{...decision,supported:false}]},env),/CLAIM_COVERAGE_INVALID/);
});

test("website uses the shared boundary before canonical delivery",async()=>{
  const website=await readFile(new URL("../../app/api/public/website-bot/[slug]/route.ts",import.meta.url),"utf8");
  assert.match(website,/assertCanonicalFactualEnvelope\(\{channel:"WEBSITE"/);
});
