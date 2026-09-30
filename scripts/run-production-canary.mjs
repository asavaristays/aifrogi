import { mkdirSync, writeFileSync } from "node:fs";

const questions = [
  "What services does Webtechnosys provide?", "How can I contact Webtechnosys?",
  "Where are the Webtechnosys offices located?", "Does Webtechnosys develop mobile applications?",
  "Does Webtechnosys build custom software for Indian companies?", "What AI automation services are available?",
  "What hospitality AI solutions does Webtechnosys offer?", "What is HotelRADAR?",
  "Does Webtechnosys provide AI training?", "How can I book the AI Tool Universe Bootcamp?",
  "Does Webtechnosys create AI films or commercial videos?", "Who founded Webtechnosys?",
  "How does a new software project begin?", "What happens before software development starts?",
  "Which industries does Webtechnosys work with?", "Does Webtechnosys serve hotels and resorts?",
  "Can Webtechnosys help with digital transformation?", "Does Webtechnosys work with businesses outside Goa?",
  "What is the Webtechnosys email address and phone number?", "How can I request a project proposal?"
];
const base = process.env.AIFROGI_CANARY_URL || "http://127.0.0.1:3011/api/public/website-bot/webtechnosys-fresh-ai-bot-03e89f";
const release = process.env.AIFROGI_CANARY_RELEASE || "p2b-v6-20260930-rc7";
const output = process.env.AIFROGI_CANARY_REPORT || "/var/backups/aifrogi/rc7-canary/localhost-20-and-handover.json";
const results = [];
for (const [index, question] of questions.entries()) {
  const started = Date.now();
  try {
    const response = await fetch(base, { method:"POST", headers:{"content-type":"application/json",host:"app.aifrogi.com"}, body:JSON.stringify({message:question,sessionId:`rc6-20-${index + 1}-${Date.now()}`}), signal:AbortSignal.timeout(20_000) });
    const payload = await response.json();
    results.push({number:index + 1,question,status:response.status,ms:Date.now()-started,grounded:payload.grounded===true,sources:Array.isArray(payload.sources)?payload.sources.length:0,answer:payload.answer||null,error:payload.error||null,pass:response.status===200&&payload.grounded===true&&typeof payload.answer==="string"&&payload.answer.length>10});
  } catch (error) { results.push({number:index + 1,question,status:0,ms:Date.now()-started,grounded:false,sources:0,answer:null,error:String(error),pass:false}); }
  console.log(JSON.stringify(results.at(-1)));
  await new Promise((resolve) => setTimeout(resolve, 6_000));
}
const handoverResponse = await fetch(base, { method:"POST",headers:{"content-type":"application/json",host:"app.aifrogi.com"},body:JSON.stringify({message:"I want to speak with a human about a project",requestHuman:true,sessionId:`rc6-handover-${Date.now()}`}),signal:AbortSignal.timeout(20_000) });
const handoverPayload = await handoverResponse.json();
const sorted = [...results].sort((a,b)=>a.ms-b.ms);
const report = {release,createdAt:new Date().toISOString(),summary:{passed:results.filter(item=>item.pass).length,total:results.length,p95:sorted[Math.ceil(results.length*.95)-1]?.ms},results,handover:{status:handoverResponse.status,conversationState:handoverPayload.conversationState,handoffAvailable:handoverPayload.handoffAvailable,answer:handoverPayload.answer,error:handoverPayload.error,pass:handoverResponse.status===200&&["HUMAN_REQUESTED","HUMAN_JOINED"].includes(handoverPayload.conversationState)}};
mkdirSync(output.slice(0,output.lastIndexOf("/")),{recursive:true,mode:0o700});
writeFileSync(output,JSON.stringify(report,null,2),{mode:0o600});
console.log(JSON.stringify({summary:report.summary,handover:report.handover}));
if(report.summary.passed!==20||!report.handover.pass)process.exitCode=1;
