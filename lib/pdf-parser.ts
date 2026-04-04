/**
 * Server-side PDF text extraction.
 * Uses createRequire so Node's native CJS loader resolves pdf-parse —
 * Turbopack never touches it, preventing the "not a function" interop bug.
 */

import { createRequire } from 'module';

// Force Node's own require() — bypasses Turbopack's module transform entirely
const _require = createRequire(import.meta.url);

type PdfParseResult = { text: string; numpages: number; info: Record<string, unknown> };
type PdfParseFn = (buf: Buffer, options?: Record<string, unknown>) => Promise<PdfParseResult>;

function getPdfParse(): PdfParseFn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = _require('pdf-parse');
  // pdf-parse@1.x exports the function directly
  if (typeof mod === 'function') return mod as PdfParseFn;
  // Defensive: handle any future wrapper
  if (typeof mod?.default === 'function') return mod.default as PdfParseFn;
  throw new Error(`pdf-parse did not export a function (got: ${typeof mod})`);
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = getPdfParse();
  const data = await pdfParse(buffer);
  return data.text.trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    return extractTextFromPDF(Buffer.from(arrayBuffer));
  }
  return file.text();
}
