import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: false,
  target: 'node18',
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  external: [
    // Keep all Node.js modules external to avoid bundling issues
    'better-sqlite3',
    'fastify',
    '@fastify/cookie',
    '@fastify/cors', 
    '@fastify/session',
    '@fastify/static',
    '@fastify/websocket',
    '@kubernetes/client-node',
    '@trpc/server',
    'cookie',
    'dotenv',
    'openid-client',
    'uuid',
    'zod',
    'jwt-decode',
    // Add any other dependencies that should remain external
    'fs',
    'path',
    'url',
    'http',
    'https',
    'crypto',
    'os',
    'child_process'
  ],
  alias: {
    '@my-project/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    '@/*': resolve(__dirname, 'src/*')
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  banner: {
    js: '#!/usr/bin/env node'
  },
  // Ensure proper Node.js module resolution
  mainFields: ['module', 'main'],
  conditions: ['node', 'import']
});

console.log('Build completed successfully!');
console.log('Output:', result.outputFiles?.[0]?.path || 'dist/index.js'); 