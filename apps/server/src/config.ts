import dotenv from "dotenv";
import path from "path";
import { MONOREPO_ROOT } from "./paths";

// Load .env from monorepo root (works for both development and production)
const envPath = path.join(MONOREPO_ROOT, ".env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(
    `⚠️  Warning: Could not load .env file from ${envPath}:`,
    result.error.message
  );
} else {
  console.log(`✅ Loaded .env from ${envPath}`);
}
