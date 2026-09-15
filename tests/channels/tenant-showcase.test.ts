import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeShowcaseItems } from "../../lib/repositories/knowledge-repository";

test("tenant showcase accepts approved uploads and HTTPS links", () => {
  const slides = normalizeShowcaseItems([
    { id: "stay-1", imageUrl: "/api/media/uploads/showcase/demo/photo.webp", title: "A remarkable stay", text: "Quiet rooms and thoughtful hospitality.", linkUrl: "https://example.com/stay", linkLabel: "View stay" },
    { id: "service-1", imageUrl: "https://example.com/service.jpg", title: "Advisory service", text: "Discuss your requirement." }
  ]);
  assert.equal(slides.length, 2);
  assert.equal(slides[0].linkLabel, "View stay");
  assert.equal(slides[1].linkLabel, "Learn more");
});

test("tenant showcase rejects insecure and incomplete content", () => {
  assert.throws(() => normalizeShowcaseItems([{ imageUrl: "http://example.com/a.jpg", title: "Unsafe" }]));
  assert.throws(() => normalizeShowcaseItems([{ imageUrl: "https://example.com/a.jpg", title: "", text: "" }]));
});

test("Setup supports URL or verified upload and both bot deliveries render the carousel", () => {
  const setup = readFileSync("components/setup/bot-showcase-settings.tsx", "utf8");
  const appearance = readFileSync("components/setup/bot-appearance-settings.tsx", "utf8");
  const upload = readFileSync("app/api/setup/showcase-upload/route.ts", "utf8");
  const embed = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  const standalone = readFileSync("app/bot/[slug]/page.tsx", "utf8");
  const frame = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  assert.match(setup, /Photo carousel/);
  assert.match(setup, /Or upload an image/);
  assert.match(appearance, /Upload logo/);
  assert.match(appearance, /Upload welcome image/);
  assert.match(appearance, /showcase-upload/);
  assert.match(upload, /MAX_BYTES = 2 \* 1024 \* 1024/);
  assert.match(upload, /does not contain a valid image/);
  assert.match(embed, /ShowcaseCarousel/);
  assert.match(standalone, /showcaseItems=\{settings\.showcaseItems\}/);
  assert.match(frame, /showcaseItems=\{settings\.showcaseItems\}/);
});
