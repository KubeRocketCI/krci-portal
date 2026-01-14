import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineProject({
  plugins: [tsconfigPaths({ root: "./" })],
  test: {
    name: "client",
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["*/**/node_modules/*", "*/**/dist/*", "../../packages/shared/*"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
