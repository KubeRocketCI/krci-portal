import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "scripts",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**"],
  },
});
