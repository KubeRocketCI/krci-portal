import fs from "fs";
import os from "os";
import path from "path";
import Fastify, { type FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fromMonorepoRoot } from "@/paths";
import { OPENAPI_DOCUMENT_OPTIONS } from "@my-project/trpc";
import { createRegisterOpenApiOptions } from "./__fixtures__/registerOpenApiOptions.js";
import { registerClientApp } from "./clientApp.js";
import { registerInternalEventsRoute } from "./internalEvents.js";
import { registerOpenApi } from "./openapi.js";

const INDEX_HTML = "<!doctype html><html><body>portal</body></html>";

const NOT_FOUND_ENVELOPE = {
  error: { code: "NOT_FOUND", message: "Not Found" },
};

/** Operation keys of an OpenAPI 3.0 Path Item, as HTTP methods. */
const OPERATION_METHODS = [
  "GET",
  "PUT",
  "POST",
  "DELETE",
  "OPTIONS",
  "HEAD",
  "PATCH",
  "TRACE",
] as const;

interface OpenApiDocument {
  paths: Record<string, Record<string, unknown>>;
}

/** The route groups `production/index.ts` registers. */
function buildApp(clientRoot: string): FastifyInstance {
  const app = Fastify({ logger: false });
  const options = createRegisterOpenApiOptions();

  registerClientApp(app, { root: clientRoot, apiPrefix: "/api" });
  registerInternalEventsRoute(app, {
    notificationsStore: options.notificationsStore,
  });
  registerOpenApi(app, options);

  return app;
}

/** `METHOD /rest/...` of every operation of the document that no route serves. */
function unservedOperations(
  app: FastifyInstance,
  document: OpenApiDocument
): string[] {
  const unserved: string[] = [];

  for (const [documentPath, pathItem] of Object.entries(document.paths)) {
    // `{resultUid}` in the document is `:resultUid` in the route.
    const url =
      OPENAPI_DOCUMENT_OPTIONS.baseUrl +
      documentPath.replace(/\{(\w+)\}/g, ":$1");

    for (const method of OPERATION_METHODS) {
      if (pathItem[method.toLowerCase()] === undefined) continue;
      if (!app.hasRoute({ method, url })) {
        unserved.push(`${method} ${url}`);
      }
    }
  }

  return unserved;
}

let clientRoot: string;
let app: FastifyInstance;

beforeAll(async () => {
  clientRoot = fs.mkdtempSync(path.join(os.tmpdir(), "client-dist-"));
  fs.writeFileSync(path.join(clientRoot, "index.html"), INDEX_HTML);
  app = buildApp(clientRoot);
  await app.ready();
});

afterAll(async () => {
  await app.close();
  fs.rmSync(clientRoot, { recursive: true, force: true });
});

describe("REST routes of the OpenAPI document", () => {
  it("serves every operation of the document the server publishes", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/openapi.json",
    });

    expect(res.statusCode).toBe(200);
    expect(unservedOperations(app, res.json<OpenApiDocument>())).toEqual([]);
  });

  it("serves every operation of packages/trpc/api/openapi.json", () => {
    const document: OpenApiDocument = JSON.parse(
      fs.readFileSync(
        fromMonorepoRoot("packages", "trpc", "api", "openapi.json"),
        "utf8"
      )
    );

    expect(unservedOperations(app, document)).toEqual([]);
  });
});

describe("unknown paths under /rest/", () => {
  it.each([
    ["GET", "/rest/v1/definitely-not-a-route"],
    ["POST", "/rest/v1/definitely-not-a-route"],
    ["GET", "/rest/"],
    ["GET", "/rest/v2/pipeline-runs"],
    ["GET", "/rest/v1/pipelineruns/stop"],
    ["DELETE", "/rest/v1/config"],
  ] as const)(
    "%s %s answers 404 with the REST envelope",
    async (method, url) => {
      const res = await app.inject({ method, url });

      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.json()).toEqual(NOT_FOUND_ENVELOPE);
    }
  );

  it.each(["/c/core/projects", "/restore"])(
    "GET %s outside /rest/ gets index.html",
    async (url) => {
      const res = await app.inject({ method: "GET", url });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(INDEX_HTML);
    }
  );
});

describe("GET /rest/v1/openapi.json in production", () => {
  let productionApp: FastifyInstance;

  beforeAll(async () => {
    vi.stubEnv("NODE_ENV", "production");
    productionApp = buildApp(clientRoot);
    vi.unstubAllEnvs();
    await productionApp.ready();
  });

  afterAll(async () => {
    await productionApp.close();
  });

  it("answers 404 with the REST envelope, not index.html", async () => {
    const res = await productionApp.inject({
      method: "GET",
      url: "/rest/v1/openapi.json",
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual(NOT_FOUND_ENVELOPE);
  });
});
