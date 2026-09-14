import { appRouter } from "../src/routers/index.js";
import { OPENAPI_DOCUMENT_OPTIONS, rewriteErrorEnvelopeSchemas } from "../src/utils/openapi/index.js";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, relative, isAbsolute } from "node:path";

const doc = generateOpenApiDocument(appRouter, OPENAPI_DOCUMENT_OPTIONS);

rewriteErrorEnvelopeSchemas(doc);

const rawPath = process.argv[2] || "dist/openapi.json";
const outPath = resolve(rawPath);
const cwd = process.cwd();
const relPath = relative(cwd, outPath);

if (relPath.startsWith("..") || isAbsolute(relPath)) {
  console.error(`Error: Output path must be within the project directory (${cwd})`);
  process.exit(1);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(doc, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
