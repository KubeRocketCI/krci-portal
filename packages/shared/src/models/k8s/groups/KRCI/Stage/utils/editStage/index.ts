import { ZodError } from "zod";
import { Stage, EditStageInput } from "../../types.js";
import { editStageInputSchema, stageSchema } from "../../schema.js";

/**
 * Updates a Stage resource with editable fields
 * Only allows editing: triggerType, triggerTemplate, cleanTemplate
 */
export const editStageObject = (originalStage: Stage, input: EditStageInput): Stage => {
  const parsedInput = editStageInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  // Create updated Stage with only editable fields changed
  const updatedStage: Stage = {
    ...originalStage,
    spec: {
      ...originalStage.spec,
      triggerType: input.triggerType,
      triggerTemplate: input.triggerTemplate,
      cleanTemplate: input.cleanTemplate,
    },
  };

  // Validate the updated Stage
  const parsedStage = stageSchema.safeParse(updatedStage);

  if (!parsedStage.success) {
    throw new ZodError(parsedStage.error.errors);
  }

  return parsedStage.data;
};
