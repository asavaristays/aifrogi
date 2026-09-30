import { readFileSync, writeFileSync } from "node:fs";
import { createHash, createPrivateKey, sign } from "node:crypto";

const [manifestPath, outputPath] = process.argv.slice(2);
const keyPath = process.env.AIFROGI_RELEASE_SOURCE_PRIVATE_KEY_FILE;
const keyId = process.env.AIFROGI_RELEASE_SOURCE_KEY_ID?.trim();
if (!manifestPath || !outputPath || !keyPath || !keyId) throw new Error("usage: manifest.json signed.json with AIFROGI_RELEASE_SOURCE_PRIVATE_KEY_FILE and AIFROGI_RELEASE_SOURCE_KEY_ID");
const manifest = JSON.parse(readFileSync(manifestPath,"utf8"));
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}` : JSON.stringify(value);
const manifestHash = createHash("sha256").update(canonical(manifest)).digest("hex");
const signature = sign("RSA-SHA256",Buffer.from(manifestHash,"utf8"),createPrivateKey(readFileSync(keyPath,"utf8"))).toString("base64");
writeFileSync(outputPath,`${JSON.stringify({schemaVersion:1,algorithm:"RSA-SHA256",keyId,manifestHash,manifest,signature},null,2)}\n`,{mode:0o600,flag:"wx"});
console.log(manifestHash);
