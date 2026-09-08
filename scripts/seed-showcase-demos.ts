import {provisionDemoSandboxes} from '../lib/demo-sandbox/service';
import {getDb} from '../lib/db';
provisionDemoSandboxes('showcase-provisioning@aifrogi.com',true).then(async rows=>{
 await getDb()!.botProfile.updateMany({where:{organizationId:{in:rows.map(r=>r.organizationId)}},data:{humanHandoffEnabled:false}});
 console.log(JSON.stringify({created:rows.length,slugs:rows.map(r=>r.slug),synthetic:true}));
 await getDb()?.$disconnect();process.exit(0);
}).catch(async()=>{console.error('Showcase provisioning stopped; inspect before rerun.');await getDb()?.$disconnect();process.exit(1);});
