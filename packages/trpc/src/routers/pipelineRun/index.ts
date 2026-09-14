import { t } from "../../trpc.js";
import { build, start } from "./procedures/index.js";

export const pipelineRunRouter = t.router({
  start,
  build,
});
