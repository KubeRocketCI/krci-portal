import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "lcov", "json"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/packages/shared/**",
        "**/packages/shared/**/*.ts",
      ],
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/packages/shared/**",
      "**/packages/shared/**/*.ts",
    ],
  },
});
