import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // gen: protoc-gen-es output (pnpm generate:substrate).
    ignores: ["node_modules", "dist", "api", "src/clients/agentSubstrate/grpc/gen"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // `_` prefix: a binding that must exist but is unused (rest omit, iterator drain, mock signature).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      // Off in tests: client mocks are partial.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
