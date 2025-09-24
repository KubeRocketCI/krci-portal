import z, { ZodError } from "zod";
import {
  JiraServerDraft,
  jiraServerDraftSchema,
  k8sJiraServerConfig,
} from "../../../../groups/KRCI";

const createJiraServerDraftSchema = z.object({
  url: z.string(),
});

export const createJiraServerDraft = (
  input: z.infer<typeof createJiraServerDraftSchema>
): JiraServerDraft => {
  const parsedInput = createJiraServerDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: JiraServerDraft = {
    apiVersion: `${k8sJiraServerConfig.group}/${k8sJiraServerConfig.version}`,
    kind: k8sJiraServerConfig.kind,
    metadata: {
      name: "epam-jira",
    },
    spec: {
      apiUrl: input.url,
      rootUrl: input.url,
      credentialName: "ci-jira",
    },
  };

  const parsedDraft = jiraServerDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
