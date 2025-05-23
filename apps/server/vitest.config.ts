import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineProject({
  plugins: [tsconfigPaths({ root: "./" })],
  test: {
    name: "server",
    environment: "jsdom", // For client-side tests
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "*/**/__mocks__/*",
      "*/**/node_modules/*",
      "*/**/dist/*",
      "../../packages/shared/*",
    ],
  },
});
