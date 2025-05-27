import dotenv from "dotenv";
import { fromMonorepoRoot, fromServerRoot } from "./paths";

const env = process.env.NODE_ENV || "development";

if (env === "development") {
  dotenv.config({
    path: fromMonorepoRoot(".env.development"),
  });
  dotenv.config({
    path: fromServerRoot(".env.development"),
    override: true,
  });
}
