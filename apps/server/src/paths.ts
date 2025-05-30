import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_ROOT = path.resolve(__dirname, "../");
const MONOREPO_ROOT = path.resolve(SERVER_ROOT, "../..");

export const fromServerRoot = (...segments: string[]): string =>
  path.join(SERVER_ROOT, ...segments);

export const fromMonorepoRoot = (...segments: string[]): string =>
  path.join(MONOREPO_ROOT, ...segments);

export { SERVER_ROOT, MONOREPO_ROOT };
