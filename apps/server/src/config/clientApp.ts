import path from "path";
import FastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";

// Vite default assetsDir; apps/client/vite.config.ts sets none.
const ASSETS_DIR_NAME = "assets";
const ASSETS_URL_PREFIX = `/${ASSETS_DIR_NAME}/`;

// Vite names every file under assets/ by its content hash: a changed file gets a new name.
const CACHE_HASHED_ASSET = "public, max-age=31536000, immutable";
// index.html names the current asset files: revalidated on every load (ETag, 304).
const CACHE_HTML = "no-cache";
// Files from apps/client/public keep their names: rename a file when its content changes.
const CACHE_PUBLIC_FILE = "public, max-age=2592000";
const CACHE_NOT_FOUND = "no-store";

export interface ClientAppOptions {
  /** Directory with the client build (index.html, assets/, public files). */
  root: string;
  /** URL prefix of the API; unknown paths under it return 404 JSON. */
  apiPrefix: string;
}

/**
 * Serves the client build and the SPA fallback.
 *
 * Cache-Control is selected by the file sent, not by the URL: the SPA fallback sends
 * index.html (no-cache) for any route; only files under assets/ get immutable.
 * A missing file under /assets/ returns 404 instead of index.html.
 */
export function registerClientApp(
  fastify: FastifyInstance,
  { root, apiPrefix }: ClientAppOptions
): void {
  const rootDir = path.resolve(root);
  const assetsDir = path.join(rootDir, ASSETS_DIR_NAME) + path.sep;

  const cacheControlFor = (filePath: string): string => {
    if (filePath.endsWith(".html")) return CACHE_HTML;
    if (filePath.startsWith(assetsDir)) return CACHE_HASHED_ASSET;
    return CACHE_PUBLIC_FILE;
  };

  fastify.register(FastifyStatic, {
    root: rootDir,
    prefix: "/",
    index: "index.html",
    wildcard: false,
    // @fastify/send writes "public, max-age=0" after setHeaders unless cacheControl is false.
    cacheControl: false,
    setHeaders: (res, filePath) => {
      res.setHeader("Cache-Control", cacheControlFor(filePath));
    },
  });

  fastify.get("/*", (req, reply) => {
    if (req.url.startsWith(apiPrefix)) {
      return reply.status(404).send({ error: "Not Found" });
    }
    if (req.url.startsWith(ASSETS_URL_PREFIX)) {
      return reply
        .status(404)
        .header("Cache-Control", CACHE_NOT_FOUND)
        .send({ error: "Not Found" });
    }
    return reply.sendFile("index.html", rootDir);
  });
}
