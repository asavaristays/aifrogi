import ExcelJS from "exceljs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const requestedUrl = process.argv[2];
const outputPath = resolve(process.argv[3] || "output/website-crawl.xlsx");
const maxPages = Math.min(120, Math.max(1, Number(process.argv[4] || 120)));
if (!requestedUrl) throw new Error("Usage: node scripts/crawl-website-to-categorized-excel.mjs <url> [output.xlsx] [max-pages]");

const AGENT = "AiFrogi-Categorized-Excel-Crawler/1.0";
const excluded = /\.(?:avif|bmp|css|docx?|gif|ico|jpe?g|js|json|mp3|mp4|mov|pdf|png|pptx?|svg|webm|webp|xlsx?|xml|zip)(?:\?|$)/i;
const decode = (value = "") => value
  .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
const clean = (html = "") => decode(html
  .replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ").replace(/<!--([\s\S]*?)-->/g, " ")
  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const categoryFor = (url, title) => {
  const value = `${new URL(url).pathname} ${title}`.toLowerCase();
  const rules = [
    ["Urs & Events", /\burs\b|festival|event|rajab|qul\b/],
    ["Visiting & Ceremonies", /ceremon|visiting|opening|closing|darshan|khidmat|roshnee|karka|langer|langar|dargah-shrine/],
    ["Offerings & Services", /offering|chadar|chaddar|flowers|attar|mannat|taweez|service/],
    ["Donations & Payments", /donat|bank account|ifsc|paytm|google pay|payment/],
    ["Contact & Location", /contact|address|location|direction|phone|mobile|email/],
    ["Accommodation & Transport", /guest house|accommodation|hotel|transport|airport|railway|\/host\//],
    ["Shrine & History", /shrine|dargah|monument|history|architecture|gate/],
    ["Biography & Khadims", /biograph|gharib nawaz|khwaja|khadim|descendant/],
    ["Religious Teachings", /islam|sufism|sufi|saying|teaching|quran|hadith|prayer/]
  ];
  return rules.find(([, pattern]) => pattern.test(value))?.[0] || "General Information";
};
const riskFor = (text) => /bank|account|ifsc|upi|paytm|google pay|donat|payment/i.test(text) ? "Payment details — verify before use"
  : /cure|guarantee|miracle|blessing|wish|mannat|taweez/i.test(text) ? "Religious/outcome claim — client review"
  : /date|timing|opening|closing|calendar|urs|rajab/i.test(text) ? "Time-sensitive — verify date/timing"
  : "";

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow", headers: { "User-Agent": AGENT, Accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.7" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { body: await response.text(), contentType: response.headers.get("content-type") || "", finalUrl: response.url };
}
const normalized = (raw, base, allowedOrigin) => {
  try {
    const url = new URL(raw, base); url.hash = "";
    if (!/^https?:$/.test(url.protocol) || url.origin !== allowedOrigin || excluded.test(url.pathname + url.search)) return null;
    for (const [key, value] of [...url.searchParams.entries()]) if (!value || /^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    return url.toString().replace(/\/$/, "") || url.origin;
  } catch { return null; }
};
const linksFromHtml = (html, base, origin) => [...html.matchAll(/<a\b[^>]*?href\s*=\s*["']([^"']+)["']/gi)]
  .map((match) => normalized(decode(match[1]), base, origin)).filter(Boolean);
const sectionsFromHtml = (html) => {
  const body = html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<(?:header|nav|footer)\b[\s\S]*?<\/(?:header|nav|footer)>/gi, " ");
  const matches = [...body.matchAll(/<(h[1-6]|p|li|td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  let heading = "Page content"; const rows = [];
  for (const match of matches) {
    const value = clean(match[2]); if (value.length < 3) continue;
    if (/^h[1-6]$/i.test(match[1])) { heading = value.slice(0, 250); continue; }
    if (value.length >= 20) rows.push({ heading, text: value.slice(0, 4000) });
  }
  const seen = new Set();
  return rows.filter((row) => { const key = row.text.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
};

const first = await fetchText(requestedUrl);
const root = new URL(first.finalUrl); const origin = root.origin; const start = normalized(first.finalUrl, first.finalUrl, origin);
const queue = [start]; const queued = new Set(queue); const pages = []; const failures = [];
for (const sitemapUrl of [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/wp-sitemap.xml`]) {
  try {
    const { body } = await fetchText(sitemapUrl);
    const sitemapQueue = [...body.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((m) => decode(m[1].trim()));
    for (let i = 0; i < sitemapQueue.length && i < 50; i++) {
      const candidate = sitemapQueue[i];
      if (/\.xml(?:\?|$)/i.test(candidate)) {
        try { const child = await fetchText(candidate); sitemapQueue.push(...[...child.body.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((m) => decode(m[1].trim()))); } catch { /* page discovery will continue */ }
      } else {
        const url = normalized(candidate, origin, origin); if (url && !queued.has(url)) { queued.add(url); queue.push(url); }
      }
    }
  } catch { /* homepage links are the fallback */ }
}

for (let cursor = 0; cursor < queue.length && pages.length < maxPages; cursor += 1) {
  const url = queue[cursor];
  try {
    const path = new URL(url).pathname;
    if (/^\/(?:author|category)\//i.test(path) || /^\/20\d{2}(?:\/|$)/.test(path)) continue;
    const fetched = url === start && cursor === 0 ? first : await fetchText(url);
    if (!/text\/html/i.test(fetched.contentType) && fetched.contentType) continue;
    for (const link of linksFromHtml(fetched.body, fetched.finalUrl, origin)) if (!queued.has(link) && queue.length < maxPages * 8) { queued.add(link); queue.push(link); }
    const title = clean(fetched.body.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || new URL(fetched.finalUrl).pathname);
    const text = clean(fetched.body); if (text.length < 100) { failures.push({ url, reason: "Insufficient readable text" }); continue; }
    const category = categoryFor(fetched.finalUrl, title);
    pages.push({ url: fetched.finalUrl, title, category, text: text.slice(0, 30000), sections: sectionsFromHtml(fetched.body), risk: riskFor(text) });
  } catch (error) { failures.push({ url, reason: error instanceof Error ? error.message : String(error) }); }
}

const crawledAt = new Date().toISOString(); const workbook = new ExcelJS.Workbook();
workbook.creator = "AiFrogi"; workbook.created = new Date();
const addSheet = (name, columns, rows) => {
  const sheet = workbook.addWorksheet(name); sheet.columns = columns.map(([header, key, width]) => ({ header, key, width }));
  sheet.views = [{ state: "frozen", ySplit: 1 }]; sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + Math.min(columns.length, 26))}1` };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF584514" } };
  for (const row of rows) sheet.addRow(row); sheet.eachRow((row, n) => { if (n > 1) row.alignment = { vertical: "top", wrapText: true }; });
  return sheet;
};
addSheet("Crawl Summary", [["Field","field",28],["Value","value",95]], [
  { field: "Requested URL", value: requestedUrl }, { field: "Resolved website", value: origin }, { field: "Crawled at", value: crawledAt },
  { field: "Readable pages", value: pages.length }, { field: "Failed/skipped URLs", value: failures.length },
  { field: "Status", value: "Draft website extraction — client verification required before bot publication" }
]);
addSheet("Page Register", [["Category","category",28],["Page title","title",45],["Source URL","url",70],["Review flag","risk",38],["Crawled at","crawledAt",25]], pages.map((p) => ({ ...p, crawledAt })));
const contentRows = pages.flatMap((page) => page.sections.map((section, index) => ({ category: page.category, pageTitle: page.title, heading: section.heading, content: section.text, sourceUrl: page.url, reviewFlag: riskFor(section.text), approval: "Pending client review", item: index + 1 })));
addSheet("Categorized Content", [["Category","category",28],["Page title","pageTitle",40],["Section","heading",38],["Extracted content","content",100],["Source URL","sourceUrl",65],["Review flag","reviewFlag",38],["Approval","approval",24]], contentRows);
for (const category of [...new Set(contentRows.map((row) => row.category))]) {
  const safeName = category.slice(0, 31);
  addSheet(safeName, [["Page title","pageTitle",40],["Section","heading",38],["Extracted content","content",100],["Source URL","sourceUrl",65],["Review flag","reviewFlag",38],["Approval","approval",24]], contentRows.filter((row) => row.category === category));
}
addSheet("Review Queue", [["Category","category",28],["Page title","pageTitle",40],["Section","heading",38],["Extracted content","content",100],["Source URL","sourceUrl",65],["Reason","reviewFlag",40],["Client correction","correction",45],["Approval","approval",22]], contentRows.filter((row) => row.reviewFlag).map((row) => ({ ...row, correction: "" })));
addSheet("Fetch Failures", [["URL","url",75],["Reason","reason",60]], failures);
for (const sheet of workbook.worksheets) { sheet.properties.defaultRowHeight = 30; sheet.getRow(1).height = 34; }
await mkdir(resolve(outputPath, ".."), { recursive: true }); await workbook.xlsx.writeFile(outputPath);
console.log(JSON.stringify({ outputPath, requestedUrl, resolvedOrigin: origin, pages: pages.length, sections: contentRows.length, reviewItems: contentRows.filter((r) => r.reviewFlag).length, failures: failures.length, categories: Object.fromEntries([...new Set(pages.map((p) => p.category))].sort().map((category) => [category, pages.filter((p) => p.category === category).length])) }, null, 2));
