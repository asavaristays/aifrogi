type GoogleSheetLeadCapture = {
  timestamp: string;
  channel: string;
  source: string;
  conversationId: string;
  guestName: string;
  phone: string;
  destination: string;
  status: string;
  notes: string;
};

const DEFAULT_LEADS_CAPTURE_SHEET_URL =
  process.env.LEADOS_GOOGLE_LEADS_SHEET_URL?.trim() ||
  "https://docs.google.com/spreadsheets/d/1SgTs0GxyWn9P9V576yiDNaUszlYVtcsUchzMx1XYycY/edit";
const LEADS_CAPTURE_TAB = process.env.LEADOS_GOOGLE_LEADS_TAB?.trim() || "";
const LEADS_CAPTURE_FEED_URL = process.env.LEADOS_GOOGLE_LEADS_FEED_URL?.trim() || "";

function extractSpreadsheetId(sheetUrl = "") {
  const match = String(sheetUrl).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? "";
}

function parseGoogleVisualizationResponse(raw = "") {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("invalid Google Sheets visualization payload");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeCell(cell: unknown) {
  if (!cell || typeof cell !== "object") return "";
  const record = cell as { f?: unknown; v?: unknown };
  if (record.f != null && record.f !== "") return String(record.f);
  if (record.v == null) return "";
  return String(record.v);
}

function normalizeLeadItem(item: Partial<GoogleSheetLeadCapture>): GoogleSheetLeadCapture {
  return {
    timestamp: String(item.timestamp || "").trim(),
    channel: String(item.channel || "").trim(),
    source: String(item.source || "").trim(),
    conversationId: String(item.conversationId || "").trim(),
    guestName: String(item.guestName || "").trim(),
    phone: String(item.phone || "").trim(),
    destination: String(item.destination || "").trim(),
    status: String(item.status || "").trim(),
    notes: String(item.notes || "").trim()
  };
}

function looksLikeTimestamp(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!Number.isNaN(Date.parse(trimmed))) return true;
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(trimmed);
}

function looksLikePhone(value = "") {
  return value.replace(/\D/g, "").length >= 7;
}

function isLeadCaptureRow(item: GoogleSheetLeadCapture) {
  return looksLikePhone(item.phone) && (looksLikeTimestamp(item.timestamp) || Boolean(item.channel.trim()) || Boolean(item.source.trim()));
}

async function loadFromFeedUrl(): Promise<GoogleSheetLeadCapture[]> {
  if (!LEADS_CAPTURE_FEED_URL) return [];

  try {
    const response = await fetch(LEADS_CAPTURE_FEED_URL, {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) return [];

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) return [];

    const payload = (await response.json()) as
      | { leads?: Array<Partial<GoogleSheetLeadCapture>> }
      | Array<Partial<GoogleSheetLeadCapture>>;

    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.leads) ? payload.leads : [];

    return rows.map(normalizeLeadItem).filter(isLeadCaptureRow).reverse();
  } catch {
    return [];
  }
}

async function loadFromSheetUrl(): Promise<GoogleSheetLeadCapture[]> {
  const spreadsheetId = extractSpreadsheetId(DEFAULT_LEADS_CAPTURE_SHEET_URL);
  if (!spreadsheetId) return [];

  const url = new URL(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq`);
  url.searchParams.set("tqx", "out:json");
  if (LEADS_CAPTURE_TAB) {
    url.searchParams.set("sheet", LEADS_CAPTURE_TAB);
  }

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) return [];

    const raw = await response.text();
    const payload = parseGoogleVisualizationResponse(raw) as { table?: { rows?: Array<{ c?: unknown[] | null } | null> } };
    const rows: Array<{ c?: unknown[] | null } | null> = Array.isArray(payload?.table?.rows) ? payload.table.rows : [];

    return rows
      .map((row: { c?: unknown[] | null } | null) => (Array.isArray(row?.c) ? row.c.map(normalizeCell) : []))
      .filter((cells: string[]) => cells.some((cell: string) => String(cell || "").trim()))
      .map((cells: string[]) =>
        normalizeLeadItem({
          timestamp: String(cells[0] || "").trim(),
          channel: String(cells[1] || "").trim(),
          source: String(cells[2] || "").trim(),
          conversationId: String(cells[3] || "").trim(),
          guestName: String(cells[4] || "").trim(),
          phone: String(cells[5] || "").trim(),
          destination: String(cells[6] || "").trim(),
          status: String(cells[7] || "").trim(),
          notes: String(cells[8] || "").trim()
        })
      )
      .filter(isLeadCaptureRow)
      .reverse();
  } catch {
    return [];
  }
}

export async function loadGoogleSheetLeadCaptures(): Promise<GoogleSheetLeadCapture[]> {
  const feedRows = await loadFromFeedUrl();
  if (feedRows.length) return feedRows;
  return loadFromSheetUrl();
}

export type { GoogleSheetLeadCapture };
