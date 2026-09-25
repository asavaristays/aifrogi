import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { HOTELGPT_MASTER_QUICK_REPLIES, installHotelQuickReplyDefaults } from "../../lib/hotelgpt-quick-replies";

const source=(path:string)=>readFileSync(new URL(`../../${path}`,import.meta.url),"utf8");

test("master hospitality replies are useful, bounded and independently copied",()=>{
  assert.ok(HOTELGPT_MASTER_QUICK_REPLIES.length>=15&&HOTELGPT_MASTER_QUICK_REPLIES.length<=20);
  assert.ok(HOTELGPT_MASTER_QUICK_REPLIES.some(item=>item.journey==="PRE_STAY"));
  assert.ok(HOTELGPT_MASTER_QUICK_REPLIES.some(item=>item.journey==="IN_STAY"&&item.status==="COMPLETED"));
  assert.ok(HOTELGPT_MASTER_QUICK_REPLIES.every(item=>item.mode==="STAFF_TRIGGERED"));
  const installed=installHotelQuickReplyDefaults();
  assert.notEqual(installed[0].id,HOTELGPT_MASTER_QUICK_REPLIES[0].id);
  assert.equal(installed[0].masterId,HOTELGPT_MASTER_QUICK_REPLIES[0].masterId);
});

test("automatic in-stay acknowledgement confirms receipt only",()=>{
  const route=source("app/api/public/website-bot/[slug]/route.ts");
  assert.match(route,/front desk has received your request\. We will update you here\./);
  assert.doesNotMatch(route,/will start resolving it shortly/);
});

test("staff saved replies enforce journey, role, audit and explicit completion",()=>{
  const route=source("app/api/leads/[id]/messages/route.ts");
  assert.match(route,/item\.journey === journey/);
  assert.match(route,/permittedRoles\.includes/);
  assert.match(route,/approvedReply\.status !== "COMPLETED"/);
  assert.match(route,/HOTELGPT_QUICK_REPLY_SENT/);
  assert.match(route,/originalApprovedText/);
  assert.match(route,/finalSentText/);
});

test("guest rendering removes duplicated front-desk prefixes and shows sender with time",()=>{
  const embed=source("components/website-bot/website-bot-embed.tsx");
  assert.match(embed,/front desk\\s\*\(\?:update\)\?/i);
  assert.match(embed,/text:`\$\{sender\} · \$\{time\}\\n\$\{cleanBody\}`/);
});

test("resolved HotelGPT cases offer feedback instead of stale operational actions",()=>{
  const inbox=source("components/whatsapp/whatsapp-bot-client.tsx");
  assert.match(inbox,/resolvedHotelCase \? item\.status === "FEEDBACK" : item\.status !== "FEEDBACK"/);
  assert.match(inbox,/resolvedHotelCase\?\["FEEDBACK"\]/);
});
