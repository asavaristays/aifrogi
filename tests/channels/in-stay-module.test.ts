import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("HotelGPT exposes a Manage in-stay workspace with a safe guest QR", () => {
  const nav = source("components/layout/side-nav.tsx");
  const items = source("data/mock.ts");
  const page = source("app/(app)/in-stay/page.tsx");
  assert.match(items, /href: "\/in-stay", label: "In-stay"/);
  assert.match(nav, /item\.href !== "\/in-stay" \|\| botCategory === "STAY"/);
  assert.match(page, /category !== "STAY"/);
  assert.match(page, /\/stay\/\$\{encodeURIComponent\(property\.slug\)\}/);
  assert.match(page, /\/api\/hotelgpt-stay\/qr/);
  assert.match(page, /No password or guest data is stored in the QR/);
  assert.match(page, /Only published, owner-approved answers/);
});
