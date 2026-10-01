import { readFile, writeFile } from "node:fs/promises";
import { initializeCanonicalRoleClients, disconnectCanonicalRoleClients } from "../lib/canonical-db-context";
import { getBootstrapDb, withDatabaseIdentity } from "../lib/db";
import { buildWebsiteKnowledgeAnswer } from "../lib/services/website-knowledge-service";
import { evaluateVisitorAnswerQuality } from "../lib/sovereign-intelligence/answer-quality-gate";
import { websiteAnswerActions } from "../lib/website-answer-presentation";

type Case = {id:string;organizationId:string;slug:string;question:string;priorQuestions?:string[];lastAssistantAnswer?:string;expectedSourceUrl?:string;expectedDisposition?:string;requiredPhrases?:string[];forbiddenPhrases?:string[]};

async function main(){
  const file=process.argv[2]; if(!file)throw new Error("Usage: tsx scripts/benchmark-website-answers.ts fixtures.json [report.json]");
  const cases=JSON.parse(await readFile(file,"utf8")) as Case[];
  if(!Array.isArray(cases) || !cases.length || cases.length>1000)throw new Error("Supply 1–1000 source-backed cases.");
  initializeCanonicalRoleClients();const reports=[];
  try{
    for(const fixture of cases){
      if(!fixture.id || !fixture.organizationId || !fixture.slug || !fixture.question)throw new Error("Incomplete benchmark case.");
      const started=Date.now();
      const answer=await withDatabaseIdentity({organizationId:fixture.organizationId,platformAuthority:false,actor:`public-bot:${fixture.slug}`,systemPurpose:"PUBLIC_ANSWER"},()=>buildWebsiteKnowledgeAnswer({question:fixture.question,propertySlug:fixture.slug,priorQuestions:fixture.priorQuestions,lastAssistantAnswer:fixture.lastAssistantAnswer,evaluationMode:true}));
      const quality=answer ? evaluateVisitorAnswerQuality({question:fixture.question,answer:answer.answer,decision:answer.decision}) : null;
      const reasons:string[]=[];
      if(!answer)reasons.push("NO_ACTIVE_ANSWER");
      if(answer?.reliability.failureLayer!=="NONE")reasons.push(answer?.reliability.failureCode || "UNKNOWN_FAILURE");
      if(quality && !quality.passed)reasons.push(...quality.reasons);
      if(fixture.expectedSourceUrl && !answer?.sourceUrls.includes(fixture.expectedSourceUrl))reasons.push("EXPECTED_SOURCE_NOT_USED");
      if(fixture.expectedDisposition && fixture.expectedDisposition!==answer?.decision.disposition)reasons.push("UNEXPECTED_DISPOSITION");
      for(const phrase of fixture.requiredPhrases || [])if(!answer?.answer.toLowerCase().includes(phrase.toLowerCase()))reasons.push(`MISSING:${phrase}`);
      for(const phrase of fixture.forbiddenPhrases || [])if(answer?.answer.toLowerCase().includes(phrase.toLowerCase()))reasons.push(`FORBIDDEN:${phrase}`);
      const row={id:fixture.id,slug:fixture.slug,passed:reasons.length===0,reasons,elapsedMs:Date.now()-started,answer:answer?.answer,proposedAnswer:answer?.replayTrace?.proposedAnswer,disposition:answer?.decision.disposition,reliability:answer?.reliability,sourceUrls:answer?.sourceUrls,generation:answer?.crawlGenerationId,chunkIds:answer?.chunkIds,validatorViolations:answer?.replayTrace?.validatorViolations,actions:answer ? websiteAnswerActions(fixture.question,answer.decision.disposition,answer.sources) : []};
      reports.push(row);console.log(JSON.stringify(row));
    }
    const report={version:1,createdAt:new Date().toISOString(),total:reports.length,passed:reports.filter(r=>r.passed).length,cases:reports};
    if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify({summary:{total:report.total,passed:report.passed}}));
    if(report.passed!==report.total)process.exitCode=1;
  }finally{await disconnectCanonicalRoleClients();await getBootstrapDb()?.$disconnect();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
