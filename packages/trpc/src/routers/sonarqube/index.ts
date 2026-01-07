import { t } from "../../trpc.js";
import { getProjects, getProject } from "./procedures/index.js";

export const sonarqubeRouter = t.router({
  getProjects,
  getProject,
});
