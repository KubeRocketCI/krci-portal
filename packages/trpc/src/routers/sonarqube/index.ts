import { t } from "../../trpc.js";
import { getProjects } from "./procedures/index.js";

export const sonarqubeRouter = t.router({
  getProjects,
});
