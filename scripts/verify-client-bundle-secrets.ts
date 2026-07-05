import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), ".next", "static");
const forbidden = [
  "META_APP_SECRET",
  "FACEBOOK_APP_SECRET",
  "META_WHATSAPP_ACCESS_TOKEN",
  "AUTH_SESSION_SECRET",
  "AUTOMATION_CRON_SECRET",
  "SMTP_PASSWORD",
  "TWILIO_AUTH_TOKEN",
  "AI_BOT_AGENT_REPLY_TOKEN"
];

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  }))).flat();
}

async function main() {
  const matches: Array<{ file: string; marker: string }> = [];
  for (const file of await files(root)) {
    if (!/\.(js|json|txt|map)$/.test(file)) continue;
    const content = await readFile(file, "utf8");
    for (const marker of forbidden) if (content.includes(marker)) matches.push({ file: path.relative(process.cwd(), file), marker });
  }

  if (matches.length) {
    console.error("FAIL: server-only secret markers appeared in browser assets.");
    for (const match of matches) console.error(`- ${match.marker} in ${match.file}`);
    process.exit(1);
  }
  console.log(`PASS: ${forbidden.length} secret markers are absent from .next/static browser assets.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
