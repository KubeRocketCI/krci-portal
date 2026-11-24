import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// prettier --check on the index contents of repo-relative paths, which may differ from the working tree.
// Run from the package directory: Prettier and its plugins resolve from there.
// Usage: check-format.ts --root DIR PATH...
// Exit: 0 formatted; 1 a file is not formatted; 2 Prettier or git failed and no file is known to be unformatted.

type Prettier = typeof import("prettier");

const [flag, root, ...paths] = process.argv.slice(2);
if (flag !== "--root" || !root) {
  console.error("usage: check-format.ts --root DIR PATH...");
  process.exit(2);
}

// The package's own Prettier: apps/client pins its plugins next to it.
// require.resolve yields the CommonJS entry; its API is the default export.
const prettierEntry = createRequire(join(process.cwd(), "package.json")).resolve("prettier");
const prettierModule: Prettier & { default?: Prettier } = await import(pathToFileURL(prettierEntry).href);
const prettier: Prettier = prettierModule.default ?? prettierModule;

const ignorePath = [join(process.cwd(), ".gitignore"), join(process.cwd(), ".prettierignore")];
let unformatted = 0;
let failed = 0;

for (const path of paths) {
  const file = join(root, path);
  try {
    const info = await prettier.getFileInfo(file, { ignorePath });
    if (info.ignored || !info.inferredParser) continue;
    // `:path` reads the index; git sets GIT_INDEX_FILE to the commit's index inside hooks.
    const source = execFileSync("git", ["-C", root, "show", `:${path}`], { encoding: "utf8", maxBuffer: 64 << 20 });
    const options = (await prettier.resolveConfig(file)) ?? {};
    if (!(await prettier.check(source, { ...options, filepath: file }))) {
      console.log(`[warn] ${path}`);
      unformatted++;
    }
  } catch (error) {
    console.error(`[error] ${path}: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
}

// A confirmed unformatted file wins over a file Prettier could not check.
if (unformatted > 0) {
  console.log(`[warn] ${unformatted} staged file(s) not formatted.`);
  process.exit(1);
}
if (failed > 0) process.exit(2);
