import { t } from "../../trpc.js";
import { build, start, stop } from "./procedures/index.js";

export const pipelineRunRouter = t.router({
  start,
  build,
  stop,
});
