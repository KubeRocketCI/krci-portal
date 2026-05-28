import { ZodError } from "zod";
import { Codebase, EditCodebaseInput } from "../../types.js";
import { editCodebaseInputSchema } from "../../schema.js";

/**
 * Updates a Codebase resource with editable fields
 * Only allows editing: jiraServer, commitMessagePattern, ticketNamePattern, jiraIssueMetadataPayload
 */
export const editCodebaseObject = (originalCodebase: Codebase, input: EditCodebaseInput): Codebase => {
  const parsedInput = editCodebaseInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  // Preserve the original object (including server-managed fields like status)
  // and only overwrite the editable spec fields. The full object is intentionally
  // NOT re-validated against codebaseSchema: a live codebase's status may be
  // partially populated and would otherwise fail strict validation.
  return {
    ...originalCodebase,
    spec: {
      ...originalCodebase.spec,
      jiraServer: parsedInput.data.jiraServer,
      commitMessagePattern: parsedInput.data.commitMessagePattern,
      ticketNamePattern: parsedInput.data.ticketNamePattern,
      jiraIssueMetadataPayload: parsedInput.data.jiraIssueMetadataPayload,
    },
  };
};
