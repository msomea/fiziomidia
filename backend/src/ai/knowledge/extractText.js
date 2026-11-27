import path from "path";

/*
Shared text extraction for knowledge ingestion.
Supports .txt/.md (utf8) and .pdf (pdf-parse, optional dependency).
Accepts a Buffer + filename (used by both CLI and upload endpoint).
*/

// Markers must match what chunkText() in ingestKnowledge.js detects:
// a form feed or a line starting with "Page N".
const pageMarker = (n) => `\n\n\f\nPage ${n}\n\n`;

export const extractTextFromBuffer = async (buffer, filename) => {
  const ext = path.extname(filename || "").toLowerCase();

  if (ext === ".pdf") {
    let PDFParse;
    try {
      ({ PDFParse } = await import("pdf-parse"));
    } catch {
      throw new Error(
        "PDF extraction unavailable — install pdf-parse: npm i pdf-parse",
      );
    }
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      // Preserve page boundaries so chunks can record page numbers
      const pages = (result.text || "").split("\f");
      return pages
        .map((p, i) => `${pageMarker(i + 1)}${p}`)
        .join("")
        .trim();
    } finally {
      await parser.destroy();
    }
  }

  if ([".txt", ".md", ".markdown", ".text"].includes(ext) || !ext) {
    return buffer.toString("utf8");
  }

  throw new Error(`Unsupported file type: ${ext || "unknown"}`);
};
