import assert from "node:assert/strict";
import test from "node:test";
import { publicAppOrigin } from "../../lib/public-app-origin";

test("production installer never emits a reverse-proxy localhost origin", () => {
  assert.equal(publicAppOrigin("https://localhost:3011/api/public/website-bot/test/install", { NODE_ENV: "production" }), "https://app.aifrogi.com");
  assert.equal(publicAppOrigin("http://127.0.0.1:3011/api/public/website-bot/test/install", { NODE_ENV: "production", AIFROGI_APP_URL: "http://localhost:3011" }), "https://app.aifrogi.com");
});

test("production installer accepts the configured public HTTPS origin", () => {
  assert.equal(publicAppOrigin("http://localhost:3011/install", { NODE_ENV: "production", AIFROGI_APP_URL: "https://bot.example.com/path" }), "https://bot.example.com");
});

test("development installer can use the request origin", () => {
  assert.equal(publicAppOrigin("http://localhost:3011/install", { NODE_ENV: "development" }), "http://localhost:3011");
});
