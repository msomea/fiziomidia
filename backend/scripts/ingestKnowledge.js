#!/usr/bin/env node
/*
Knowledge ingestion CLI.

Usage:
  node scripts/ingestKnowledge.js --file <path> --meta <meta.json>

meta.json shape:
{
  "documentId": "FM-KB-MS-0001",
  "title": "Low Back Pain — Patient Guide",
  "specialty": "musculoskeletal",
  "conditionTags": ["low-back-pain"],
  "language": "en",
  "documentType": "patient-guide",
  "targetAudience": ["patients"],
  "source": {
    "organization": "WHO",
    "documentTitle": "...",
    "url": "https://...",
    "publicationDate": "2024-01-01",
    "licence": "CC BY-NC-SA 3.0 IGO"
  },
  "fileRef": "optional/path/or/r2-key",
  "status": "discovered"
}

Supported input: .txt, .md, .pdf (pdf via pdf-parse if installed).
Documents land as "discovered" — they are NOT retrievable until an
admin moves them through the review workflow (see AIKnowledgeDocument).
*/

import fs from "fs/promises";
import mongoose from "mongoose";
import { ingestDocument } from "../src/ai/knowledge/ingestKnowledge.js";
import { extractTextFromBuffer } from "../src/ai/knowledge/extractText.js";
import { connectDB } from "../src/config/db.js";

const parseArgs = (argv) => {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return args;
};

const extractText = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return extractTextFromBuffer(buffer, filePath);
};

const main = async () => {
  const args = parseArgs(process.argv);
  if (!args.file || !args.meta) {
    console.error("Usage: node scripts/ingestKnowledge.js --file <path> --meta <meta.json>");
    process.exit(1);
  }

  const meta = JSON.parse(await fs.readFile(args.meta, "utf8"));
  const text = await extractText(args.file);

  await connectDB();
  console.log("MongoDB connected");

  const { document, chunkCount } = await ingestDocument({
    ...meta,
    text,
    fileRef: meta.fileRef || args.file,
  });

  console.log(`Ingested ${document.documentId}: "${document.title}"`);
  console.log(`  chunks: ${chunkCount} | status: ${document.status} | approvedForAI: ${document.approvedForAI}`);
  console.log("  → NOT retrievable until status=approved and approvedForAI=true");

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
