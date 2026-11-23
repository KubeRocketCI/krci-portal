import { t } from "../../trpc.js";
import { getCodebaseFindings, getConnection, getScanFindings } from "./procedures/index.js";

export const defectDojoRouter = t.router({
  getCodebaseFindings,
  getConnection,
  getScanFindings,
});
