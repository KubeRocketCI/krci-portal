import dotenv from "dotenv";
import { resolve } from "path";

const env = process.env.NODE_ENV || "development";
const serverRoot = process.cwd();
const monorepoRoot = resolve(serverRoot, "../..");

// Always load base .env files
dotenv.config({ path: resolve(monorepoRoot, ".env") });
dotenv.config({ path: resolve(serverRoot, ".env") });

dotenv.config({ path: resolve(monorepoRoot, ".env.development") });
dotenv.config({
  path: resolve(serverRoot, ".env.development"),
  override: true,
});

if (env === "production") {
  dotenv.config({
    path: resolve(monorepoRoot, ".env.production"),
    override: true,
  });
  dotenv.config({
    path: resolve(serverRoot, ".env.production"),
    override: true,
  });
}
