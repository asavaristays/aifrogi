import test from "node:test";
import assert from "node:assert/strict";
import { assertCanonicalServingStartup, canonicalFactsRequired } from "../../lib/canonical-serving-gate";

const valid:NodeJS.ProcessEnv={...process.env,AIFROGI_CANONICAL_SERVING_REQUIRED:"1",AIFROGI_LEGACY_FACT_FALLBACK:"0",AIFROGI_REQUIRED_SERVING_CONTRACT:"1",AIFROGI_BUILD_ID:"release-a",AIFROGI_ADMITTED_RELEASE_ID:"release-a"};

test("canonical serving is optional only when deployment has not required it",()=>{
  assert.equal(canonicalFactsRequired({...process.env,AIFROGI_CANONICAL_SERVING_REQUIRED:"0"}),false);
});

test("required canonical serving accepts the exact admitted build",()=>{
  assert.equal(assertCanonicalServingStartup(valid).enabled,true);
});

test("required canonical serving rejects legacy fallback, old contracts and false admission",()=>{
  assert.throws(()=>assertCanonicalServingStartup({...valid,AIFROGI_LEGACY_FACT_FALLBACK:"1"}),/LEGACY_FACT_FALLBACK_FORBIDDEN/);
  assert.throws(()=>assertCanonicalServingStartup({...valid,AIFROGI_REQUIRED_SERVING_CONTRACT:"0"}),/CANONICAL_SERVING_BUILD_INCOMPATIBLE/);
  assert.throws(()=>assertCanonicalServingStartup({...valid,AIFROGI_ADMITTED_RELEASE_ID:"release-b"}),/CANONICAL_RELEASE_NOT_ADMITTED/);
});
