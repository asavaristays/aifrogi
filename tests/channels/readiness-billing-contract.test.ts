import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {verifyReadinessPaymentTicket,assertReadinessCapturedPayment,signedReadinessEvent} from "../../lib/readiness-billing-contract";
const secret="synthetic-billing-bridge-secret-32-characters";
const ticket={product:"AI_READINESS" as const,quoteRef:"quote-1",quoteHash:"a".repeat(64),organizationRef:"org-1",propertyRef:"property-1",amountMinor:99900,currency:"INR" as const,expiresAt:"2030-01-01T00:00:00.000Z"};
function sign(value:unknown){const body=Buffer.from(JSON.stringify(value)).toString("base64url");return `${body}.${createHmac("sha256",secret).update(`readiness-quote-v1\n${body}`).digest("hex")}`;}
test("Readiness billing trusts only signed, unexpired ₹999 quotes",()=>{
 assert.deepEqual(verifyReadinessPaymentTicket(sign(ticket),secret),ticket);
 for(const override of [{amountMinor:1},{currency:"USD"},{product:"AI_STARTER_MONTHLY"},{expiresAt:"2020-01-01T00:00:00.000Z"}])assert.throws(()=>verifyReadinessPaymentTicket(sign({...ticket,...override}),secret));
 assert.throws(()=>verifyReadinessPaymentTicket(sign(ticket),"another-synthetic-billing-key-with-length"));
});
test("captured payment must bind exact property, amount, scope and provider order",()=>{
 const order={id:"order-1",amount:99900,amount_paid:99900,currency:"INR",notes:{product:"AI_READINESS",quoteRef:ticket.quoteRef,quoteHash:ticket.quoteHash,organizationId:ticket.organizationRef,propertyRef:ticket.propertyRef}};
 const payment={id:"pay-1",order_id:"order-1",amount:99900,currency:"INR",status:"captured",captured:true};
 assert.doesNotThrow(()=>assertReadinessCapturedPayment(ticket,order,payment));
 for(const override of [{captured:false},{amount:1},{order_id:"other"},{status:"authorized"}])assert.throws(()=>assertReadinessCapturedPayment(ticket,order,{...payment,...override}));
 assert.throws(()=>assertReadinessCapturedPayment(ticket,{...order,notes:{...order.notes,propertyRef:"other"}},payment));
 assert.equal(signedReadinessEvent("{}",secret).path,"/internal/v1/billing-entitlements");
});
