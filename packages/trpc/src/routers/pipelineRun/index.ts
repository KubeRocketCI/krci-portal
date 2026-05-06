import { t } from "../../trpc.js";
import { start } from "./procedures/index.js";

export const pipelineRunRouter = t.router({
  start,
});
