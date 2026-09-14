import fs from "node:fs";

const file = "/var/www/lead-os-ai/data/runtime/knowledge-settings-asavaristays-703624.json";
const settings = JSON.parse(fs.readFileSync(file, "utf8"));
const flows = Array.isArray(settings.tenantFlows) ? settings.tenantFlows : [];
const retained = flows.filter((flow) => flow.status === "PUBLISHED" || flow.status === "PAUSED");
const removed = flows.filter((flow) => flow.status === "DRAFT");
settings.tenantFlows = retained;
settings.updatedAt = new Date().toISOString();
fs.writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o640 });
console.log(`Removed ${removed.length} unused draft flows; retained ${retained.length} governed flows.`);
