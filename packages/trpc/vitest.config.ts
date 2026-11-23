import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Tests read shared from source: the injected copy in node_modules holds only files present at install time.
    alias: { "@my-project/shared": fileURLToPath(new URL("../shared/src/index.ts", import.meta.url)) },
  },
  test: {
    name: "trpc",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["*/**/node_modules/*", "*/**/dist/*"],
    // Inline the injected workspace package so `vi.resetModules()` re-evaluates its
    // env-derived module state (e.g. PORTAL_ADMIN_GROUPS in models/role/config).
    server: { deps: { inline: ["@my-project/shared"] } },
  },
});
