import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import path from "node:path";

// Country-only lookup runs locally. Visitor IPs are never sent to an external service.
let tables: { v4: Buffer; v6: Buffer } | null = null;
function countryTables() {
  if (!tables) tables = {
    v4: readFileSync(path.join(process.cwd(), "data", "pricing-country-ipv4.bin")),
    v6: readFileSync(path.join(process.cwd(), "data", "pricing-country-ipv6.bin"))
  };
  return tables;
}

function ipv6Number(ip: string) {
  const [left, right = ""] = ip.split("::");
  const parts = (value: string) => value ? value.split(":") : [];
  const a = parts(left), b = parts(right);
  const groups = ip.includes("::") ? [...a, ...Array(8 - a.length - b.length).fill("0"), ...b] : a;
  return groups.reduce((number, group) => (number << BigInt("16")) + BigInt(`0x${group}`), BigInt("0"));
}

function lookup(table: Buffer, target: bigint, width: number) {
  const recordSize = width * 2 + 2;
  const number = (offset: number) => width === 4 ? BigInt(table.readUInt32BE(offset)) : (table.readBigUInt64BE(offset) << BigInt("64")) + table.readBigUInt64BE(offset + 8);
  let low = 0, high = table.length / recordSize - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2), offset = middle * recordSize;
    if (target < number(offset)) high = middle - 1;
    else if (target > number(offset + width)) low = middle + 1;
    else return table.toString("ascii", offset + width * 2, offset + recordSize);
  }
  return null;
}

export function pricingCountryForIp(value: string | null) {
  let ip = value?.trim() || "";
  if (/^::ffff:\d+\./i.test(ip)) ip = ip.slice(7);
  const version = isIP(ip);
  if (!version) return null;
  try {
    const db = countryTables();
    if (version === 4) return lookup(db.v4, ip.split(".").reduce((number, octet) => (number << BigInt("8")) + BigInt(octet), BigInt("0")), 4);
    // IPv4-mapped IPv6 can also use hexadecimal notation.
    const number = ipv6Number(ip);
    return number >> BigInt("32") === BigInt("0xffff") ? lookup(db.v4, number & BigInt("0xffffffff"), 4) : lookup(db.v6, number, 16);
  } catch {
    return null;
  }
}
