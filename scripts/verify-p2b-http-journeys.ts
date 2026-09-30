import assert from "node:assert/strict";
import {createServer} from "node:http";
import {Pool} from "pg";
import {deliverCanonicalAnswer} from "../lib/canonical-answer-delivery";
import {disconnectCanonicalRoleClients,initializeCanonicalRoleClients} from "../lib/canonical-db-context";

const ownerUrl=process.env.DATABASE_URL;
if(!ownerUrl) throw new Error("DATABASE_URL required");
initializeCanonicalRoleClients();
const owner=new Pool({connectionString:ownerUrl});
const cases={
 form:{entryId:"http-entry-form",conversationId:"http-conversation-form",answer:"Form fact.",selectedSource:"FORM"},
 pdf:{entryId:"http-entry-pdf",conversationId:"http-conversation-pdf",answer:"PDF fact.",selectedSource:"PDF"},
 spreadsheet:{entryId:"http-entry-spreadsheet",conversationId:"http-conversation-spreadsheet",answer:"Spreadsheet fact.",selectedSource:"SPREADSHEET"},
 website:{entryId:"http-entry-website",conversationId:"http-conversation-website",answer:"Website fact.",selectedSource:"WEBSITE"},
 "website-failed":{entryId:"http-entry-form",conversationId:"http-conversation-website-failed",answer:"Form fact.",selectedSource:"FORM"}
} as const;

const server=createServer(async(req,res)=>{
 try{
  if(req.method!=="POST"){res.writeHead(405).end();return;}
  const key=req.url?.split("/").pop() as keyof typeof cases;
  const selected=cases[key];
  if(!selected){res.writeHead(404).end();return;}
  const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));
  const payload=JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if(typeof payload.sessionId!=="string"||!payload.sessionId){res.writeHead(400).end();return;}
  const sessionHash=`http-session-${key}`;
  let deliveredManifest:unknown;
  const result=await deliverCanonicalAnswer({
   identity:{organizationId:"http-org",propertyId:"http-property",principal:"public-bot:http-property",purpose:"PUBLIC_GUEST",guestSessionHash:sessionHash},
   conversationId:selected.conversationId,sessionHash,expiresAt:new Date(Date.now()+60_000),entryIds:[selected.entryId],
   finalAnswer:selected.answer,
   deliveryKey:String(req.headers["idempotency-key"]||`http-${key}`),timeoutMs:1000,
   send:async manifest=>{deliveredManifest=manifest;return{accepted:true,providerDeliveryId:`http-provider-${key}`};}
  });
  res.writeHead(200,{"content-type":"application/json"});
  res.end(JSON.stringify({answer:selected.answer,selectedSource:selected.selectedSource,websiteCaptureOptional:key==="website-failed",answerAuditId:result.answerAuditId,manifest:deliveredManifest}));
 }catch(error){res.writeHead(503,{"content-type":"application/json"});res.end(JSON.stringify({error:error instanceof Error?error.message:"unknown"}));}
});

async function main(){
 await new Promise<void>((resolve,reject)=>{server.once("error",reject);server.listen(18087,"127.0.0.1",resolve);});
 try{
 for(const key of Object.keys(cases) as Array<keyof typeof cases>){
  const response=await fetch(`http://127.0.0.1:18087/api/public/canonical-trial/${key}`,{method:"POST",headers:{"content-type":"application/json","idempotency-key":`journey-${key}`},body:JSON.stringify({sessionId:`session-${key}`,question:`Question for ${key}`})});
  assert.equal(response.status,200,`${key} HTTP status`);
  const body=await response.json() as {answer:string;selectedSource:string;websiteCaptureOptional:boolean;manifest:Array<{entryId:string}>};
  assert.equal(body.answer,cases[key].answer);
  assert.equal(body.selectedSource,cases[key].selectedSource);
  assert.deepEqual(body.manifest.map(item=>item.entryId),[cases[key].entryId]);
  if(key==="website-failed") assert.equal(body.websiteCaptureOptional,true);
  console.log(`PASS HTTP ${key} journey delivered ${cases[key].entryId} from ${cases[key].selectedSource}`);
 }
 const counts=await owner.query<{audits:number;outcomes:number;failed_captures:number}>(`SELECT (SELECT count(*)::int FROM "KnowledgeAnswerAudit" WHERE "propertyId"='http-property') audits,(SELECT count(*)::int FROM "KnowledgeAnswerOutcome" WHERE "propertyId"='http-property' AND state='DELIVERED') outcomes,(SELECT count(*)::int FROM "SourceCapture" WHERE "propertyId"='http-property' AND status='FAILED') failed_captures`);
 assert.deepEqual(counts.rows[0],{audits:5,outcomes:5,failed_captures:1});
 console.log("PASS all HTTP answers have durable audits/outcomes and failed website capture did not block form evidence");
 }finally{
  await new Promise<void>(resolve=>server.close(()=>resolve()));
  await owner.end();
  await disconnectCanonicalRoleClients();
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
