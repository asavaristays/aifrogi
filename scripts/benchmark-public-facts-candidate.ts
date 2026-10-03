import {readFile,writeFile} from 'node:fs/promises';
import {Pool} from 'pg';
import {initializeCanonicalRoleClients,disconnectCanonicalRoleClients,withCanonicalRole} from '../lib/canonical-db-context';
import {answerFromSharedCrawl} from '../lib/shared-answer-runtime';
async function main(){
 const slug='webtechnosys-fresh-ai-bot-03e89f';
 const pool=new Pool({connectionString:process.env.DATABASE_URL});
 const org=await pool.query('SELECT aifrogi_security.resolve_public_bot_organization($1) AS id',[slug]);
 const client=await pool.connect();let row;
 try {await client.query('BEGIN');await client.query("SELECT set_config('app.organization_id',$1,true)",[org.rows[0].id]);row=(await client.query('SELECT id,"organizationId" FROM "Property" WHERE slug=$1',[slug])).rows[0];await client.query('ROLLBACK');}finally{client.release();await pool.end();}
 if(!row)throw Error('TENANT_NOT_FOUND');initializeCanonicalRoleClients();
 const identity={organizationId:row.organizationId,propertyId:row.id,principal:`public-bot:${slug}`,purpose:'PUBLIC_ANSWER'};
 const approved=JSON.parse(await readFile('deliverables/WEBTECHNOSYS_PUBLIC_15_UI_RECOVERY_FINAL_2026-10-01.json','utf8')).results;
 const cases=[...approved.map((r:any)=>({question:r.question,signals:r.expectedSignals,group:'approved-15'})),...['What is your mobile number?','What is your phone number?','Share your address','Email address please','What are your opening hours?'].map(question=>({question,signals:[],group:'public-facts'}))];
 const results=[];
 for(const c of cases){const r=await answerFromSharedCrawl(identity,c.question);const matched=c.signals.filter((s:string)=>r.answer.toLowerCase().includes(s));const pass=['ANSWER','PARTIAL'].includes(r.disposition)&&matched.length>=Math.min(2,c.signals.length);
 results.push({...c,actualReply:r.answer,assessment:pass?'SIGNAL_CHECK_PASS':'REVIEW_REQUIRED',failureCode:r.failureCode,totalLatencyMs:r.totalMs,stages:r.trace.stages,modelUsage:r.modelUsage,retrievedPassages:r.retrievedEvidence.map(e=>({id:e.id,url:e.url,content:e.content})),citedPassages:r.evidence});console.log(JSON.stringify({question:c.question,answer:r.answer,pass,totalMs:r.totalMs,modelUsage:r.modelUsage}));}
 await writeFile('deliverables/PUBLIC_FACTS_CANDIDATE_2026-10-03.json',JSON.stringify({mode:'isolated engine candidate; not deployed; signal checks require evidence review',results},null,2));
 await disconnectCanonicalRoleClients();
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
