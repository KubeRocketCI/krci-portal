import { ZodError } from "zod";
import { CDPipeline, EditCDPipelineInput } from "../../types.js";
import { editCDPipelineInputSchema } from "../../schema.js";

/**
 * Updates a CDPipeline resource with editable fields
 * Only allows editing: description, applications, inputDockerStreams, applicationsToPromote
 */
export const editCDPipelineObject = (originalCDPipeline: CDPipeline, input: EditCDPipelineInput): CDPipeline => {
  const parsedInput = editCDPipelineInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  // Preserve the original object (including server-managed fields) and only
  // overwrite editable spec fields. The full object is intentionally NOT
  // re-validated against cdPipelineSchema: a live resource can diverge from the
  // strict schema and would otherwise fail validation here.
  return {
    ...originalCDPipeline,
    spec: {
      ...originalCDPipeline.spec,
      description: parsedInput.data.description,
      applications: parsedInput.data.applications,
      inputDockerStreams: parsedInput.data.inputDockerStreams,
      applicationsToPromote: parsedInput.data.applicationsToPromote,
    },
  };
};
