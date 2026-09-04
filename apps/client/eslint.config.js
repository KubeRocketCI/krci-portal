// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Relative to src/. Verified at load: a moved directory fails lint instead of silently unguarding.
const TABLE_SETTINGS_DIR = "core/components/Table/components/TableSettings";
assert(
  existsSync(join(__dirname, "src", TABLE_SETTINGS_DIR)),
  `src/${TABLE_SETTINGS_DIR} not found; update TABLE_SETTINGS_DIR`
);

export default tseslint.config(
  { ignores: ["dist", "storybook-static", ".storybook/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    ignores: ["*.config.ts", ".storybook/**"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: "./tsconfig.app.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["*.config.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        project: "./tsconfig.node.json",
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/core/components/Table/**", "src/core/components/ServerSideTable/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [`**/${TABLE_SETTINGS_DIR}`, `**/${TABLE_SETTINGS_DIR}/**`],
              message: "Only the table shells read or write table settings. Pass `id` to the table instead.",
            },
          ],
        },
      ],
    },
  },
  storybook.configs["flat/recommended"]
);
