import assert from "node:assert/strict";
import {Pool} from "pg";
import {initializeCanonicalRoleClients} from "../lib/canonical-db-context";
import {CanonicalDeliveryUncertainError,deliverCanonicalAnswer} from "../lib/canonical-answer-delivery";

async function main(){
 const databaseUrl=process.env.DATABASE_URL!;
 const roleUrl=process.env.AIFROGI_WEB_DATABASE_URL!;
 const publicUrl=process.env.AIFROGI_PUBLIC_DATABASE_URL!;
 const workerUrl=process.env.AIFROGI_WORKER_DATABASE_URL!;
 const publisherUrl=process.env.AIFROGI_PUBLISHER_DATABASE_URL!;
 if(!databaseUrl||!roleUrl||!publicUrl||!workerUrl||!publisherUrl) throw new Error("DATABASE_URL and all four AIFROGI role database URLs are required");
 initializeCanonicalRoleClients({
  ...process.env,
  AIFROGI_WEB_DATABASE_URL:roleUrl,
  AIFROGI_PUBLIC_DATABASE_URL:publicUrl,
  AIFROGI_WORKER_DATABASE_URL:workerUrl,
  AIFROGI_PUBLISHER_DATABASE_URL:publisherUrl
 });
 const owner=new Pool({connectionString:databaseUrl});
 const identity={organizationId:"delivery-org",propertyId:"delivery-property",principal:"public-bot:delivery-property",purpose:"PUBLIC_GUEST",guestSessionHash:"delivery-session"};
 const base={identity,conversationId:"delivery-conversation",sessionHash:"delivery-session",expiresAt:new Date(Date.now()+3_600_000),entryIds:["delivery-entry"],finalAnswer:"Check-in is at 2 PM.",timeoutMs:25};

 async function outcome(auditId:string,key:string){
  const result=await owner.query('SELECT state,detail FROM "KnowledgeAnswerOutcome" WHERE "answerAuditId"=$1 AND "deliveryKey"=$2',[auditId,key]);
  return result.rows;
 }

let alteredProviderCalled=false;
let alteredAudit="";
try {
  await deliverCanonicalAnswer({...base,finalAnswer:"Check-in is at 9 PM.",deliveryKey:"altered-answer",send:async()=>{alteredProviderCalled=true;return {accepted:true};}});
  assert.fail("altered answer unexpectedly delivered");
} catch(error) {
  if (!(error instanceof CanonicalDeliveryUncertainError)) console.error("Unexpected altered-answer error",error);
  assert.ok(error instanceof CanonicalDeliveryUncertainError);
  alteredAudit=error.answerAuditId;
}
assert.equal(alteredProviderCalled,false);
assert.equal((await outcome(alteredAudit,"altered-answer"))[0].state,"FAILED");
console.log("PASS altered answer is rejected before provider I/O and records a durable FAILED outcome");

let timeoutAudit="";
try {
  await deliverCanonicalAnswer({...base,deliveryKey:"timeout-key",send:async(_manifest,signal)=>new Promise((_resolve,reject)=>signal.addEventListener("abort",()=>reject(new Error("ABORTED")),{once:true}))});
  assert.fail("timeout unexpectedly succeeded");
} catch(error) {
  if(!(error instanceof CanonicalDeliveryUncertainError)) console.error("Unexpected timeout-path error",error);
  assert.ok(error instanceof CanonicalDeliveryUncertainError);
  timeoutAudit=error.answerAuditId;
}
assert.equal((await owner.query('SELECT count(*)::int n FROM "KnowledgeAnswerAudit" WHERE id=$1',[timeoutAudit])).rows[0].n,1);
const timeoutOutcome=await outcome(timeoutAudit,"timeout-key");
assert.equal(timeoutOutcome.length,1);
assert.equal(timeoutOutcome[0].state,"FAILED");
assert.equal(timeoutOutcome[0].detail.deliveryUncertain,true);
console.log("PASS provider timeout keeps pending audit and durable uncertain FAILED outcome");

let commitAudit="";
try {
  await deliverCanonicalAnswer({...base,deliveryKey:"commit-key",send:async()=>({accepted:true,providerDeliveryId:"force-commit-failure"})});
  assert.fail("forced commit failure unexpectedly succeeded");
} catch(error) {
  assert.ok(error instanceof CanonicalDeliveryUncertainError);
  commitAudit=error.answerAuditId;
}
const commitOutcome=await outcome(commitAudit,"commit-key");
assert.equal(commitOutcome.length,1);
assert.equal(commitOutcome[0].state,"FAILED");
assert.equal(commitOutcome[0].detail.providerAccepted,true);
console.log("PASS provider acceptance plus commit failure records durable uncertain FAILED outcome");

const clientPool=new Pool({connectionString:roleUrl});
const client=await clientPool.connect();
await client.query("BEGIN");
await client.query("SELECT set_config('app.organization_id',$1,true)",[identity.organizationId]);
await client.query("SELECT set_config('app.property_id',$1,true)",[identity.propertyId]);
await client.query("SELECT set_config('app.security_actor',$1,true)",[identity.principal]);
await client.query("SELECT set_config('app.system_purpose',$1,true)",[identity.purpose]);
await client.query("SELECT set_config('app.guest_session_hash',$1,true)",[identity.guestSessionHash]);
const forgedAudit=(await client.query<{id:string}>("SELECT aifrogi_security.record_answer_pending($1,$2,$3,$4::text[]) id",[identity.propertyId,base.conversationId,base.sessionHash,base.entryIds])).rows[0].id;
await client.query("SAVEPOINT forged_binding");
await assert.rejects(client.query("SELECT aifrogi_security.record_answer_outcome($1,$2,$3,'DELIVERED',$4::jsonb)",[identity.propertyId,forgedAudit,"forged-binding",JSON.stringify({answerBinding:{answerText:"Check-in is at 9 PM.",answerSha256:"0".repeat(64),manifestEntryIds:base.entryIds}})]),/DELIVERED_ANSWER_NOT_BOUND_TO_MANIFEST/);
await client.query("ROLLBACK TO SAVEPOINT forged_binding");
console.log("PASS database independently rejects a forged delivered-answer binding");
await client.query("SELECT aifrogi_security.record_answer_outcome($1,$2,$3,'FAILED',$4::jsonb)",[identity.propertyId,timeoutAudit,"duplicate-key",JSON.stringify({attempt:1})]);
await client.query("SELECT aifrogi_security.record_answer_outcome($1,$2,$3,'FAILED',$4::jsonb)",[identity.propertyId,timeoutAudit,"duplicate-key",JSON.stringify({attempt:2})]);
await client.query("COMMIT");
 assert.equal((await outcome(timeoutAudit,"duplicate-key")).length,1);
 console.log("PASS duplicate delivery key is idempotent and produces one immutable outcome");

 await owner.query(`INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose) VALUES ('delivery-race-publisher','delivery-property','publisher:delivery-race','aifrogi_publisher','KNOWLEDGE_REVOKE')`);
 const publisher=new Pool({connectionString:publisherUrl});
 let providerStarted=()=>{};
 const started=new Promise<void>(resolve=>{providerStarted=resolve;});
 const racingDelivery=deliverCanonicalAnswer({...base,deliveryKey:"revocation-race",timeoutMs:1000,send:async()=>{providerStarted();await new Promise(resolve=>setTimeout(resolve,250));return {accepted:true,providerDeliveryId:"race-delivered"};}});
 await started;
 const revokeStarted=Date.now();
 const revoking=(async()=>{const c=await publisher.connect();try{await c.query("BEGIN");await c.query("SELECT set_config('app.organization_id','delivery-org',true),set_config('app.property_id','delivery-property',true),set_config('app.security_actor','publisher:delivery-race',true),set_config('app.system_purpose','KNOWLEDGE_REVOKE',true)");await c.query("SELECT aifrogi_security.revoke_source('delivery-property','delivery-source','publisher:delivery-race','delivery race','delivery-race-revoke')");await c.query("COMMIT");}catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}})();
 const delivered=await racingDelivery;
 await revoking;
 assert.equal(delivered.accepted,true);
 assert.ok(Date.now()-revokeStarted>=150);
 assert.equal((await outcome(delivered.answerAuditId,"revocation-race"))[0].state,"DELIVERED");
 console.log("PASS revocation serializes behind in-flight delivery; the answer is delivered before revocation commits");

 const auditsBeforeRevokedRetry=(await owner.query<{n:number}>(`SELECT count(*)::int n FROM "KnowledgeAnswerAudit" WHERE "propertyId"='delivery-property'`)).rows[0].n;
 let revokedProviderCalled=false;
 await assert.rejects(
  deliverCanonicalAnswer({...base,conversationId:"delivery-conversation",deliveryKey:"revocation-wins",send:async()=>{revokedProviderCalled=true;return {accepted:true,providerDeliveryId:"must-not-send"};}}),
  /ANSWER_SELECTION_NOT_EXACTLY_ELIGIBLE/
 );
 assert.equal(revokedProviderCalled,false);
 const auditsAfterRevokedRetry=(await owner.query<{n:number}>(`SELECT count(*)::int n FROM "KnowledgeAnswerAudit" WHERE "propertyId"='delivery-property'`)).rows[0].n;
 assert.equal(auditsAfterRevokedRetry,auditsBeforeRevokedRetry);
 console.log("PASS committed revocation rejects a cached claim before provider I/O and creates no pending answer audit");

 client.release();
 await clientPool.end();
 await publisher.end();
 await owner.end();
}

main().catch(error=>{console.error(error);process.exitCode=1;});
