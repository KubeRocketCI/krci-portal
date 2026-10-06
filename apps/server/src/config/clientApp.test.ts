import fs from "fs";
import os from "os";
import path from "path";
import Fastify, { type FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerClientApp } from "./clientApp.js";

const HTML = "<!doctype html><html><body>portal</body></html>";

describe("registerClientApp", () => {
  let root: string;
  let app: FastifyInstance;

  beforeAll(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "client-dist-"));
    fs.mkdirSync(path.join(root, "assets"));
    fs.writeFileSync(path.join(root, "index.html"), HTML);
    fs.writeFileSync(
      path.join(root, "assets", "index-a1b2c3.js"),
      "export {};"
    );
    fs.writeFileSync(path.join(root, "krci-logo.svg"), "<svg/>");

    app = Fastify({ logger: false });
    registerClientApp(app, { root, apiPrefix: "/api" });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it.each([
    ["/", 200, "no-cache"],
    ["/index.html", 200, "no-cache"],
    ["/c/core/projects", 200, "no-cache"],
    ["/crds/codebases.v2.edp.epam.com", 200, "no-cache"],
    ["/assets/index-a1b2c3.js", 200, "public, max-age=31536000, immutable"],
    ["/krci-logo.svg", 200, "public, max-age=2592000"],
    ["/assets/index-missing.js", 404, "no-store"],
    ["/api/unknown", 404, undefined],
  ])("GET %s → %i, Cache-Control %s", async (url, status, cacheControl) => {
    const res = await app.inject({ method: "GET", url });

    expect(res.statusCode).toBe(status);
    expect(res.headers["cache-control"]).toBe(cacheControl);
  });

  it("serves index.html for SPA routes, also with dots in the path", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/crds/codebases.v2.edp.epam.com",
    });

    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toBe(HTML);
  });

  it("returns 404 JSON for a missing asset, not index.html", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/assets/index-missing.js",
    });

    expect(res.json()).toEqual({ error: "Not Found" });
  });

  it("keeps no-cache on a 304 revalidation of index.html", async () => {
    const first = await app.inject({ method: "GET", url: "/c/core/projects" });
    const etag = first.headers.etag as string;

    const res = await app.inject({
      method: "GET",
      url: "/c/core/projects",
      headers: { "if-none-match": etag },
    });

    expect(etag).toBeTruthy();
    expect(res.statusCode).toBe(304);
    expect(res.headers["cache-control"]).toBe("no-cache");
  });

  it("applies the same headers to HEAD requests", async () => {
    const res = await app.inject({
      method: "HEAD",
      url: "/assets/index-a1b2c3.js",
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["cache-control"]).toBe(
      "public, max-age=31536000, immutable"
    );
  });
});
