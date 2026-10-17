import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { currencyForCountry, formatPricingAmount, INR_ONLY_RATES, parsePricingRates } from "../../lib/pricing-currency";
import { pricingCountryForIp } from "../../lib/pricing-country";

const rates = { INR: 1, CAD: 0.01479, USD: 0.0104, AED: 0.03819 };
const now = new Date("2026-10-04T12:00:00Z");
const reference = ["CAD", "USD", "AED"].map(quote => ({ date: "2026-10-04", base: "INR", quote, rate: rates[quote as keyof typeof rates] }));

test("Country lookup selects Canada, USA and UAE currencies without external visitor lookup", () => {
  for (const [ip, country, currency] of [["24.48.0.1", "CA", "CAD"], ["8.8.8.8", "US", "USD"], ["5.30.0.1", "AE", "AED"]]) {
    assert.equal(pricingCountryForIp(ip), country);
    assert.equal(currencyForCountry(country), currency);
  }
  assert.equal(currencyForCountry("GB"), "INR");
  assert.equal(currencyForCountry(null), "INR");
});

test("IPv6 and IPv4-mapped addresses work; invalid and local addresses fall back", () => {
  assert.equal(pricingCountryForIp("2607:f798:18:10::1"), "CA");
  assert.equal(pricingCountryForIp("2a00:f28:0:1::1"), "AE");
  assert.equal(pricingCountryForIp("::ffff:8.8.8.8"), "US");
  assert.equal(pricingCountryForIp("::ffff:808:808"), "US");
  for (const ip of [null, "", "not-an-ip", "8.8.8.8, 5.30.0.1", "127.0.0.1", "10.0.0.1", "::1", "8.8.8.999"]) assert.equal(pricingCountryForIp(ip), null);
});

test("Conversions preserve INR value with explicit foreign currency codes and two decimal places", () => {
  assert.equal(formatPricingAmount(14500, "INR", rates), "₹14,500");
  assert.equal(formatPricingAmount(14500, "CAD", rates)?.replace(/\s/g, " "), "CAD 214.46");
  assert.equal(formatPricingAmount(16500, "USD", rates)?.replace(/\s/g, " "), "USD 171.60");
  assert.equal(formatPricingAmount(14500, "AED", rates)?.replace(/\s/g, " "), "AED 553.76");
  assert.equal(formatPricingAmount(399, "USD", rates)?.replace(/\s/g, " "), "USD 4.15");
  assert.equal(formatPricingAmount(0, "CAD", rates)?.replace(/\s/g, " "), "CAD 0.00");
  assert.equal(formatPricingAmount(14500, "CAD", INR_ONLY_RATES), null);
});

test("Missing, stale, future, non-finite and invalid reference rates cannot become displayed prices", () => {
  assert.deepEqual(parsePricingRates(reference, now)?.rates, rates);
  assert.equal(parsePricingRates(reference.slice(1), now), null);
  assert.equal(parsePricingRates({}, now), null);
  for (const rate of [0, -1, Infinity, NaN, "0.1"]) assert.equal(parsePricingRates([{ ...reference[0], rate }, ...reference.slice(1)], now), null);
  for (const date of ["2026-09-20", "2026-10-05", "2026-02-30", "unknown"]) assert.equal(parsePricingRates([{ ...reference[0], date }, ...reference.slice(1)], now), null);
});

test("Country tables contain valid, sorted and disjoint ranges", () => {
  for (const [version, width] of [[4, 4], [6, 16]]) {
    const data = readFileSync(`data/pricing-country-ipv${version}.bin`), size = width * 2 + 2;
    assert.equal(data.length % size, 0);
    let prior = -BigInt("1");
    const number = (offset: number) => width === 4 ? BigInt(data.readUInt32BE(offset)) : (data.readBigUInt64BE(offset) << BigInt("64")) + data.readBigUInt64BE(offset + 8);
    for (let offset = 0; offset < data.length; offset += size) {
      const start = number(offset), end = number(offset + width);
      assert(start > prior && end >= start);
      prior = end;
      assert(["CA", "US", "AE"].includes(data.toString("ascii", offset + width * 2, offset + size)));
    }
  }
});
