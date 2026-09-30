import { createHash } from "node:crypto";
import { canonicalJson } from "@/lib/bot-machine-policy";

export type ReleaseFile = { path: string; sha256: string };
export function buildReleaseSourceManifest(input: { releaseId: string; gitCommit: string; files: ReleaseFile[] }) {
  if (!input.releaseId.trim() || !/^[a-f0-9]{40}$/.test(input.gitCommit)) throw new Error("RELEASE_IDENTITY_INVALID");
  const files = [...input.files].sort((a, b) => a.path.localeCompare(b.path));
  if (!files.length || files.some((file) => !file.path || !/^[a-f0-9]{64}$/.test(file.sha256)) || new Set(files.map((file) => file.path)).size !== files.length) throw new Error("RELEASE_FILE_INVENTORY_INVALID");
  const payload = { schemaVersion: 1, releaseId: input.releaseId, gitCommit: input.gitCommit, files };
  return { payload, manifestHash: createHash("sha256").update(canonicalJson(payload)).digest("hex") };
}
export function compareRuntimeRelease(expected: ReturnType<typeof buildReleaseSourceManifest>, actual: { releaseId: string; gitCommit: string; files: ReleaseFile[] }) {
  const observed = buildReleaseSourceManifest(actual);
  const drift = expected.manifestHash !== observed.manifestHash;
  return { drift, expectedHash: expected.manifestHash, observedHash: observed.manifestHash };
}

export function runtimeReleaseDriftFromEnv(env: NodeJS.ProcessEnv = process.env) {
  if (!env.AIFROGI_EXPECTED_SOURCE_MANIFEST || !env.AIFROGI_RUNTIME_SOURCE_MANIFEST) return { configured: false as const, drift: null };
  let expected: ReturnType<typeof buildReleaseSourceManifest>;
  let actual: { releaseId: string; gitCommit: string; files: ReleaseFile[] };
  try { expected=JSON.parse(env.AIFROGI_EXPECTED_SOURCE_MANIFEST); actual=JSON.parse(env.AIFROGI_RUNTIME_SOURCE_MANIFEST); } catch { throw new Error("RELEASE_MANIFEST_ENV_INVALID"); }
  return { configured: true as const, ...compareRuntimeRelease(expected,actual) };
}
