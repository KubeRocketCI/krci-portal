import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { globRootOf } from "./globRoot.js";

const require = createRequire(import.meta.url);

/** The picomatch that Vitest matches `forceRerunTriggers` with. */
const picomatch = createRequire(require.resolve("vitest"))("picomatch") as {
  isMatch: (path: string, patterns: string[]) => boolean;
};

const TRIGGER = "**/{package.json,vitest.config.*}";

describe("globRootOf", () => {
  it.each([
    "/home/dev/krci-portal/",
    "/home/dev/krci-portal[1]/",
    "/home/dev/krci-portal (copy)/",
    "/home/dev/{krci}/portal/",
    "/home/dev/!portal/",
    "/home/dev/c++/portal/",
    "/home/dev/@scope/portal/",
    "/home/dev/a*b?/portal/",
    "/home/dev/a^b$c|d/portal/",
    "/home/dev/a\\b/portal/",
  ])("gives a glob prefix that matches only the files under %s", (root) => {
    const trigger = `${globRootOf(root, "linux")}${TRIGGER}`;

    expect(picomatch.isMatch(`${root}apps/client/package.json`, [trigger])).toBe(true);
    expect(picomatch.isMatch(`${root}vitest.config.ts`, [trigger])).toBe(true);
    expect(picomatch.isMatch("/home/dev/other/apps/client/package.json", [trigger])).toBe(false);
  });

  it("gives forward slashes and escapes for a Windows root", () => {
    expect(globRootOf("C:\\work\\portal (1)\\", "win32")).toBe("C:/work/portal \\(1\\)/");
  });
});
