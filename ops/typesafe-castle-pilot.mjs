import { readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";

const action = process.argv[2];
if (!["enable", "disable", "status"].includes(action)) throw new Error("Use enable, disable or status");
const app = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8" })).find(item => item.name === "lead-os-ai");
if (!app) throw new Error("Core app unavailable");
if (action !== "status") {
  const env = { ...process.env, ...app.pm2_env, TYPESAFE_ACTION_GATEWAY_ENABLED: "false", TYPESAFE_MODE: "off", TYPESAFE_SHADOW_ORGANIZATIONS: "" };
  if (action === "enable") {
    if (app.pm2_env.exec_mode !== "fork_mode" || app.pm2_env.instances !== 1) throw new Error("Pilot requires one fork process");
    const file = "/etc/aifrogi-typesafe-evaluation.env";
    if ((statSync(file).mode & 0o077) !== 0) throw new Error("Credential file permissions too broad");
    const match = readFileSync(file, "utf8").match(/^TYPESAFE_API_KEY=(.+)$/m);
    const key = match?.[1].trim().replace(/^['"]|['"]$/g, "");
    if (!key || !/^[A-Za-z0-9_.-]{20,200}$/.test(key)) throw new Error("Invalid credential format");
    Object.assign(env, { TYPESAFE_API_KEY: key, TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_SHADOW_ORGANIZATIONS: "cmu2dcedu003284kxjotchehs" });
  }
  execFileSync("pm2", ["restart", "lead-os-ai", "--update-env"], { env, stdio: "ignore" });
  execFileSync("pm2", ["save"], { stdio: "ignore" });
}
const current = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8" })).find(item => item.name === "lead-os-ai");
console.log(JSON.stringify({ status: current.pm2_env.status, enabled: current.pm2_env.TYPESAFE_ACTION_GATEWAY_ENABLED === "true", mode: current.pm2_env.TYPESAFE_MODE || "off", tenant: current.pm2_env.TYPESAFE_SHADOW_ORGANIZATIONS || "none" }));
