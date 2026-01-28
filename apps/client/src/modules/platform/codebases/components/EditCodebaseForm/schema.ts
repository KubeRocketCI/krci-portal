import z from "zod";
import { EDIT_CODEBASE_FORM_NAMES } from "./constants";

const schema = z
  .object({
    [EDIT_CODEBASE_FORM_NAMES.commitMessagePattern]: z.string().default(""),
    [EDIT_CODEBASE_FORM_NAMES.hasJiraServerIntegration]: z.boolean(),
    [EDIT_CODEBASE_FORM_NAMES.jiraServer]: z.string().nullable().default(null),
    [EDIT_CODEBASE_FORM_NAMES.ticketNamePattern]: z.string().nullable().default(null),
    [EDIT_CODEBASE_FORM_NAMES.advancedMappingFieldName]: z.array(z.string()).default([]),
    [EDIT_CODEBASE_FORM_NAMES.advancedMappingRows]: z
      .array(z.object({ field: z.string(), pattern: z.string() }))
      .default([]),
    [EDIT_CODEBASE_FORM_NAMES.jiraIssueMetadataPayload]: z.string().nullable().default(null),
  })
  .superRefine((data, ctx) => {
    if (data[EDIT_CODEBASE_FORM_NAMES.hasJiraServerIntegration]) {
      if (!data[EDIT_CODEBASE_FORM_NAMES.jiraServer]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [EDIT_CODEBASE_FORM_NAMES.jiraServer],
          message: "Select Jira server that will be integrated with the codebase.",
        });
      }
      if (!data[EDIT_CODEBASE_FORM_NAMES.ticketNamePattern]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [EDIT_CODEBASE_FORM_NAMES.ticketNamePattern],
          message: "Specify the pattern to find a Jira ticket number in a commit message.",
        });
      }
    }
  });

export const editCodebaseSchema = schema;
