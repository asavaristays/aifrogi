import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { canServeWebsiteBot, nextWebsiteBotStatus, statusAfterBotProfileSave } from "../../lib/website-bot-lifecycle";
import { acceptedHumanOffer, humanResponseWindow } from "../../lib/website-handover";

test("only explicitly approved live website bots may serve visitors", () => {
  assert.equal(canServeWebsiteBot("CONFIGURED", ["WEBSITE"]), false);
  assert.equal(canServeWebsiteBot("LIVE", ["WEBSITE"]), true);
  for (const status of ["DRAFT", "INSTALLATION_READY", "INSTALLATION_DETECTED", "PAUSED", "DELETED"]) assert.equal(canServeWebsiteBot(status, ["WEBSITE"]), false);
  assert.equal(canServeWebsiteBot("LIVE", ["WHATSAPP"]), false);
  const embedPage = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  assert.match(embedPage, /notFound\(\)/);
  assert.doesNotMatch(embedPage, /return null;/);
  const shell = readFileSync("components/layout/app-shell.tsx", "utf8");
  assert.match(shell, /Private setup workspace/);
  assert.match(shell, /customers cannot access or use this bot until it is submitted and approved/);
});

test("go-live supports standalone or website delivery after Super Admin approval", () => {
  assert.throws(() => nextWebsiteBotStatus("DELETED", "MAKE_LIVE", true), /Restore/);
  assert.equal(nextWebsiteBotStatus("INSTALLATION_READY", "MAKE_LIVE", false), "LIVE");
  assert.equal(nextWebsiteBotStatus("INSTALLATION_DETECTED", "MAKE_LIVE", true), "LIVE");
});

test("Super Admin review exposes explicit approval and correction paths", () => {
  const installation = readFileSync("components/website-bot/website-bot-installation.tsx", "utf8");
  const route = readFileSync("app/api/admin/customers/[id]/route.ts", "utf8");
  assert.match(installation, /Approve and Make Bot Live/);
  assert.match(installation, /approvalAvailable = \[/);
  assert.match(installation, /"REVIEW_PENDING", "PAUSED"/);
  assert.match(installation, /Submitted for review/);
  assert.match(installation, /Website installation is optional/);
  assert.match(installation, /Not Approved · Request Correction/);
  assert.match(route, /DECLINE_BOT_APPROVAL/);
  assert.match(route, /correction-required email/);
});

test("client submission is required before initial Super Admin go-live", () => {
  const repository = readFileSync("lib/repositories/onboarding-repository.ts", "utf8");
  const clientRoute = readFileSync("app/api/onboarding/bot-profile/route.ts", "utf8");
  const setup = readFileSync("app/(app)/setup/page.tsx", "utf8");
  assert.match(repository, /WEBSITE_BOT_SUBMITTED_FOR_REVIEW/);
  assert.match(repository, /status: "REVIEW_PENDING"/);
  assert.match(repository, /The 15-day trial supports the Starter Bot without connector-backed actions/);
  assert.match(clientRoute, /SUBMIT_FOR_REVIEW/);
  assert.match(setup, /Starter Bot without connectors/);
  assert.match(setup, /BotReviewSubmission/);
  const onboarding = readFileSync("components/onboarding/customer-onboarding.tsx", "utf8");
  assert.match(onboarding, /BotReviewSubmission/);
  assert.match(onboarding, /INSTALLATION_READY/);
  assert.match(onboarding, /REVIEW_PENDING/);
});

test("admin review cannot silently demote a submitted bot", () => {
  assert.equal(statusAfterBotProfileSave("REVIEW_PENDING", false, false), "REVIEW_PENDING");
  assert.equal(statusAfterBotProfileSave("REVIEW_PENDING", false, true), "INSTALLATION_READY");
  assert.equal(statusAfterBotProfileSave("REVIEW_PENDING", true, true), "INSTALLATION_DETECTED");
  assert.equal(statusAfterBotProfileSave("LIVE", false, true), "LIVE");
  assert.equal(statusAfterBotProfileSave("DELETED", true, true), "DELETED");
  const repository = readFileSync("lib/repositories/onboarding-repository.ts", "utf8");
  assert.match(repository, /WEBSITE_BOT_REVIEW_INVALIDATED/);
  assert.match(repository, /WEBSITE_BOT_REVIEW_STATE_RESTORED/);
  assert.match(repository, /latestReviewEvent\?\.action === "WEBSITE_BOT_SUBMITTED_FOR_REVIEW"/);
  assert.match(repository, /materiallyChanged/);
});

test("pause, soft delete and restore are deterministic", () => {
  assert.equal(nextWebsiteBotStatus("LIVE", "PAUSE", true), "PAUSED");
  assert.equal(nextWebsiteBotStatus("PAUSED", "DELETE", true), "DELETED");
  assert.equal(nextWebsiteBotStatus("DELETED", "RESTORE", true), "INSTALLATION_DETECTED");
  assert.equal(nextWebsiteBotStatus("DELETED", "RESTORE", false), "INSTALLATION_READY");
});

test("customer restore repairs both the account and deleted website bot", () => {
  const route = readFileSync("app/api/admin/customers/[id]/route.ts", "utf8");
  const actions = readFileSync("components/admin/customer-lifecycle-actions.tsx", "utf8");
  assert.match(route, /RESTORE_TO_OPERATIONS/);
  assert.match(route, /action === "RESTORE_TO_OPERATIONS"[\s\S]*action: "RESTORE"/);
  assert.match(actions, /Restore customer/);
});

test("generic bot presentation uses theme tokens instead of dark-only answer colours", () => {
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  assert.match(widget, /bg-\[var\(--widget-soft\)\] text-\[var\(--widget-ink\)\]/);
  assert.match(widget, /text-\[var\(--widget-muted\)\]/);
});

test("JavaScript delivery uses a responsive launcher and trusted minimize message", () => {
  const installer = readFileSync("app/api/public/website-bot/[slug]/install/route.ts", "utf8");
  assert.match(installer, /aria-expanded/);
  assert.match(installer, /a\.logoUrl/);
  assert.match(installer, /a\.themeColor/);
  assert.match(installer, /a\.botName/);
  assert.match(installer, /max-width:640px/);
  assert.match(installer, /max-height:520px/);
  assert.match(installer, /window\.visualViewport/);
  assert.match(installer, /--aifrogi-vh/);
  assert.match(installer, /width:var\(--aifrogi-vw\);height:var\(--aifrogi-vh\)/);
  assert.match(installer, /mode=launcher/);
  assert.match(installer, /AIFROGI_WIDGET_CLOSE/);
  assert.match(installer, /e\.origin===/);
  assert.match(installer, /100dvh/);
});

test("only launcher-mode embeds expose the minimize control", () => {
  const embedPage = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  const shell = readFileSync("components/website-bot/webtechnosys-shell.module.css", "utf8");
  assert.match(embedPage, /dismissible=\{mode === "launcher"\}/);
  assert.match(widget, /aria-label="Close AI Bot"/);
  assert.match(widget, /<X aria-hidden="true"/);
  assert.match(widget, /window\.parent\.postMessage\(\{ type: "AIFROGI_WIDGET_CLOSE", slug \}, "\*"\)/);
  assert.match(shell, /\.identity \{[^}]*min-width: 0;[^}]*flex: 1 1 auto;/);
  assert.match(shell, /\.dismiss \{[^}]*padding: 0;[^}]*line-height: 0;/);
  assert.match(shell, /\.dismiss svg \{[^}]*display: block;[^}]*transform: none;/);
  assert.match(widget, /className=\{shell\.genericDismiss\}/);
  assert.match(shell, /\.genericDismiss \{[^}]*background: var\(--widget-soft\);[^}]*color: var\(--widget-ink\);/);
});

test("a human-owned visitor can deliberately start a separate AI conversation", () => {
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  assert.match(widget, /conversationState === "HUMAN_JOINED"[\s\S]*Start a new AI chat/);
  assert.match(widget, /sessionStorage\.removeItem\(`aifrogi-visitor:\$\{slug\}`\)/);
  assert.match(widget, /setSessionId\(crypto\.randomUUID\(\)\.replaceAll\("-", ""\)\)/);
  assert.match(widget, /setVisitorToken\(""\)/);
  assert.match(widget, /setConversationState\("AI_READY"\)/);
  assert.match(widget, /Message the business team…/);
  assert.match(widget, /payload\?\.messageAccepted/);
});

test("support offer acceptance and SLA wording are deterministic", () => {
  assert.equal(acceptedHumanOffer("yes", "Would you like to schedule a discovery session for a detailed estimate?"), true);
  assert.equal(acceptedHumanOffer("yes please", "Would you like the support team to contact you?"), true);
  assert.equal(acceptedHumanOffer("yes", "Would you like more pricing details?"), false);
  assert.equal(acceptedHumanOffer("tell me more", "Would you like to schedule a call?"), false);
  assert.equal(humanResponseWindow(30), "within 30 minutes during business hours");
  assert.equal(humanResponseWindow(60), "within 1 hour during business hours");
  assert.equal(humanResponseWindow(90), "within 2 hours during business hours");
  assert.equal(humanResponseWindow(null), "as soon as possible during business hours");
});

test("workspace menu configuration flows through Setup and public bot surfaces", () => {
  const setup = readFileSync("app/(app)/setup/page.tsx", "utf8");
  const embedPage = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  const standalone = readFileSync("app/bot/[slug]/page.tsx", "utf8");
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  assert.match(setup, /BotMenuSettings/);
  assert.match(embedPage, /menu=\{settings\.widgetMenu\}/);
  assert.match(standalone, /menu=\{settings\.widgetMenu\}/);
  assert.match(widget, /menu\.enabled/);
});

test("widget theme flows from Setup to embedded and standalone bots", () => {
  const appearance = readFileSync("components/setup/bot-appearance-settings.tsx", "utf8");
  const repository = readFileSync("lib/repositories/knowledge-repository.ts", "utf8");
  const embedPage = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  const standalone = readFileSync("app/bot/[slug]/page.tsx", "utf8");
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  assert.match(appearance, /\["dark", "light", "system"\]/);
  assert.match(repository, /widgetTheme: "dark"/);
  assert.match(embedPage, /widgetTheme=\{settings\.widgetTheme\}/);
  assert.match(standalone, /widgetTheme=\{settings\.widgetTheme\}/);
  assert.match(widget, /data-widget-theme=\{widgetTheme\}/);
});

test("client sidebar keeps Team Inbox visible for daily operations", () => {
  const navigation = readFileSync("data/mock.ts", "utf8");
  const sidebar = readFileSync("components/layout/side-nav.tsx", "utf8");
  assert.match(navigation, /href: "\/team-inbox", label: "Team Inbox"/);
  assert.ok(navigation.indexOf('href: "/contacts"') < navigation.indexOf('href: "/team-inbox"'));
  assert.match(sidebar, /hrefs: \["\/dashboard", "\/contacts", "\/team-inbox"\]/);
  assert.match(sidebar, /\["\/dashboard", "\/team-inbox", "\/contacts", "\/knowledge"/);
});

test("optional welcome highlight flows from Setup to every website widget", () => {
  const appearance = readFileSync("components/setup/bot-appearance-settings.tsx", "utf8");
  const repository = readFileSync("lib/repositories/knowledge-repository.ts", "utf8");
  const api = readFileSync("app/api/knowledge/route.ts", "utf8");
  const embedPage = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  const standalone = readFileSync("app/bot/[slug]/page.tsx", "utf8");
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  for (const field of ["welcomeCardImageUrl", "welcomeCardTitle", "welcomeCardText"]) {
    assert.match(appearance, new RegExp(field));
    assert.match(repository, new RegExp(field));
    assert.match(api, new RegExp(field));
    assert.match(embedPage, new RegExp(field));
    assert.match(standalone, new RegExp(field));
    assert.match(widget, new RegExp(field));
  }
  assert.match(repository, /public HTTPS welcome-card image URL/);
  assert.match(appearance, /1200 × 630 px/);
});
