import z from "zod";
import { EDIT_CDPIPELINE_FORM_NAMES } from "./constants";

const schema = z.object({
  [EDIT_CDPIPELINE_FORM_NAMES.description]: z.string().min(1, "Description is required"),
  [EDIT_CDPIPELINE_FORM_NAMES.applications]: z.array(z.string()).default([]),
  [EDIT_CDPIPELINE_FORM_NAMES.inputDockerStreams]: z.array(z.string()).default([]),
  [EDIT_CDPIPELINE_FORM_NAMES.applicationsToPromote]: z.array(z.string()).default([]),
  [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToAddChooser]: z.array(z.string()).default([]),
  [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray]: z
    .array(
      z.object({
        appName: z.string(),
        appBranch: z.string(),
        appToPromote: z.boolean(),
      })
    )
    .default([]),
  [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToPromoteAll]: z.boolean().default(false),
});

export const editCDPipelineSchema = schema;
