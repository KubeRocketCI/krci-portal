import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths({ root: "./" })],
  test: {
    environment: "node", // For server-side tests
    include: ["src/*/**/*.test.{ts,js}"],
    coverage: {
      exclude: [
        "*/**/__mocks__/*",
        "node_modules/*",
        "dist/*",
        "db/*",
        "coverage/*",
      ],
    },
  },
});
