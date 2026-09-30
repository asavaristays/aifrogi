import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

export type SignedReleaseSource = {
  schemaVersion: 1;
  algorithm: "RSA-SHA256";
  keyId: string;
  manifestHash: string;
  manifest: unknown;
  signature: string;
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,child])=>`${JSON.stringify(key)}:${canonical(child)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function releaseSourceManifestHash(manifest: unknown) {
  return createHash("sha256").update(canonical(manifest)).digest("hex");
}

export function signReleaseSource(input: { manifest: unknown; privateKeyPem: string; keyId: string }): SignedReleaseSource {
  if (!input.keyId.trim()) throw new Error("RELEASE_SOURCE_KEY_ID_REQUIRED");
  const manifestHash = releaseSourceManifestHash(input.manifest);
  return { schemaVersion: 1, algorithm: "RSA-SHA256", keyId: input.keyId, manifestHash, manifest: input.manifest, signature: sign("RSA-SHA256", Buffer.from(manifestHash,"utf8"), createPrivateKey(input.privateKeyPem)).toString("base64") };
}

export function verifyReleaseSource(input: SignedReleaseSource, trustedPublicKeys: Record<string,string>) {
  if (input.schemaVersion !== 1 || input.algorithm !== "RSA-SHA256") throw new Error("RELEASE_SOURCE_SIGNATURE_FORMAT_INVALID");
  const publicKey = trustedPublicKeys[input.keyId];
  if (!publicKey) throw new Error("RELEASE_SOURCE_SIGNER_UNTRUSTED");
  const actualHash = releaseSourceManifestHash(input.manifest);
  if (actualHash !== input.manifestHash) throw new Error("RELEASE_SOURCE_MANIFEST_MUTATED");
  if (!verify("RSA-SHA256", Buffer.from(actualHash,"utf8"), createPublicKey(publicKey), Buffer.from(input.signature,"base64"))) throw new Error("RELEASE_SOURCE_SIGNATURE_INVALID");
  return { verified: true as const, manifestHash: actualHash, keyId: input.keyId };
}
