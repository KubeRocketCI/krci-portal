import { describe, expect, it } from "vitest";
import { findTestImporters } from "./importers.js";

const ALIASES = { "@/": "apps/client/src/" };

describe("findTestImporters", () => {
  it("finds tests importing the file through the alias, a relative path, an index or a side-effect import", () => {
    const tests = [
      {
        path: "apps/client/src/core/hooks/usePinnedItems.test.ts",
        source: 'import { PATH } from "@/modules/platform/codebases/pages/details/route";',
      },
      {
        path: "apps/client/src/modules/platform/codebases/pages/details/view.test.tsx",
        source: 'import { PATH } from "./route.js";',
      },
      { path: "apps/client/src/core/router.test.ts", source: 'import "@/modules/platform/codebases/pages/details";' },
      {
        path: "apps/client/src/core/lazy.test.ts",
        source: 'const m = await import("../modules/platform/codebases/pages/details/route");',
      },
    ];

    expect(
      findTestImporters("apps/client/src/modules/platform/codebases/pages/details/route.ts", tests, ALIASES)
    ).toEqual([
      "apps/client/src/core/hooks/usePinnedItems.test.ts",
      "apps/client/src/core/lazy.test.ts",
      "apps/client/src/modules/platform/codebases/pages/details/view.test.tsx",
    ]);
    expect(
      findTestImporters("apps/client/src/modules/platform/codebases/pages/details/index.ts", tests, ALIASES)
    ).toEqual(["apps/client/src/core/router.test.ts"]);
  });

  it("ignores vi.mock paths, look-alike prefixes and package imports", () => {
    const tests = [
      { path: "packages/trpc/src/routers/a/index.test.ts", source: 'vi.mock("../../clients/prometheus/index.js");' },
      {
        path: "packages/trpc/src/routers/b/index.test.ts",
        source: 'import { x } from "../../clients/prometheus-v2/index.js";',
      },
      { path: "packages/trpc/src/routers/c/index.test.ts", source: 'import { z } from "zod";' },
    ];

    expect(findTestImporters("packages/trpc/src/clients/prometheus/index.ts", tests, {})).toEqual([]);
  });
});
