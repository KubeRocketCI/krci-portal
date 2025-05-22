import { build } from 'esbuild'

await build({
  entryPoints: ['./src/index.ts'],
  outdir: './dist',
  bundle: true,
  target: 'node22',
  format: 'esm',
  platform: 'node',
  sourcemap: true,
})
