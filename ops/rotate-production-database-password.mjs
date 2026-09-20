#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const app = apps.find((item) => item.name === "lead-os-ai" && item.pm2_env?.status === "online");
if (!app?.pm2_env?.DATABASE_URL) throw new Error("AiFrogi production process or protected database configuration is unavailable.");
const next = new URL(app.pm2_env.DATABASE_URL);
const role = decodeURIComponent(next.username);
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(role)) throw new Error("Database role name failed safety validation.");
const password = randomBytes(36).toString("base64url");
const escapedPassword = password.replace(/'/g, "''");
next.password = password;
next.searchParams.delete("schema");

// The local PostgreSQL administrator is used only to rotate this one role.
execFileSync("sudo", ["-u", "postgres", "psql", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `ALTER ROLE \"${role}\" PASSWORD '${escapedPassword}'`], { stdio: "ignore" });
execFileSync("psql", [next.toString(), "-v", "ON_ERROR_STOP=1", "-Atc", "SELECT 1"], { stdio: "ignore" });
execFileSync("pm2", ["restart", "lead-os-ai", "--update-env"], { env: { ...process.env, DATABASE_URL: next.toString() }, stdio: "ignore" });
execFileSync("pm2", ["save"], { stdio: "ignore" });
console.log("Production database password rotated; AiFrogi was restarted with the validated replacement connection.");
