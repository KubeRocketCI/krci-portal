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
const MONACO_DIR = "core/components/CodeEditor/monaco";
assert(existsSync(join(__dirname, "src", MONACO_DIR)), `src/${MONACO_DIR} not found; update MONACO_DIR`);

const TABLE_SETTINGS_IMPORT = {
  group: [`**/${TABLE_SETTINGS_DIR}`, `**/${TABLE_SETTINGS_DIR}/**`],
  message: "Only the table shells read or write table settings. Pass `id` to the table instead.",
};
const MONACO_IMPORT = {
  group: ["@monaco-editor/*", "monaco-editor", "monaco-editor/**"],
  message: `Render editors through src/${MONACO_DIR}; it bundles Monaco and applies the shared defaults.`,
};

// Flat config replaces a rule wholesale rather than merging, so each exempt directory
// must restate the patterns it is still subject to.
const restrictImports = (...patterns) => ({ "no-restricted-imports": ["error", { patterns }] });

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
    rules: restrictImports(TABLE_SETTINGS_IMPORT, MONACO_IMPORT),
  },
  {
    files: ["src/core/components/Table/**"],
    rules: restrictImports(MONACO_IMPORT),
  },
  {
    files: [`src/${MONACO_DIR}/**`],
    rules: restrictImports(TABLE_SETTINGS_IMPORT),
  },
  storybook.configs["flat/recommended"]
);
