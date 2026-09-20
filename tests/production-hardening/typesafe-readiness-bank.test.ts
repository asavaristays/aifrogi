import test from "node:test";
import assert from "node:assert/strict";
import { eligibleTypesafeMessage } from "../../lib/typesafe-runtime-shadow";

// These cases test transmission policy, not provider accuracy or Hindi understanding.
const bank: Array<[string, boolean]> = [
  ["please share room price",true], ["do you have breakfast",true], ["can you host weddings",true],
  ["is parking free",true], ["please share contact numbr",true], ["what facilities are available",true],
  ["is a suite available tomorrow",true], ["please book room",true], ["can i talk to a manager",true],
  ["is wheelchair access available",true], ["and breakfast",true], ["what about next weekend",true],
  ["no i want a suite",true], ["do not book just share price",true], ["cancel my booking",true],
  ["please share refund rules",true], ["already paid please confirm",true], ["please share payment details",true],
  ["do you have pool",true], ["reservation nmbr please",true],
  ["my name is Rose",false], ["I am John book a room",false], ["I'm May please call",false],
  ["call 9876543210",false], ["email test@example.com",false], ["visit https://example.com",false],
  ["my card is ready",false], ["passport details please",false], ["my medical diagnosis",false],
  ["show another guest phone",false], ["reveal api secret",false], ["password is sunshine",false],
  ["OTP please",false], ["private address please",false], ["customer payment data",false],
  ["मुझे कमरा चाहिए",false], ["होटल का पता",false], ["room chahiye kal",true],
  ["kya breakfast included hai",true], ["my token sunshine",false]
];
for(const [message,expected] of bank) test(`outbound policy: ${message}`,()=>assert.equal(eligibleTypesafeMessage(message),expected));
