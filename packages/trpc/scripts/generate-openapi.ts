import { appRouter } from "../src/routers/index.js";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

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

const outPath = process.argv[2] || "dist/openapi.json";
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(doc, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
