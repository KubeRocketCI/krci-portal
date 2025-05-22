import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"], // Apply the rules to JS and TS files
  },
  {
    languageOptions: {
      globals: globals.browser,
      parser: "@typescript-eslint/parser", // Use TypeScript parser
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module", // Allow module imports in TS files
      },
    },
  },
  {
    ignores: ["node_modules", "dist"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
