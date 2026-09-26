#!/usr/bin/env node
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lockfile = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const root = lockfile.packages?.[""] || {};

const resolve = (group = {}) => Object.fromEntries(
  Object.keys(group).sort().map((name) => [name, lockfile.packages?.[`node_modules/${name}`]?.version || group[name]])
);

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  application: { name: packageJson.name, version: packageJson.version },
  runtime: { node: process.version, npmLockfileVersion: lockfile.lockfileVersion },
  dependencies: resolve(root.dependencies),
  devDependencies: resolve(root.devDependencies),
  securityOverrides: packageJson.overrides || {},
}, null, 2));
