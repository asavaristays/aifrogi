import assert from "node:assert/strict";
import test from "node:test";
import { buildPdfSourceVersion, buildSpreadsheetSourceVersion } from "../../lib/canonical-file-ingestion";

test("PDF versions bind immutable bytes and page-level extraction provenance", () => {
  const one = buildPdfSourceVersion({ fileName: "Brochure.PDF", bytes: Buffer.from("pdf-v1"), pages: ["About us", "Services"] });
  const same = buildPdfSourceVersion({ fileName: "brochure.pdf", bytes: Buffer.from("pdf-v1"), pages: ["About us", "Services"] });
  const changedBytes = buildPdfSourceVersion({ fileName: "brochure.pdf", bytes: Buffer.from("pdf-v2"), pages: ["About us", "Services"] });
  const changedExtraction = buildPdfSourceVersion({ fileName: "brochure.pdf", bytes: Buffer.from("pdf-v1"), pages: ["About us", "New services"] });
  assert.equal(one.contentDigest, same.contentDigest);
  assert.equal(one.manifestDigest, same.manifestDigest);
  assert.notEqual(one.contentDigest, changedBytes.contentDigest);
  assert.notEqual(one.manifestDigest, changedExtraction.manifestDigest);
  assert.deepEqual(one.manifest.pages.map((page) => page.pageNumber), [1, 2]);
});

test("spreadsheet versions retain exact sheet, physical row, stable key and row digest", () => {
  const one = buildSpreadsheetSourceVersion({ fileName: "services.xlsx", bytes: Buffer.from("xlsx-v1"), rowKeyColumn: "code", sheets: [{ name: "Services", rows: [{ code: "S1", name: "Design", price: 10 }, { code: "S2", name: "Build", price: 20 }] }] });
  assert.deepEqual(one.manifest.rows.map(({ sheetName, rowNumber, rowKey }) => ({ sheetName, rowNumber, rowKey })), [
    { sheetName: "Services", rowNumber: 2, rowKey: "S1" },
    { sheetName: "Services", rowNumber: 3, rowKey: "S2" },
  ]);
  const changed = buildSpreadsheetSourceVersion({ fileName: "services.xlsx", bytes: Buffer.from("xlsx-v2"), rowKeyColumn: "code", sheets: [{ name: "Services", rows: [{ code: "S1", name: "Design", price: 11 }] }] });
  assert.notEqual(one.contentDigest, changed.contentDigest);
  assert.notEqual(one.manifest.rows[0].rowDigest, changed.manifest.rows[0].rowDigest);
  assert.throws(() => buildSpreadsheetSourceVersion({ fileName: "services.xlsx", bytes: Buffer.from("x"), rowKeyColumn: "code", sheets: [{ name: "Services", rows: [{ code: "S1" }, { code: "S1" }] }] }), /DUPLICATE_ROW_KEY/);
  assert.throws(() => buildSpreadsheetSourceVersion({ fileName: "services.xlsx", bytes: Buffer.from("x"), rowKeyColumn: "code", sheets: [{ name: "Services", rows: [{ name: "No key" }] }] }), /ROW_KEY_REQUIRED/);
});
