import { readFileSync } from "node:fs";
import { createHash, createPublicKey, verify } from "node:crypto";
const [signedPath,trustPath]=process.argv.slice(2);if(!signedPath||!trustPath)throw new Error("usage: signed-source.json trusted-public-keys.json");
const signed=JSON.parse(readFileSync(signedPath,"utf8")),trusted=JSON.parse(readFileSync(trustPath,"utf8"));
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(",")}]`:value&&typeof value==="object"?`{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`:JSON.stringify(value);
if(signed.schemaVersion!==1||signed.algorithm!=="RSA-SHA256"||!trusted[signed.keyId])throw new Error("RELEASE_SOURCE_SIGNER_UNTRUSTED");
const hash=createHash("sha256").update(canonical(signed.manifest)).digest("hex");if(hash!==signed.manifestHash)throw new Error("RELEASE_SOURCE_MANIFEST_MUTATED");
if(!verify("RSA-SHA256",Buffer.from(hash),createPublicKey(trusted[signed.keyId]),Buffer.from(signed.signature,"base64")))throw new Error("RELEASE_SOURCE_SIGNATURE_INVALID");console.log(`RELEASE_SOURCE_SIGNATURE_PASS ${hash}`);
