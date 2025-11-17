import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"], // Apply the rules to JS and TS files
  },
  {
    files: ["src/**/*.ts"], // Only TypeScript files in src/ with project-based parsing
    languageOptions: {
      globals: globals.browser,
      parser: "@typescript-eslint/parser", // Use TypeScript parser
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module", // Allow module imports in TS files
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: [
      "**/*.{js,mjs,cjs}",
      "**/*.config.{js,ts}",
      "env.d.ts",
      "vitest.config.ts",
    ], // Config files without project-based parsing
    languageOptions: {
      globals: globals.browser,
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
  },
  {
    ignores: ["node_modules", "dist"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
