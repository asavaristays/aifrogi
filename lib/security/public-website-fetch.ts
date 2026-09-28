import { lookup } from "node:dns/promises";
import type { LookupAddress, LookupAllOptions } from "node:dns";
import { BlockList, isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const denied = new BlockList();
for (const [ip, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3]] as const) denied.addSubnet(ip, bits, "ipv4");
for (const [ip, bits] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]] as const) denied.addSubnet(ip, bits, "ipv6");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");

export function isPublicWebsiteAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? !denied.check(address, "ipv4") : family === 6 && globalV6.check(address, "ipv6") && !denied.check(address, "ipv6");
}

export function publicWebsiteUrl(value: string, original?: URL) {
  const url = new URL(value, original);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80", "443"].includes(url.port))) throw new Error("Use a public HTTP(S) website without credentials or custom ports.");
  if (original && url.hostname.replace(/^www\./, "") !== original.hostname.replace(/^www\./, "")) throw new Error("Website redirected to a different domain. Use its official final address.");
  return url;
}

export async function resolvePublicWebsite(url: URL, resolver: (hostname: string, options: LookupAllOptions) => Promise<LookupAddress[]> = lookup) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await resolver(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(item => !isPublicWebsiteAddress(item.address))) throw new Error("Website must resolve only to public internet addresses.");
  return addresses[0];
}

/** Validate every redirect and pin DNS to the checked address (no rebind window).
 * No cookies, credentials, proxy inheritance or decompression; 8s total / 2MiB.
 */
export async function fetchPublicWebsiteText(value: string) {
  const original = publicWebsiteUrl(value);
  const signal = AbortSignal.timeout(8000);
  let url = original;
  for (let redirects = 0; redirects <= 5; redirects++) {
    const address = await new Promise<Awaited<ReturnType<typeof resolvePublicWebsite>>>((resolve, reject) => {
      const aborted = () => reject(new Error("Website lookup timed out."));
      signal.addEventListener("abort", aborted, { once: true });
      resolvePublicWebsite(url).then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
      if (signal.aborted) aborted();
    });
    const response = await new Promise<{ text?: string; redirect?: string }>((resolve, reject) => {
      const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
        agent: false, signal,
        // TLS still authenticates the original hostname; only its lookup is pinned.
        lookup: (_hostname, options, callback) => {
          if (typeof options === "object" && options.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        },
        headers: { Accept: "text/html,application/xml,text/xml,text/plain", "Accept-Encoding": "identity", "User-Agent": "AiFrogi-KB-Crawler/1.0" }
      }, incoming => {
        const status = incoming.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && incoming.headers.location) {
          resolve({ redirect: incoming.headers.location }); incoming.destroy(); return;
        }
        if (status < 200 || status >= 300) { reject(new Error(`Website returned HTTP ${status}.`)); incoming.destroy(); return; }
        const type = incoming.headers["content-type"] || "";
        if ((type && !/^(text\/(html|plain|xml)|application\/xml)\b/i.test(type)) || (incoming.headers["content-encoding"] && incoming.headers["content-encoding"] !== "identity")) {
          reject(new Error("Unsupported website content type or encoding.")); incoming.destroy(); return;
        }
        let bytes = 0;
        const chunks: Buffer[] = [];
        incoming.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 2 * 1024 * 1024) { reject(new Error("Website response is too large.")); incoming.destroy(); }
          else chunks.push(chunk);
        });
        incoming.on("end", () => resolve({ text: Buffer.concat(chunks).toString("utf8") }));
        incoming.on("error", reject);
        incoming.on("aborted", () => reject(new Error("Website response was interrupted.")));
      });
      request.on("error", reject);
      request.end();
    });
    if (response.text !== undefined) return response.text;
    url = publicWebsiteUrl(response.redirect!, url);
    publicWebsiteUrl(url.href, original);
  }
  throw new Error("Too many website redirects.");
}
