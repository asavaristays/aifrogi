const base=(process.env.AIFROGI_LOAD_TEST_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const slug=process.env.AIFROGI_LOAD_TEST_SLUG||"webtechnosys-ai-agency-e5da22";
const concurrency=Math.max(1,Math.min(Number(process.env.AIFROGI_LOAD_TEST_CONCURRENCY||10),50));
const started=Date.now();const results=await Promise.all(Array.from({length:concurrency},async()=>{const response=await fetch(`${base}/embed/${slug}?mode=launcher`);await response.arrayBuffer();return response.status;}));
const failed=results.filter(status=>status!==200);console.log(JSON.stringify({base,concurrency,durationMs:Date.now()-started,ok:failed.length===0,statuses:Object.fromEntries([...new Set(results)].map(status=>[status,results.filter(item=>item===status).length]))}));if(failed.length)process.exit(1);
