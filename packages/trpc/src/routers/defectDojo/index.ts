import { t } from "../../trpc.js";
import { getConnection } from "./procedures/index.js";

export const defectDojoRouter = t.router({
  getConnection,
});
