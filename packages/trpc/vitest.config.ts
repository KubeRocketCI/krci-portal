import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "trpc",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "*/**/node_modules/*",
      "*/**/dist/*",
      // Exclude commented-out/WIP test files
      "src/clients/oidc/index.test.ts",
      "src/routers/auth/procedures/login/index.test.ts",
      "src/routers/auth/procedures/loginCallback/index.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
