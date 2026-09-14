#!/usr/bin/env node
import { execFileSync } from "node:child_process";

let report;
try { report = JSON.parse(execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8", maxBuffer: 20_000_000 })); }
catch (error) { report = JSON.parse(String(error.stdout || "{}")); }
const vulnerabilities = report.vulnerabilities || {};
const exceptions = new Set(["prisma", "@hono/node-server", "@prisma/config", "@prisma/dev", "deepmerge-ts", "hono", "mysql2", "valibot"]);
const blocked = Object.entries(vulnerabilities).filter(([name, value]) => ["critical", "high"].includes(value.severity) && !exceptions.has(name));
const approved = Object.entries(vulnerabilities).filter(([name, value]) => ["critical", "high"].includes(value.severity) && exceptions.has(name));
console.log(JSON.stringify({ blocked: blocked.map(([name, value]) => ({ name, severity: value.severity })), approvedNonRuntimePrismaTooling: approved.map(([name, value]) => ({ name, severity: value.severity })), reviewedAt: new Date().toISOString() }, null, 2));
if (blocked.length) throw new Error("High or critical dependency findings exist outside the approved non-runtime Prisma tooling exception.");
