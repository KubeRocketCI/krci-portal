import z, { ZodError } from "zod";
import { CodebaseDraft } from "../../types";
import { k8sCodebaseConfig } from "../../constants";
import { codebaseDraftSchema } from "../../schema";

const { kind, apiVersion } = k8sCodebaseConfig;

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

const createCodebaseDraftInputSchema = z.object({
  name: codebaseDraftSchema.shape.metadata.shape.name,
  gitServer: codebaseDraftSchema.shape.spec.shape.gitServer,
  gitUrlPath: codebaseDraftSchema.shape.spec.shape.gitUrlPath,
  type: codebaseDraftSchema.shape.spec.shape.type,
  buildTool: codebaseDraftSchema.shape.spec.shape.buildTool,
  defaultBranch: codebaseDraftSchema.shape.spec.shape.defaultBranch,
  deploymentScript: codebaseDraftSchema.shape.spec.shape.deploymentScript,
  emptyProject: codebaseDraftSchema.shape.spec.shape.emptyProject,
  framework: codebaseDraftSchema.shape.spec.shape.framework,
  lang: codebaseDraftSchema.shape.spec.shape.lang,
  private: codebaseDraftSchema.shape.spec.shape.private,
  repository: codebaseDraftSchema.shape.spec.shape.repository,
  strategy: codebaseDraftSchema.shape.spec.shape.strategy,
  versioning: codebaseDraftSchema.shape.spec.shape.versioning,
  ciTool: codebaseDraftSchema.shape.spec.shape.ciTool,
  labels: codebaseDraftSchema.shape.metadata.shape.labels,
});

export const createCodebaseDraftObject = (input: z.infer<typeof createCodebaseDraftInputSchema>): CodebaseDraft => {
  const parsedInput = createCodebaseDraftInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: CodebaseDraft = {
    apiVersion,
    kind,
    metadata: {
      name: input.name,
      labels: input.labels,
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
