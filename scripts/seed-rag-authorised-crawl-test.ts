import {Pool} from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const url=process.env.RAG_TEST_DATABASE_URL!;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname)||new URL(url).pathname!=='/rag_candidate') throw new Error('ISOLATED_TEST_DATABASE_REQUIRED');
const pool=new Pool({connectionString:url,max:1});
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
async function main(){
 const data=JSON.parse(await readFile(process.env.RAG_TEST_CRAWL_FILE!,'utf8')) as Array<{id:string;content:string;url:string;title:string;embedding:number[]}>;
 if(!Array.isArray(data)||!data.length||data.some(r=>new URL(r.url).hostname!=='webtechnosys.com'&&new URL(r.url).hostname!=='www.webtechnosys.com')) throw new Error('AUTHORISED_CRAWL_FIXTURE_INVALID');
 await pool.query("UPDATE \"KnowledgeSource\" SET state='AUTHORIZED',\"revokedAt\"=NULL WHERE id='delivery-source'");
 await pool.query(`INSERT INTO "WebsiteCrawlGeneration"(id,"propertyId","captureVersionId",status,"pageCount","chunkCount","contentHash") VALUES('rag-crawl','delivery-property','delivery-capture-version','ACTIVE',$1,$2,$3)`,[new Set(data.map(r=>r.url)).size,data.length,digest(JSON.stringify(data.map(r=>r.content)))]);
 await pool.query(`INSERT INTO "WebsiteSemanticIndex"("propertyId","generationId",model,dimensions,status) VALUES('delivery-property','rag-crawl','text-embedding-3-small',512,'READY')`);
 const pages=[...new Set(data.map(r=>r.url))];
 for(let i=0;i<pages.length;i++) {
  const group=data.filter(r=>r.url===pages[i]);const content=group.map(r=>r.content).join('\n');
  await pool.query(`INSERT INTO "WebsiteCrawlPage"(id,"propertyId","generationId",url,title,bucket,content,"contentHash","crawledAt") VALUES($1,'delivery-property','rag-crawl',$2,$3,'authorised-test-copy',$4,$5,clock_timestamp())`,['rag-page-'+i,pages[i],group[0].title,content,digest(content)]);
  for(let j=0;j<group.length;j++) {
   const r=group[j];await pool.query(`INSERT INTO "WebsiteCrawlChunk"(id,"propertyId","generationId","pageId",ordinal,content,"contentHash") VALUES($1,'delivery-property','rag-crawl',$2,$3,$4,$5)`,[r.id,'rag-page-'+i,j,r.content,digest(r.content)]);
   if(r.embedding?.length===512) await pool.query(`INSERT INTO "WebsiteSemanticEmbedding"("propertyId","generationId",model,"chunkId","contentHash",embedding) VALUES('delivery-property','rag-crawl','text-embedding-3-small',$1,$2,$3)`,[r.id,digest(r.content),r.embedding]);
  }
 }

 await pool.query(`GRANT EXECUTE ON FUNCTION aifrogi_security.retrieve_active_website_chunks(text,text,integer) TO aifrogi_public`);
 console.log(JSON.stringify({mode:'isolated copy of existing authorised crawl; no new crawling',pages:pages.length,chunks:data.length}));
}
main().catch(e=>{console.error(String(e));process.exitCode=1;}).finally(()=>pool.end());
