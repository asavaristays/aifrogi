#!/usr/bin/env -S node --import tsx

import { getDb } from "@/lib/db";
import { normalizeClaimKey } from "@/lib/knowledge-verification";
import { execFileSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  const app = apps.find((candidate: { name?: string; pm2_env?: { DATABASE_URL?: string } }) => candidate.name === "lead-os-ai");
  if (app?.pm2_env?.DATABASE_URL) process.env.DATABASE_URL = app.pm2_env.DATABASE_URL;
}

const propertySlug = "webtechnosys-ai-agency-e5da22";
const actor = "founder-authorized@aifrogi.com";
const source = "Webtechnosys first-party website verified 2026-09-08";
const claims = [
  ["Who is the service for?", "Webtechnosys serves businesses across India that need AI, web, mobile application, custom software or digital-transformation solutions.", "Audience"],
  ["How does a project start?", "A project starts with a discovery session. Webtechnosys then prepares a detailed proposal, Statement of Work, project timeline and commercial agreement before development begins.", "Project process"],
  ["What information is needed to start?", "Start by sharing the business goal and the software, automation or customer problem to solve. The discovery session confirms the remaining requirements needed for the proposal, scope and timeline.", "Project discovery"],
  ["What does the service cost?", "Webtechnosys has no approved general public pricing page. Custom project pricing is prepared after the discovery session and documented in the proposal and commercial agreement. AI Tool Universe Bootcamp seats are ₹1,650 per person, including lunch. Do not provide or invent any other pricing URL.", "Pricing"],
  ["How long does delivery take?", "There is no single delivery time for every project. Webtechnosys confirms the project timeline in the proposal and Statement of Work after discovery; the bot must not guarantee an unapproved delivery date.", "Delivery timeline"],
  ["What support is available?", "Webtechnosys provides structured project management, regular meetings and dedicated support during Indian business hours. Post-launch maintenance, enhancements and AI optimisation are available through support plans.", "Support"],
  ["What cannot the bot confirm?", "The bot cannot confirm a custom price, delivery guarantee, discount, contract term or completed technical action unless that exact information has been approved or verified. It will involve the Webtechnosys team when human confirmation is required.", "Bot boundaries"],
  ["How is customer data handled?", "Webtechnosys uses signed agreements, milestone-based delivery, regular progress reviews and secure communication. NDA, MSA, Statement of Work and Software Development Agreement options are available to protect both parties.", "Data and engagement"],
  ["When is the AI Tool Universe Bootcamp?", "AI Tool Universe Bootcamp seats are offered in Saturday cohorts during September and October 2026. Current cohort choices and seat availability are shown at https://webtechnosys.com/training-booking/. Venue details are shared after booking confirmation.", "Training schedule"],
  ["What is included in AI Tool Universe Bootcamp?", "The AI Tool Universe Bootcamp fee is ₹1,650 per person and lunch is included. A booking is confirmed only after the Webtechnosys backend verifies the Razorpay payment signature.", "Training fee"],
  ["Is AI training suitable for a small team?", "The published AI Tool Universe Bootcamp is booked per person. Webtechnosys has not published a separate small-team or group package, so the team must confirm any group-specific format or commercial arrangement. Call +91-7410582898 for that confirmation.", "Training suitability"],
  ["How can an AI business bot help a company?", "An AI business bot can answer approved customer questions, capture and qualify genuine leads, support routine enquiries and hand a conversation to the human team when needed. Its exact scope and availability depend on the approved project requirements; it must not promise 24/7 or business-hour coverage unless that is specifically agreed.", "AI bot benefits"],
  ["What AI and software services does Webtechnosys provide?", "Webtechnosys provides AI automation, AI-powered and custom software development, web and mobile application development, digital transformation, AI training, AI filmmaking and hospitality technology solutions.", "Services"],
  ["How can Webtechnosys help hotels use AI?", "Webtechnosys offers hospitality technology including Hotel PMS, Channel Manager, Booking Engine, HotelRADAR and AI-assisted guest, operations and revenue solutions.", "Hospitality AI"],
  ["What is included in AI filmmaking?", "Webtechnosys provides AI-assisted commercial filmmaking, hospitality brand films and hotel social-media video content. Details are available at https://webtechnosys.com/ai-filmmaking/ or by calling +91-7410582898.", "AI filmmaking"]
] as const;

async function main() {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required.");
  const property = await db.property.findUnique({ where: { slug: propertySlug }, select: { id: true, organizationId: true } });
  if (!property) throw new Error("Webtechnosys property was not found.");
  if (!property.organizationId) throw new Error("Webtechnosys property is not attached to an organization.");
  const organizationId = property.organizationId;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 86400000);
  const applied = await db.$transaction(async tx => {
    const results = [];
    await tx.organization.update({ where: { id: organizationId }, data: {
      website: "https://webtechnosys.com",
      publicPhone: "+91-7410582898",
      publicEmail: "info@webtechnosys.com",
      publicAddress: "Goa: H.No 746 - TF, New Wada, Morjim, Goa 403512. Gurgaon: 656 Ground Floor, Sector 40, Mohyal Colony, near Trikona Park Barricade, Gurgaon, Haryana 122003."
    } });
    for (const [question, answer, category] of claims) {
      const claimKey = normalizeClaimKey(category, question);
      const existing = await tx.knowledgeEntry.findFirst({ where: { propertyId: property.id, claimKey }, orderBy: { version: "desc" }, select: { id: true, version: true, answer: true, status: true } });
      if (existing?.answer === answer && existing.status === "PUBLISHED") {
        results.push({ claimKey, action: "UNCHANGED", id: existing.id });
        continue;
      }
      const entry = await tx.knowledgeEntry.create({ data: {
        propertyId: property.id, question, answer, category, claimKey, claimType: "FACT", valueType: "TEXT", refreshDays: 90,
        status: "PUBLISHED",
        reliability: "CLIENT_CONFIRMED", authorityLevel: "CLIENT_APPROVED_STRUCTURED", version: (existing?.version || 0) + 1,
        supersedesId: existing?.id || null, validationStatus: "VALID", validationErrors: [], conflictStatus: "CLEAR",
        fieldApprovedBy: actor, fieldApprovedAt: now, previewApprovedBy: actor, previewApprovedAt: now, publishedAt: now,
        lastConfirmedAt: now, expiresAt, createdBy: actor, approvedBy: actor, approvedAt: now
      } });
      if (existing) await tx.knowledgeEntry.update({ where: { id: existing.id }, data: { status: "SUPERSEDED" } });
      results.push({ claimKey, action: existing ? "SUPERSEDED" : "CREATED", id: entry.id });
    }
    await tx.knowledgeGap.updateMany({
      where: { propertyId: property.id, normalizedQuestion: { in: ["i want to speak with a person", "i am only exploring and have not decided anything yet"] } },
      data: { status: "RESOLVED" }
    });
    await tx.onboardingActivity.create({ data: { organizationId, actorEmail: actor, action: "TENANT_INTELLIGENCE_MANIFEST_APPLIED", detail: `Webtechnosys manifest v1.0: ${claims.length} founder-authorized first-party claims. Source: ${source}.` } });
    return results;
  });
  console.log(JSON.stringify({ propertySlug, source, claimCount: claims.length, applied }, null, 2));
  await db.$disconnect();
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
