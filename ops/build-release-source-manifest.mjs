import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";

const [releaseId, gitCommit, inventoryPath, outputPath] = process.argv.slice(2);
if (!releaseId || !/^[a-f0-9]{40}$/.test(gitCommit || "") || !inventoryPath || !outputPath) throw new Error("usage: releaseId gitCommit inventory.txt output.json");
const root = process.cwd();
const paths = readFileSync(inventoryPath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
if (!paths.length || new Set(paths).size !== paths.length) throw new Error("RELEASE_INVENTORY_INVALID");
const files = paths.map((path) => { const absolute=resolve(root,path); const rel=relative(root,absolute); if(rel.startsWith("..")) throw new Error("RELEASE_PATH_OUTSIDE_ROOT"); return {path:rel,sha256:createHash("sha256").update(readFileSync(absolute)).digest("hex")}; }).sort((a,b)=>a.path.localeCompare(b.path));
const payload={schemaVersion:1,releaseId,gitCommit,files};
const manifestHash=createHash("sha256").update(JSON.stringify(payload)).digest("hex");
writeFileSync(outputPath,`${JSON.stringify({payload,manifestHash},null,2)}\n`,{mode:0o600});
console.log(manifestHash);
