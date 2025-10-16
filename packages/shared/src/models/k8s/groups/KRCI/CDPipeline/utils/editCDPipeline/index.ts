import { ZodError } from "zod";
import { CDPipeline, EditCDPipelineInput } from "../../types";
import { editCDPipelineInputSchema, cdPipelineSchema } from "../../schema";

/**
 * Updates a CDPipeline resource with editable fields
 * Only allows editing: description, applications
 */
export const editCDPipelineObject = (
  originalCDPipeline: CDPipeline,
  input: EditCDPipelineInput
): CDPipeline => {
  const parsedInput = editCDPipelineInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  // Create updated CDPipeline with only editable fields changed
  const updatedCDPipeline: CDPipeline = {
    ...originalCDPipeline,
    spec: {
      ...originalCDPipeline.spec,
      description: input.description,
      applications: input.applications,
      // inputDockerStreams must match applications
      inputDockerStreams: input.applications,
    },
  };

  // Validate the updated CDPipeline
  const parsedCDPipeline = cdPipelineSchema.safeParse(updatedCDPipeline);

  if (!parsedCDPipeline.success) {
    throw new ZodError(parsedCDPipeline.error.errors);
  }

  return parsedCDPipeline.data;
};
