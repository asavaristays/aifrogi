import fs from "node:fs";
import path from "node:path";
const root=process.cwd(),manifest=JSON.parse(fs.readFileSync(path.join(root,"config/canonical-routes.json"),"utf8"));
const files=[];function walk(directory){if(!fs.existsSync(directory))return;for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())walk(full);else if(/(page|route)\.tsx?$/.test(entry.name))files.push(path.relative(path.join(root,"app"),full));}}
walk(path.join(root,"app"));
const routes=files.map(file=>"/"+file.replace(/\/(page|route)\.tsx?$/,"" ).replace(/\(app\)\//g,"").replace(/\/route\.ts$/,""));
const retired=routes.filter(route=>manifest.retiredPrefixes.some(prefix=>route===prefix||route.startsWith(prefix+"/")));
const missing=manifest.requiredPrefixes.filter(prefix=>!routes.some(route=>route===prefix||route.startsWith(prefix+"/")));
if(retired.length||missing.length){console.error(JSON.stringify({retired,missing},null,2));process.exit(1);}console.log(JSON.stringify({ok:true,routeSources:routes.length,retired:0,required:manifest.requiredPrefixes.length}));
