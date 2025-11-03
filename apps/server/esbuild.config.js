import { build } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

const result = await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  sourcemap: false,
  target: "node18",
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  external: ["better-sqlite3"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  plugins: [
    nodeExternalsPlugin({
      allowList: [/^@my-project\/shared/],
    }),
  ],
});

console.log("Build completed successfully!");
console.log("Output:", result.outputFiles?.[0]?.path || "dist/index.js");
