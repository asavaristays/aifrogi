#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, closeSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { join } from "node:path";

const release = process.argv[2]?.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80) || "unknown";
const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const app = apps.find((candidate) => candidate.name === "lead-os-ai");
if (!app) throw new Error("AiFrogi production process was not found.");

const protectedEnv = { ...process.env, ...app.pm2_env };
if (!protectedEnv.DATABASE_URL || !protectedEnv.BACKUP_ENCRYPTION_PASSPHRASE) throw new Error("Required protected backup variables are not available to the running process.");

const output = execFileSync("./ops/backup-postgres.sh", { cwd: process.cwd(), env: protectedEnv, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
const encrypted = output.split(/\r?\n/).at(-1) || "";
if (!/^\/var\/backups\/aifrogi\/aifrogi-\d{8}T\d{6}Z\.dump\.gz\.enc$/.test(encrypted)) throw new Error("Backup output path failed validation.");

execFileSync("shasum", ["-a", "256", "-c", `${encrypted}.sha256`], { stdio: ["ignore", "ignore", "inherit"] });
const verifyDir = mkdtempSync("/tmp/aifrogi-backup-verify-");
try {
  const compressed = join(verifyDir, "backup.dump.gz");
  const dump = join(verifyDir, "backup.dump");
  execFileSync("openssl", ["enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", encrypted, "-out", compressed, "-pass", "env:BACKUP_ENCRYPTION_PASSPHRASE"], { env: protectedEnv, stdio: ["ignore", "ignore", "inherit"] });
  const dumpFd = openSync(dump, "wx", 0o600);
  const unpacked = spawnSync("gzip", ["-dc", compressed], { stdio: ["ignore", dumpFd, "pipe"] });
  closeSync(dumpFd);
  if (unpacked.status !== 0) throw new Error("Encrypted backup decompression verification failed.");
  execFileSync("pg_restore", ["--list", dump], { stdio: ["ignore", "ignore", "inherit"] });
} finally {
  rmSync(verifyDir, { recursive: true, force: true });
}

const auditLine = `${new Date().toISOString()} release=${release} actor=codex-deployment action=encrypted-pre-migration-backup-verified\n`;
appendFileSync("/var/log/aifrogi-migrations.log", auditLine, { encoding: "utf8", mode: 0o600 });
console.log(`Encrypted backup verified for release ${release}.`);
