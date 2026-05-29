import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineProject({
  plugins: [tsconfigPaths({ root: "./" }), svgr()],
  test: {
    name: "client",
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["*/**/node_modules/*", "*/**/dist/*", "../../packages/shared/*", "**/.storybook/**"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
