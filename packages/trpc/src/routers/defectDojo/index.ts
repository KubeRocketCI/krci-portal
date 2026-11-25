import { t } from "../../trpc.js";
import {
  getCodebaseFindings,
  getConnection,
  getFindingsScope,
  getScanFindings,
  getVulnerabilities,
} from "./procedures/index.js";

export const defectDojoRouter = t.router({
  getCodebaseFindings,
  getConnection,
  getFindingsScope,
  getScanFindings,
  getVulnerabilities,
});
