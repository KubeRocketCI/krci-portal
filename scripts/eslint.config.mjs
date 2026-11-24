import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Loaded with --config from the repo root: file patterns are relative to the root.
export default tseslint.config({
  files: ["scripts/**/*.{ts,mjs}"],
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
});
