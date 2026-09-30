import { createHash } from "node:crypto";

type Scalar = string | number | boolean | null;

function sha256(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fileIdentity(fileName: string) {
  const normalized = fileName.trim().replace(/\\/g, "/").split("/").pop()?.toLowerCase();
  if (!normalized) throw new Error("FILE_NAME_REQUIRED");
  return { canonicalIdentity: `file:${normalized}`, canonicalIdentityHash: sha256(normalized) };
}

export function buildPdfSourceVersion(input: { fileName: string; bytes: Buffer; pages: string[] }) {
  if (!input.fileName.toLowerCase().endsWith(".pdf")) throw new Error("PDF_EXTENSION_REQUIRED");
  if (!input.bytes.length) throw new Error("FILE_BYTES_REQUIRED");
  if (!input.pages.length) throw new Error("PDF_PAGES_REQUIRED");
  const pages = input.pages.map((text, index) => {
    const normalizedText = text.normalize("NFC").replace(/\r\n?/g, "\n");
    return { pageNumber: index + 1, textDigest: sha256(normalizedText), characterCount: normalizedText.length };
  });
  const identity = fileIdentity(input.fileName);
  const manifest = { schemaVersion: 1, mediaType: "application/pdf", byteSize: input.bytes.length, pages } as const;
  return { sourceType: "PDF" as const, ...identity, contentDigest: sha256(input.bytes), manifest, manifestDigest: sha256(stableJson(manifest)) };
}

export function buildSpreadsheetSourceVersion(input: {
  fileName: string;
  bytes: Buffer;
  rowKeyColumn: string;
  sheets: Array<{ name: string; rows: Array<Record<string, Scalar>> }>;
}) {
  if (!/\.(xlsx|xls|csv)$/i.test(input.fileName)) throw new Error("SPREADSHEET_EXTENSION_REQUIRED");
  if (!input.bytes.length) throw new Error("FILE_BYTES_REQUIRED");
  if (!input.rowKeyColumn.trim()) throw new Error("ROW_KEY_COLUMN_REQUIRED");
  if (!input.sheets.length) throw new Error("SPREADSHEET_SHEETS_REQUIRED");
  const seen = new Set<string>();
  const rows = input.sheets.flatMap((sheet) => {
    const sheetName = sheet.name.trim();
    if (!sheetName) throw new Error("SHEET_NAME_REQUIRED");
    return sheet.rows.map((row, index) => {
      const rawKey = row[input.rowKeyColumn];
      const rowKey = rawKey === null || rawKey === undefined ? "" : String(rawKey).trim();
      if (!rowKey) throw new Error(`ROW_KEY_REQUIRED:${sheetName}:${index + 2}`);
      const identity = `${sheetName}:${rowKey}`;
      if (seen.has(identity)) throw new Error(`DUPLICATE_ROW_KEY:${identity}`);
      seen.add(identity);
      const canonicalRow = Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b)));
      return { sheetName, rowNumber: index + 2, rowKey, rowDigest: sha256(stableJson(canonicalRow)) };
    });
  });
  const identity = fileIdentity(input.fileName);
  const manifest = { schemaVersion: 1, mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", byteSize: input.bytes.length, rowKeyColumn: input.rowKeyColumn, rows } as const;
  return { sourceType: "SPREADSHEET" as const, ...identity, contentDigest: sha256(input.bytes), manifest, manifestDigest: sha256(stableJson(manifest)) };
}
