import { appRouter } from "../src/routers/index.js";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const doc = generateOpenApiDocument(appRouter, {
  title: "KubeRocketCI Portal API",
  version: "1.0.0",
  baseUrl: "/rest",
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "OIDC idToken",
    },
  },
});

const rawPath = process.argv[2] || "dist/openapi.json";
const outPath = resolve(rawPath);
const cwd = process.cwd();

if (outPath !== cwd && !outPath.startsWith(cwd + "/")) {
  console.error(`Error: Output path must be within the project directory (${cwd})`);
  process.exit(1);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(doc, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
