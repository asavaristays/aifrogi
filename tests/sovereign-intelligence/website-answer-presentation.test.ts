import assert from "node:assert/strict";
import test from "node:test";
import { safeAnswerUrl, websiteAnswerActions, websiteFailureMessage, websiteModelBudget, technicalAnswerFailure, websiteVerificationRetry, removeUnsupportedNumberDisclaimers } from "../../lib/website-answer-presentation";
import { validateGeneratedClaims, validateWebsiteMaterialClaimCoverage as validateMaterialClaimCoverage } from "../../lib/sovereign-intelligence/claim-validator";
import { resolveWebsiteBotQuestion, websiteActionBoundary } from "../../lib/website-bot-conversation";
import { prepareWebsiteAnswerContext } from "../../lib/website-answer-context";

test("actions select an authorised pricing source instead of an unrelated source", () => {
  const sources = [{title:"Home",url:"https://tenant.example/",authority:"APPROVED_FIRST_PARTY_WEBSITE"},{title:"Pricing plans",url:"https://tenant.example/pricing",authority:"APPROVED_FIRST_PARTY_WEBSITE"}];
  assert.deepEqual(websiteAnswerActions("Tell me about pricing", "ANSWER", sources),[{label:"View pricing",url:"https://tenant.example/pricing"}]);
  assert.deepEqual(websiteAnswerActions("pricing", "FALLBACK", sources),[]);
  assert.deepEqual(websiteAnswerActions("pricing", "ANSWER", [{title:"Model suggestion",url:"https://other.example/pricing"}]),[]);
});

test("buttons never accept executable, credentialed or invalid URLs", () => {
  for (const url of ["javascript:alert(1)","data:text/html,test","https://user:pass@example.com/","/relative","http://example.com/"]) assert.equal(safeAnswerUrl(url),null);
});

test("technical recovery explains availability without claiming missing knowledge or staff ownership", () => {
  assert.equal(technicalAnswerFailure("MODEL"),true);
  assert.equal(technicalAnswerFailure("KNOWLEDGE"),false);
  assert.doesNotMatch(websiteFailureMessage("MODEL"),/not enough|verified|sent|saved|callback|name|mobile/i);
  assert.match(websiteFailureMessage("KNOWLEDGE"),/couldn’t find/i);
});

test("website budget is bounded and respects explicit operator settings", () => {
  assert.deepEqual(websiteModelBudget({}),{attemptTimeoutMs:10000,totalBudgetMs:22000});
  assert.deepEqual(websiteModelBudget({OPENAI_ATTEMPT_TIMEOUT_MS:"4500",OPENAI_TOTAL_BUDGET_MS:"10500"}),{attemptTimeoutMs:4500,totalBudgetMs:10500});
  assert.deepEqual(websiteModelBudget({OPENAI_ATTEMPT_TIMEOUT_MS:"999999",OPENAI_TOTAL_BUDGET_MS:"bad"}),{attemptTimeoutMs:15000,totalBudgetMs:22000});
});

test("source-grounded descriptions and exact prices work across business types; invented prices fail", () => {
  const fixtures = [
    {source:"The studio provides commercial films and social media videos.",answer:"The studio provides commercial films and social media videos."},
    {source:"The clinic offers consultations Monday to Friday. The consultation fee is ₹800.",answer:"The clinic offers consultations Monday to Friday. The consultation fee is ₹800."},
    {source:"The academy provides photography training. The course costs ₹2000.",answer:"The academy provides photography training. The course costs ₹2000."}
  ];
  for(const fixture of fixtures){
    assert.equal(validateGeneratedClaims({answer:fixture.answer,approvedContext:fixture.source,connectorVerified:false}).valid,true);
    assert.equal(validateMaterialClaimCoverage({answer:fixture.answer,evidenceUnits:[fixture.source]}).valid,true);
    assert.equal(validateGeneratedClaims({answer:"The price is ₹99999.",approvedContext:fixture.source,connectorVerified:false}).valid,false);
  }
});

test("one thousand tenant fixtures keep different prices and action URLs separate", () => {
  for(let index=0;index<1000;index++){
    const source={title:"Pricing",url:`https://tenant-${index}.example/pricing`,authority:"APPROVED_FIRST_PARTY_WEBSITE"};
    assert.equal(websiteAnswerActions("pricing","ANSWER",[source])[0].url,source.url);
    const own=`The course price is ₹${10000+index}.`;
    const another=`The course price is ₹${20000+index}.`;
    assert.equal(validateGeneratedClaims({answer:another,approvedContext:own,connectorVerified:false}).valid,false);
  }
});

test("descriptions with develops or creates are verified without weakening support thresholds", () => {
  const source="The studio creates commercial films. The agency develops mobile applications.";
  assert.equal(validateMaterialClaimCoverage({answer:"The studio creates commercial films.",evidenceUnits:[source]}).valid,true);
  assert.equal(validateMaterialClaimCoverage({answer:"The agency develops mobile applications.",evidenceUnits:[source]}).valid,true);
  assert.equal(validateMaterialClaimCoverage({answer:"We export aerospace quantum navigation hardware.",evidenceUnits:[source]}).valid,false);
  assert.equal(validateMaterialClaimCoverage({answer:"The agency develops mobile applications for ₹99999.",evidenceUnits:[source]}).valid,false);
});

test("referential price questions retain the latest business topic without swallowing new subjects", () => {
  const result=resolveWebsiteBotQuestion("How much does it cost?",["What is the photography course?","hello"]);
  assert.equal(result.contextUsed,true);
  assert.match(result.resolvedQuestion,/photography course/);
  assert.match(result.resolvedQuestion,/How much does it cost/);
  assert.equal(resolveWebsiteBotQuestion("How much does it cost?").disposition,"CLARIFY");
  assert.equal(resolveWebsiteBotQuestion("How much does website development cost?",["What is the photography course?"]).contextUsed,false);
  assert.equal(resolveWebsiteBotQuestion("What is the previous guest’s phone number?",["What is the course?"]).intent,"SENSITIVE");
});

test("relevant passages cannot be evicted by long unrelated retrieved pages", () => {
  const chunks=Array.from({length:10},(_,i)=>({generation_id:"tenant-generation",page_id:`p${i}`,chunk_id:`c${i}`,url:`https://tenant.example/page-${i}`,title:i===9?"Commercial video production":"Software development",content:i===9?"The studio creates commercial videos for businesses using real footage.":"Business services and software development. ".repeat(200),rank:10-i}));
  const context=prepareWebsiteAnswerContext("Do you create commercial videos for businesses?",chunks,5000);
  assert.equal(context.rankedChunkIds[0],"c9");
  assert.match(context.context,/creates commercial videos/);
  assert.equal(context.sourceUrls[0],"https://tenant.example/page-9");
  assert.ok(context.context.length<=5000);
  assert.equal(context.trace.contextChars,context.context.length);
});


test("missing evidence is uncertainty, while supported business facts still require validation", () => {
  const evidence="The business develops custom software. The course price is ₹1650.";
  const answer="I cannot confirm a revenue guarantee from the available business information. The business develops custom software.";
  assert.equal(validateMaterialClaimCoverage({answer,evidenceUnits:[evidence]}).valid,true);
  assert.equal(validateGeneratedClaims({answer,approvedContext:evidence}).valid,true);
  assert.equal(validateGeneratedClaims({answer:"The course price is ₹99.",approvedContext:evidence}).valid,false);
  assert.match(websiteVerificationRetry(["UNSUPPORTED_NUMBER:₹99"]),/UNSUPPORTED_NUMBER/);
  assert.match(websiteVerificationRetry(["MATERIAL_CLAIM_NOT_COVERED"]),/negative policy/);
});

test("hotel reservation actions respect configured business category, not website product vocabulary", () => {
  for(const category of ["BUSINESS_AI","CLINIC","EDUCATION","CUSTOM"]){
    assert.match(websiteActionBoundary("Can you book me a deluxe hotel room tonight?",category)!,/can’t reserve/);
    assert.equal(websiteActionBoundary("Do you build hotel booking software?",category),null);
  }
  assert.equal(websiteActionBoundary("Can you book me a room?","STAY"),null);
  assert.equal(websiteActionBoundary("Can you book me a room?"),null);
});

test("unsupported number disclaimers cannot discard a supported answer or validate invented prices", () => {
 const context="The course price is ₹1650. Lunch is included.";
 assert.equal(removeUnsupportedNumberDisclaimers("The course price is ₹1650. I cannot confirm ₹99 as the price.",context),"The course price is ₹1650.");
 assert.equal(removeUnsupportedNumberDisclaimers("The course price is ₹1650. The price of ₹99 is not supported by the available information.",context),"The course price is ₹1650.");
 const invented=removeUnsupportedNumberDisclaimers("The course costs ₹99.",context);
 assert.equal(validateGeneratedClaims({answer:invented,approvedContext:context}).valid,false);
 assert.equal(removeUnsupportedNumberDisclaimers("The course price is ₹1650. Lunch is not included.",context),"The course price is ₹1650. Lunch is not included.");
 assert.equal(removeUnsupportedNumberDisclaimers("I cannot confirm ₹99 as the price.",context),"");
});
