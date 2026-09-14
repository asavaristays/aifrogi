#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8" }));
const app = apps.find((item) => item.name === "lead-os-ai" && item.pm2_env?.status === "online");
if (!app) throw new Error("The online lead-os-ai process was not found; backup refused.");
const env = { ...process.env, DATABASE_URL: app.pm2_env.DATABASE_URL, BACKUP_ENCRYPTION_PASSPHRASE: app.pm2_env.BACKUP_ENCRYPTION_PASSPHRASE };
if (!env.DATABASE_URL || !env.BACKUP_ENCRYPTION_PASSPHRASE) throw new Error("Protected database or encryption configuration is unavailable; backup refused.");
execFileSync("./ops/backup-postgres.sh", { cwd: process.cwd(), env, stdio: "inherit" });
