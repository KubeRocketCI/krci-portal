import dotenv from "dotenv";
import { fromMonorepoRoot, fromServerRoot } from "./paths";

const env = process.env.NODE_ENV || "development";

console.log("NODE_ENV:", env);

dotenv.config({
  path: fromMonorepoRoot(".env"),
});

switch (env) {
  case "development":
    dotenv.config({
      path: fromServerRoot(".env.development"),
      override: true,
    });
    break;
  case "test":
    dotenv.config({
      path: fromServerRoot(".env.test"),
      override: true,
    });
    break;
  case "production":
    dotenv.config({
      path: fromServerRoot(".env.production"),
      override: true,
    });
    break;
  default:
    throw new Error(`Unknown NODE_ENV: ${env}`);
}
