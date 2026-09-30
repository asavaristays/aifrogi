import { readFile } from "node:fs/promises";
import { initializeCanonicalRoleClients } from "../lib/canonical-db-context";
import { withDatabaseIdentity } from "../lib/db";
import { buildWebsiteKnowledgeAnswer } from "../lib/services/website-knowledge-service";
const slug="webtechnosys-fresh-ai-bot-03e89f", organizationId="cmumdx1sx000801kx9bsxq6f4", generation="4015cb59-2095-4cc6-bbb7-0042bbfbea0d";
const questions=["How can I contact Webtechnosys?","Where are the Webtechnosys offices located?","Does Webtechnosys develop mobile applications?","What is the Webtechnosys email address and phone number?"];
async function main(){
  const pm2=JSON.parse(await readFile("/tmp/pm2-jlist.json","utf8")) as Array<{name:string;pm2_env:Record<string,string>}>; const env=pm2.find(p=>p.name==="lead-os-ai")!.pm2_env;
  for(const key of ["DATABASE_URL","OPENAI_API_KEY","OPENAI_MODEL","OPENAI_FALLBACK_MODEL"]) if(env[key]) process.env[key]=env[key];
  initializeCanonicalRoleClients();
  for(const question of questions){const value=await withDatabaseIdentity({organizationId,platformAuthority:false,actor:`public-bot:${slug}`,systemPurpose:"PUBLIC_ANSWER"},()=>buildWebsiteKnowledgeAnswer({question,propertySlug:slug})); console.log(JSON.stringify({question,answer:value?.answer,generation:value?.crawlGenerationId,chunks:value?.chunkIds?.length,claims:value?.claimIds.length,model:value?.model,pass:value?.crawlGenerationId===generation&&Boolean(value.chunkIds?.length)&&value.claimIds.length===0}));}
}
main().catch(error=>{console.error(error);process.exitCode=1});
