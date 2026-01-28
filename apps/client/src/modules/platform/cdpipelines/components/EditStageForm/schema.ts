import z from "zod";
import { EDIT_STAGE_FORM_NAMES } from "./constants";

const schema = z.object({
  [EDIT_STAGE_FORM_NAMES.triggerType]: z.string().min(1, "Select trigger type"),
  [EDIT_STAGE_FORM_NAMES.triggerTemplate]: z.string().min(1, "Select Deploy Pipeline template"),
  [EDIT_STAGE_FORM_NAMES.cleanTemplate]: z.string().min(1, "Select Clean Pipeline template"),
});

export const editStageSchema = schema;
