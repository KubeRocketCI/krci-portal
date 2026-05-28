import { ZodError } from "zod";
import { Stage, EditStageInput } from "../../types.js";
import { editStageInputSchema } from "../../schema.js";

/**
 * Updates a Stage resource with editable fields
 * Only allows editing: triggerType, triggerTemplate, cleanTemplate, qualityGates
 */
export const editStageObject = (originalStage: Stage, input: EditStageInput): Stage => {
  const parsedInput = editStageInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  // Preserve the original object (including server-managed fields) and only
  // overwrite editable spec fields. The full object is intentionally NOT
  // re-validated against stageSchema: a live resource can diverge from the
  // strict schema and would otherwise fail validation here.
  return {
    ...originalStage,
    spec: {
      ...originalStage.spec,
      triggerType: parsedInput.data.triggerType,
      triggerTemplate: parsedInput.data.triggerTemplate,
      cleanTemplate: parsedInput.data.cleanTemplate,
      qualityGates: parsedInput.data.qualityGates,
    },
  };
};
