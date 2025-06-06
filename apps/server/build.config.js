import { build } from "esbuild";

await build({
  entryPoints: ["./src/index.ts"],
  outfile: "./dist/index.js",
  bundle: true,
  target: "node22",
  format: "esm",
  platform: "node",
  sourcemap: true,
  external: ["better-sqlite3"], // leave native deps external
});
