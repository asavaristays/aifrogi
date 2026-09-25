import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { HOTELGPT_MASTER_QUICK_REPLIES, installHotelQuickReplyDefaults } from "../../lib/hotelgpt-quick-replies";
import { inStayTicketAcknowledgement, inStayTicketReference } from "../../lib/in-stay-ticket";

const source=(path:string)=>readFileSync(new URL(`../../${path}`,import.meta.url),"utf8");

test("saved reply defaults are Pre-Stay only and independently copied",()=>{
  assert.ok(HOTELGPT_MASTER_QUICK_REPLIES.length>=5);
  assert.ok(HOTELGPT_MASTER_QUICK_REPLIES.every(item=>item.journey==="PRE_STAY"));
  assert.ok(HOTELGPT_MASTER_QUICK_REPLIES.every(item=>item.mode==="STAFF_TRIGGERED"));
  const installed=installHotelQuickReplyDefaults();
  assert.notEqual(installed[0].id,HOTELGPT_MASTER_QUICK_REPLIES[0].id);
  assert.equal(installed[0].masterId,HOTELGPT_MASTER_QUICK_REPLIES[0].masterId);
});

test("automatic In-Stay acknowledgement is deterministic and includes a ticket",()=>{
  assert.equal(inStayTicketReference("lead_camp_12345678"),"STAY-12345678");
  assert.equal(inStayTicketAcknowledgement("lead_camp_12345678"),"Your request has been recorded. Ticket no. STAY-12345678. The front desk will reply here.");
  const route=source("app/api/public/website-bot/[slug]/route.ts");
  assert.match(route,/inStayTicketAcknowledgement/);
  assert.doesNotMatch(route,/inStaySmartContent/);
});

test("In-Stay rejects saved actions and cannot resume AI",()=>{
  const route=source("app/api/leads/[id]/messages/route.ts");
  assert.match(route,/AI cannot be resumed for In-Stay tickets/);
  assert.match(route,/In-Stay uses front-desk free-text replies only/);
  assert.match(route,/journey === "PRE_STAY"/);
  assert.match(route,/permittedRoles\.includes/);
});

test("In-Stay desk is ticket-led and uses copy-only staff text",()=>{
  const inbox=source("components/whatsapp/whatsapp-bot-client.tsx");
  assert.match(inbox,/inStayTicketReference\(activeLead\.id\)/);
  assert.match(inbox,/Front desk copy list/);
  assert.match(inbox,/navigator\.clipboard\.writeText/);
  assert.match(inbox,/!serviceDeskMode \? <div className="inbox-suggestion/);
  assert.match(inbox,/!serviceDeskMode \? <Button className="inbox-action-resume"/);
});

test("resident mode hides legacy smart actions and shows verified uploads",()=>{
  const embed=source("components/website-bot/website-bot-embed.tsx");
  const resident=source("components/website-bot/hotelgpt-resident-entry.tsx");
  assert.match(embed,/!residentMode&&message\.role==="bot"&&message\.smartContent\?\.quickReplies/);
  assert.match(embed,/text:`\$\{sender\} · \$\{time\}\\n\$\{cleanBody\}`/);
  assert.match(resident,/showcaseItems=\{showcaseItems\}/);
});
