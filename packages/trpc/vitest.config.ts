import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "trpc",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["*/**/node_modules/*", "*/**/dist/*"],
  },
});
