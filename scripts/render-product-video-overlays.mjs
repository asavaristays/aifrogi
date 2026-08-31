import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [outputDirectory, rootDirectory] = process.argv.slice(2);
if (!outputDirectory || !rootDirectory) {
  throw new Error("Usage: render-product-video-overlays.mjs OUTPUT_DIRECTORY ROOT_DIRECTORY");
}

await mkdir(outputDirectory, { recursive: true });
const logoPath = path.join(rootDirectory, "public/brand/aifrogi-logo-transparent.png");
const logo = await sharp(logoPath).resize(520, 195, { fit: "contain" }).png().toBuffer();

function svgDocument(body, background = "transparent") {
  return Buffer.from(`<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <rect width="1920" height="1080" fill="${background}"/>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; letter-spacing: 0; }
    </style>
    ${body}
  </svg>`);
}

async function renderTitleCard(fileName, headline, supporting) {
  const surface = sharp({ create: { width: 1920, height: 1080, channels: 4, background: "#211a2b" } });
  const text = svgDocument(`
    <rect x="650" y="115" width="620" height="300" rx="12" fill="#050505"/>
    <text x="960" y="620" fill="#ffffff" font-size="64" font-weight="650" text-anchor="middle">${headline}</text>
    <text x="960" y="700" fill="#ffb4f7" font-size="30" font-weight="500" text-anchor="middle">${supporting}</text>
  `);
  await surface.composite([
    { input: text },
    { input: logo, left: 700, top: 168 }
  ]).png().toFile(path.join(outputDirectory, fileName));
}

async function renderLowerThird(fileName, eyebrow, headline, supporting) {
  const overlay = svgDocument(`
    <rect x="88" y="720" width="1744" height="255" rx="12" fill="#211a2b" fill-opacity="0.95"/>
    <text x="130" y="790" fill="#ff8af1" font-size="24" font-weight="700">${eyebrow}</text>
    <text x="130" y="855" fill="#ffffff" font-size="48" font-weight="650">${headline}</text>
    <text x="130" y="920" fill="#d8d1df" font-size="27" font-weight="450">${supporting}</text>
  `);
  await sharp(overlay).png().toFile(path.join(outputDirectory, fileName));
}

await Promise.all([
  renderTitleCard("intro.png", "Business messaging, made operational.", "WhatsApp. Campaigns. AI. Humans in control."),
  renderLowerThird("dashboard.png", "TODAY", "Start with what needs attention", "Ownership, urgency, account health and the next safe action."),
  renderLowerThird("inbox.png", "SHARED INBOX", "Every conversation has context", "Reply, assign, qualify and hand over without losing the customer story."),
  renderLowerThird("knowledge.png", "GOVERNED AI", "Answers come from approved truth", "Review sources, close knowledge gaps and escalate uncertainty to a human."),
  renderLowerThird("analytics.png", "MEASURABLE OPERATIONS", "Know what is working", "Monitor response, delivery, read rate and the queue that still needs action."),
  renderLowerThird("team.png", "CONTROLLED ACCESS", "The right workspace for every role", "Private accounts and least-privilege access for every team member."),
  renderTitleCard("outro.png", "One clear operating loop.", "Start your 15-day working trial at aifrogi.com")
]);
