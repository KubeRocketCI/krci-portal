import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "trpc",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["*/**/node_modules/*", "*/**/dist/*"],
    // Inline the injected workspace package so `vi.resetModules()` re-evaluates its
    // env-derived module state (e.g. PORTAL_ADMIN_GROUPS in models/role/config).
    server: { deps: { inline: ["@my-project/shared"] } },
  },
});
