import { ZodError } from "zod";
import { CodebaseDraft, CreateCodebaseDraftInput } from "../../types";
import { codebaseLabels, k8sCodebaseConfig } from "../../constants";
import {
  codebaseDraftSchema,
  createCodebaseDraftInputSchema,
} from "../../schema";

const { kind, apiVersion } = k8sCodebaseConfig;

const normalizePath = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;

export const createCodebaseDraftObject = (
  input: CreateCodebaseDraftInput
): CodebaseDraft => {
  const parsedInput = createCodebaseDraftInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: CodebaseDraft = {
    apiVersion,
    kind,
    metadata: {
      name: input.name || "your codebase name",
      labels: {
        [codebaseLabels.codebaseType]: input.type,
      },
    },
    spec: {
      ciTool: input.ciTool,
      type: input.type,
      buildTool: input.buildTool,
      defaultBranch: input.defaultBranch,
      deploymentScript: input.deploymentScript,
      emptyProject: input.emptyProject,
      framework: input.framework,
      gitServer: input.gitServer,
      lang: input.lang,
      private: input.private,
      repository: input.repository,
      strategy: input.strategy,
      versioning: input.versioning,
      gitUrlPath: normalizePath(input.gitUrlPath),
    },
  };

  const parsedDraft = codebaseDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
