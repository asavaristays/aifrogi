import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { HOTELGPT_FLOW_LIBRARY, matchPublishedHotelFlow } from "../../lib/hotelgpt-flow-library";
import { newTenantFlow, normalizeTenantFlow } from "../../lib/tenant-flow-intelligence";

test("HotelGPT library separates three public and three verified-stay journeys",()=>{
  assert.equal(HOTELGPT_FLOW_LIBRARY.length,6);
  assert.equal(HOTELGPT_FLOW_LIBRARY.filter(item=>item.journey==="PRE_STAY"&&item.access==="PUBLIC").length,3);
  assert.equal(HOTELGPT_FLOW_LIBRARY.filter(item=>item.journey==="IN_STAY"&&item.access==="VERIFIED_STAY").length,3);
  assert.ok(HOTELGPT_FLOW_LIBRARY.every(item=>item.requiredKnowledge.length&&item.smartOutputs.length&&item.stages.length>=4));
});

test("hotel master templates create independent backward-compatible drafts",()=>{
  const first=newTenantFlow("HOTEL_FIND_STAY"),second=newTenantFlow("HOTEL_FIND_STAY");
  assert.notEqual(first.id,second.id);
  assert.equal(first.botCategory,"STAY");
  assert.equal(first.journey,"PRE_STAY");
  assert.equal(first.status,"DRAFT");
  assert.equal(normalizeTenantFlow(first)?.originTemplateId,"hotel-pre-find-stay");
  assert.equal(newTenantFlow("SERVICE_ADVISOR").journey,undefined);
});

test("runtime matching never crosses Pre-Stay and In-Stay boundaries",()=>{
  const pre={...newTenantFlow("HOTEL_FIND_STAY"),status:"PUBLISHED" as const};
  const stay={...newTenantFlow("HOTEL_REPORT_PROBLEM"),status:"PUBLISHED" as const};
  assert.equal(matchPublishedHotelFlow([pre,stay],"PRE_STAY","Can I book a room?")?.flow.id,pre.id);
  assert.equal(matchPublishedHotelFlow([pre,stay],"IN_STAY","The AC is not working")?.flow.id,stay.id);
  assert.equal(matchPublishedHotelFlow([pre],"IN_STAY","Can I book a room?"),null);
});

test("admin library, owner installation and public-menu boundary are wired",()=>{
  const admin=readFileSync(resolve(process.cwd(),"app/admin/flow-library/page.tsx"),"utf8");
  const route=readFileSync(resolve(process.cwd(),"app/api/flow-intelligence/route.ts"),"utf8");
  const bot=readFileSync(resolve(process.cwd(),"app/api/public/website-bot/[slug]/route.ts"),"utf8");
  const widget=readFileSync(resolve(process.cwd(),"components/website-bot/website-bot-embed.tsx"),"utf8");
  assert.match(admin,/Pre-Stay templates may create public menu entries/);
  assert.match(route,/install_hotel_defaults/);
  assert.match(route,/current\.journey !== "IN_STAY"/);
  assert.match(route,/hasTrustedSameOrigin\(request\)/);
  assert.match(bot,/matchPublishedHotelFlow/);
  assert.match(widget,/smartContent\.quickReplies/);
});
