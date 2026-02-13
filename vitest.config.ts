import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "lcov", "json"],
      exclude: [
        // Standard exclusions
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/.storybook/**",
        "**/__mocks__/**",
        "**/eslint.config.js",
        "**/.eslintrc*",

        // ============================================
        // REACT COMPONENTS - Test with Storybook
        // ============================================
        "**/*.tsx",
        // Storybook stories (exclude from coverage)
        "**/*.stories.ts",
        "**/*.stories.tsx",
        "**/*.story.ts",
        "**/*.story.tsx",
        // Note: .test.tsx files are handled separately by test.exclude

        // ============================================
        // ROUTING CONFIGURATION
        // ============================================
        "**/route.ts",
        "**/route.tsx",
        "**/route.lazy.ts",
        "**/route.lazy.tsx",
        "**/routes.ts",
        "**/_root.ts",

        // ============================================
        // TYPE DEFINITIONS
        // ============================================
        "**/*.types.ts",
        "**/types.ts",
        "**/svg.d.ts",
        "**/vite-env.d.ts",

        // ============================================
        // STATIC CONFIGURATION & CONSTANTS
        // ============================================
        "**/*.config.ts",
        "**/config.ts",
        "**/configs/**",
        "**/*.schema.ts",
        "**/schema.ts",
        "**/*.constants.ts",
        "**/constants.ts",
        "**/constants/**",
        "**/names.ts",
        "**/colors.ts",
        "**/*.styles.ts",
        "**/styles.ts",
        "**/data.ts",
        "**/metrics.ts",
        "**/thresholds.ts",
        "**/statuses.ts",

        // ============================================
        // REACT CONTEXT & PROVIDERS
        // ============================================
        "**/context.ts",
        "**/hooks.ts",

        // ============================================
        // SIMPLE HOOKS - UI Configuration Only
        // These return UI config, not business logic
        // ============================================
        "**/useTabs.tsx",
        "**/useFilter.tsx",
        "**/useColumns.tsx",
        "**/useDefaultValues.ts",

        // ============================================
        // INFRASTRUCTURE & SETUP
        // ============================================
        "**/queryClient.ts",
        "**/http-client.ts",
        "**/navigationConfig.ts",
        "**/registry.ts",

        // ============================================
        // BARREL EXPORTS - Specific Patterns Only
        // ============================================
        // NOTE: Do NOT use "**/index.ts" - it excludes utilities with logic!
        // Only exclude index.ts in directories that are known barrel exports
        "**/providers/index.ts",
        "**/hooks/index.ts",
        "**/components/index.ts",
        "**/api/groups/*/index.ts",
        "**/api/groups/*/*/index.ts",
        "**/api/groups/*/*/*/index.ts",

        // ============================================
        // ADDITIONAL PATTERNS
        // ============================================
        "**/mappings/**",
        "**/*-mappings.ts",
        "**/*mappings.ts",
        "**/validation.ts",
      ],
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      // Storybook files (not vitest tests)
      "**/*.stories.tsx",
      "**/*.stories.ts",
      "**/*.story.tsx",
      "**/*.story.ts",
    ],
  },
});