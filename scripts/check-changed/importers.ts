import { posix } from "node:path";

export interface TestSource {
  /** Repo-relative. */
  path: string;
  source: string;
}

/** `from "x"`, `import "x"` and `import("x")`; `vi.mock("x")` does not run the module. */
const SPECIFIER = /(?:\bfrom\s+|\bimport\s+|\bimport\s*\(\s*)["']([^"']+)["']/g;

/** Module identity: no extension, no trailing `/index`. */
const moduleId = (path: string) => path.replace(/\.(m?js|tsx?)$/, "").replace(/\/index$/, "");

function resolve(specifier: string, from: string, aliases: Record<string, string>): string | undefined {
  if (specifier.startsWith(".")) return posix.join(posix.dirname(from), specifier);
  const alias = Object.keys(aliases).find((prefix) => specifier.startsWith(prefix));
  return alias === undefined ? undefined : aliases[alias] + specifier.slice(alias.length);
}

/**
 * Tests that import `changedPath` directly; transitive importers are not followed.
 * `aliases` maps an import prefix to a repo-relative directory, e.g. `@/` to `apps/client/src/`.
 */
export function findTestImporters(changedPath: string, tests: TestSource[], aliases: Record<string, string>): string[] {
  const target = moduleId(changedPath);
  return tests
    .filter(({ path, source }) =>
      [...source.matchAll(SPECIFIER)].some(([, specifier]) => {
        const resolved = resolve(specifier, path, aliases);
        return resolved !== undefined && moduleId(resolved) === target;
      })
    )
    .map(({ path }) => path)
    .sort((a, b) => a.localeCompare(b));
}
