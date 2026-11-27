import { t } from "../../trpc.js";
import {
  getCodebaseFindings,
  getCodebaseSecurityLine,
  getConnection,
  getEnvironmentSummary,
  getExposedSecrets,
  getFindingsScope,
  getScanFindings,
  getSecurityOverview,
  getSecurityOverviewCodebases,
  getVulnerabilities,
} from "./procedures/index.js";

export const defectDojoRouter = t.router({
  getCodebaseFindings,
  getCodebaseSecurityLine,
  getConnection,
  getEnvironmentSummary,
  getExposedSecrets,
  getFindingsScope,
  getScanFindings,
  getSecurityOverview,
  getSecurityOverviewCodebases,
  getVulnerabilities,
});
