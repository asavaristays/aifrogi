import 'server-only';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const execute=promisify(execFile);
export function websiteNeedsRendering(html:string) {
 return /<div\b[^>]*\bid=["'](?:root|app|__next)["'][^>]*>\s*<\/div>/i.test(html) && /<script\b[^>]*(?:src=|type=["']module)/i.test(html);
}
export async function renderApprovedWebsite(url:string,allowedOrigin:string) {
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||parsed.origin!==allowedOrigin)throw Error('RENDER_SOURCE_NOT_ALLOWED');
 const worker=path.join(process.cwd(),'workers/website-renderer/render.mjs');
 const {stdout}=await execute('/usr/sbin/runuser',['-u','aifrogi-crawler','--','/usr/bin/env','-i','PATH=/usr/bin:/bin','PLAYWRIGHT_BROWSERS_PATH=/opt/aifrogi-website-renderer/browsers','/usr/bin/node',worker,url,allowedOrigin],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,env:{PATH:'/usr/sbin:/usr/bin:/bin',NODE_ENV:'production'}});
 const result=JSON.parse(stdout) as {url:string;html:string;mode:string};
 if(result.mode!=='BROWSER_RENDERED'||typeof result.html!=='string'||new URL(result.url).origin!==allowedOrigin)throw Error('RENDER_RESULT_INVALID');
 return result.html;
}
