import { t } from "../../trpc.js";
import {
  getCodebaseFindings,
  getConnection,
  getExposedSecrets,
  getFindingsScope,
  getScanFindings,
  getSecurityOverview,
  getSecurityOverviewCodebases,
  getVulnerabilities,
} from "./procedures/index.js";

export const defectDojoRouter = t.router({
  getCodebaseFindings,
  getConnection,
  getExposedSecrets,
  getFindingsScope,
  getScanFindings,
  getSecurityOverview,
  getSecurityOverviewCodebases,
  getVulnerabilities,
});
