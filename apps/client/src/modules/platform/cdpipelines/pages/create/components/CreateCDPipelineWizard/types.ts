import z from "zod";
import { createCDPipelineFormSchema } from "./names";

export { CREATE_CDPIPELINE_FORM_NAMES } from "./constants";

// Form values type (inferred from schema)
export type CreateCDPipelineFormValues = z.infer<typeof createCDPipelineFormSchema>;

// Application field array item type
export type ApplicationFieldArrayItem = {
  appName: string;
  appBranch: string;
  appToPromote: boolean;
};
