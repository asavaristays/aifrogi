declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfParseOptions = { max?: number };
  type PdfParseResult = { text?: string; numpages?: number; info?: unknown; metadata?: unknown };
  export default function parsePdf(buffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
}
