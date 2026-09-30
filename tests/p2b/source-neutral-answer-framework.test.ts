import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAnswerReleaseGate, fuseSourceEvidence, planPartialAnswer, rankDeliverableEvidence, type GovernedEvidenceUnit } from "../../lib/source-neutral-answer-framework";
import { normalizeEvidenceLocator } from "../../lib/repositories/source-neutral-evidence-repository";

const base = { organizationId:"o1",propertyId:"p1",releaseId:"r1",authorizationId:"a1",sourceVersionId:"v1",contentDigest:"a".repeat(64),authorityRank:1,observedAt:"2026-09-30T00:00:00.000Z",effectiveUntil:null };
const units:GovernedEvidenceUnit[]=[
  {...base,id:"web",sourceType:"WEBSITE",content:"Website fact",locator:{sourceType:"WEBSITE",url:"https://example.com",pageId:"p",chunkId:"c"}},
  {...base,id:"pdf",sourceType:"PDF",sourceVersionId:"v2",content:"PDF fact",authorityRank:2,locator:{sourceType:"PDF",fileId:"f",page:2,blockId:"b"}},
  {...base,id:"sheet",sourceType:"SPREADSHEET",sourceVersionId:"v3",content:"Sheet fact",authorityRank:3,locator:{sourceType:"SPREADSHEET",fileId:"s",sheet:"Rates",row:4,stableKey:"rate-1"}},
  {...base,id:"form",sourceType:"FORM",sourceVersionId:"v4",content:"Form fact",authorityRank:4,locator:{sourceType:"FORM",formId:"profile",field:"phone"}}
];

test("website PDF spreadsheet and form evidence fuse under one release contract",()=>{
  const fused=fuseSourceEvidence({organizationId:"o1",propertyId:"p1",releaseId:"r1",units,maximumUnits:10});
  assert.deepEqual(fused.map(unit=>unit.sourceType),["WEBSITE","PDF","SPREADSHEET","FORM"]);
  assert.throws(()=>fuseSourceEvidence({organizationId:"o1",propertyId:"p2",releaseId:"r1",units,maximumUnits:10}),/TENANT_MISMATCH/);
});

test("partial support answers verified parts instead of routing every gap",()=>{
  const result=planPartialAnswer([
    {part:{key:"services",question:"services",required:false},evidence:[units[0]]},
    {part:{key:"international",question:"outside India",required:false},evidence:[]}
  ]);
  assert.equal(result.disposition,"PARTIAL_ANSWER");
  assert.equal(result.handoverRecommended,false);
});

test("release gate requires 8 of 10 grounded correct, zero unsafe, and correct routing",()=>{
  const pass=evaluateAnswerReleaseGate([...Array(8)].map(()=>({correct:true,grounded:true,safe:true,routingCorrect:true})).concat([...Array(2)].map(()=>({correct:false,grounded:false,safe:true,routingCorrect:true}))));
  assert.equal(pass.passed,true);
  assert.equal(evaluateAnswerReleaseGate([...Array(7)].map(()=>({correct:true,grounded:true,safe:true,routingCorrect:true})).concat([...Array(3)].map(()=>({correct:false,grounded:false,safe:true,routingCorrect:true})))).passed,false);
  assert.equal(evaluateAnswerReleaseGate([...Array(9)].map(()=>({correct:true,grounded:true,safe:true,routingCorrect:true})).concat([{correct:false,grounded:false,safe:false,routingCorrect:true}])).passed,false);
});

test("deliverable ranking rejects unbound evidence and selects relevant sealed claims",()=>{
  const ranked=rankDeliverableEvidence({organizationId:"o1",propertyId:"p1",releaseId:"r1",question:"What hotel services are available?",candidates:[
    {unit:units[1],claimId:"claim-services",claimQuestion:"What services are available?",canonicalAnswer:"Hotel services are listed in the brochure."},
    {unit:units[2],claimId:"claim-rate",claimQuestion:"What is the room rate?",canonicalAnswer:"The approved rate is in the rate sheet."}
  ]});
  assert.equal(ranked[0].claimId,"claim-services");
  assert.throws(()=>rankDeliverableEvidence({organizationId:"o1",propertyId:"p1",releaseId:"r1",question:"services",candidates:[{unit:units[0],claimId:"",claimQuestion:"services",canonicalAnswer:"answer"}]}),/CLAIM_BINDING_INCOMPLETE/);
});

test("source adapters preserve stable website PDF spreadsheet and form locators",()=>{
  assert.equal(normalizeEvidenceLocator("WEBSITE",{url:"https://example.com",pageId:"p",chunkId:"c"},"x").sourceType,"WEBSITE");
  assert.deepEqual(normalizeEvidenceLocator("PDF",{fileId:"f",pageNumber:3,blockId:"b"},"x"),{sourceType:"PDF",fileId:"f",page:3,blockId:"b"});
  assert.deepEqual(normalizeEvidenceLocator("SPREADSHEET",{fileId:"s",sheetName:"Rates",rowNumber:4,rowKey:"R4"},"x"),{sourceType:"SPREADSHEET",fileId:"s",sheet:"Rates",row:4,stableKey:"R4"});
  assert.deepEqual(normalizeEvidenceLocator("FORM",{formId:"profile",field:"phone"},"x"),{sourceType:"FORM",formId:"profile",field:"phone"});
});
