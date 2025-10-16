import { ZodError } from "zod";
import { Codebase, EditCodebaseInput } from "../../types";
import { editCodebaseInputSchema, codebaseSchema } from "../../schema";

/**
 * Updates a Codebase resource with editable fields
 * Only allows editing: jiraServer, commitMessagePattern, ticketNamePattern, jiraIssueMetadataPayload
 */
export const editCodebaseObject = (
  originalCodebase: Codebase,
  input: EditCodebaseInput
): Codebase => {
  const parsedInput = editCodebaseInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  // Create updated codebase with only editable fields changed
  const updatedCodebase: Codebase = {
    ...originalCodebase,
    spec: {
      ...originalCodebase.spec,
      jiraServer: input.jiraServer,
      commitMessagePattern: input.commitMessagePattern,
      ticketNamePattern: input.ticketNamePattern,
      jiraIssueMetadataPayload: input.jiraIssueMetadataPayload,
    },
  };

  // Validate the updated codebase
  const parsedCodebase = codebaseSchema.safeParse(updatedCodebase);

  if (!parsedCodebase.success) {
    throw new ZodError(parsedCodebase.error.errors);
  }

  return parsedCodebase.data;
};
