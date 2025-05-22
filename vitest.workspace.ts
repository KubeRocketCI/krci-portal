import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/client/vitest.config.ts",
  "apps/server/vitest.config.ts",
]);
