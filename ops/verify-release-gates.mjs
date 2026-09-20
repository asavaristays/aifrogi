#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8" }));
const app = apps.find((item) => item.name === "lead-os-ai" && item.pm2_env?.status === "online");
if (!app?.pm2_env?.DATABASE_URL) throw new Error("Live tenant database configuration is unavailable; release blocked.");
const env = { ...process.env, DATABASE_URL: app.pm2_env.DATABASE_URL };
execFileSync("node", ["ops/verify-ai-readiness-quarantine.mjs"], { cwd: process.cwd(), env, stdio: "inherit" });
execFileSync("npm", ["run", "verify:core-fleet"], { cwd: process.cwd(), env, stdio: "inherit" });
execFileSync("node", ["ops/verify-first-ten-bot-security.mjs"], { cwd: process.cwd(), env, stdio: "inherit" });
console.log("Release gates passed: fixed Core certification and every live tenant are eligible.");
