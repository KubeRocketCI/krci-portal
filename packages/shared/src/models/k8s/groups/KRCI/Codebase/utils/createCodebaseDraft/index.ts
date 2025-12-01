import z, { ZodError } from "zod";
import {
  codebaseDeploymentScript,
  codebaseTestReportFramework,
  codebaseType,
  k8sCodebaseConfig,
} from "../../constants.js";
import { codebaseDraftSchema } from "../../schema.js";
import { CodebaseDraft } from "../../types.js";

const { kind, apiVersion } = k8sCodebaseConfig;

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export const createCodebaseDraftInputSchema = z.object({
  name: codebaseDraftSchema.shape.metadata.shape.name,
  labels: codebaseDraftSchema.shape.metadata.shape.labels,
  branchToCopyInDefaultBranch: codebaseDraftSchema.shape.spec.shape.branchToCopyInDefaultBranch,
  buildTool: codebaseDraftSchema.shape.spec.shape.buildTool,
  ciTool: codebaseDraftSchema.shape.spec.shape.ciTool,
  commitMessagePattern: codebaseDraftSchema.shape.spec.shape.commitMessagePattern,
  defaultBranch: codebaseDraftSchema.shape.spec.shape.defaultBranch,
  deploymentScript: codebaseDraftSchema.shape.spec.shape.deploymentScript,
  description: codebaseDraftSchema.shape.spec.shape.description,
  disablePutDeployTemplates: codebaseDraftSchema.shape.spec.shape.disablePutDeployTemplates,
  emptyProject: codebaseDraftSchema.shape.spec.shape.emptyProject,
  framework: codebaseDraftSchema.shape.spec.shape.framework,
  gitServer: codebaseDraftSchema.shape.spec.shape.gitServer,
  gitUrlPath: codebaseDraftSchema.shape.spec.shape.gitUrlPath,
  jiraIssueMetadataPayload: codebaseDraftSchema.shape.spec.shape.jiraIssueMetadataPayload,
  jiraServer: codebaseDraftSchema.shape.spec.shape.jiraServer,
  lang: codebaseDraftSchema.shape.spec.shape.lang,
  private: codebaseDraftSchema.shape.spec.shape.private,
  repositoryUrl: codebaseDraftSchema.shape.spec.shape.repository
    .unwrap()
    .shape.url
    .nullable(),
  strategy: codebaseDraftSchema.shape.spec.shape.strategy,
  testReportFramework: codebaseDraftSchema.shape.spec.shape.testReportFramework,
  ticketNamePattern: codebaseDraftSchema.shape.spec.shape.ticketNamePattern,
  type: codebaseDraftSchema.shape.spec.shape.type,
  versioningType: codebaseDraftSchema.shape.spec.shape.versioning.shape.type,
  versioningStartFrom: codebaseDraftSchema.shape.spec.shape.versioning.shape.startFrom,
});

export const createCodebaseDraftObject = (input: z.infer<typeof createCodebaseDraftInputSchema>): CodebaseDraft => {
  const parsedInput = createCodebaseDraftInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const spec: CodebaseDraft["spec"] = {
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
    strategy: input.strategy,
    versioning: {
      type: input.versioningType,
    },
    gitUrlPath: normalizePath(input.gitUrlPath),
    repository: null,
  };

  if (input.branchToCopyInDefaultBranch !== undefined) {
    spec.branchToCopyInDefaultBranch = input.branchToCopyInDefaultBranch;
  }
  if (input.commitMessagePattern !== undefined) {
    spec.commitMessagePattern = input.commitMessagePattern;
  }
  if (input.description !== undefined) {
    spec.description = input.description;
  }
  if (input.disablePutDeployTemplates !== undefined) {
    spec.disablePutDeployTemplates = input.disablePutDeployTemplates;
  }
  if (input.jiraIssueMetadataPayload !== undefined) {
    spec.jiraIssueMetadataPayload = input.jiraIssueMetadataPayload;
  }
  if (input.jiraServer !== undefined) {
    spec.jiraServer = input.jiraServer;
  }
  if (input.testReportFramework !== undefined) {
    spec.testReportFramework = input.testReportFramework;
  }
  if (input.ticketNamePattern !== undefined) {
    spec.ticketNamePattern = input.ticketNamePattern;
  }
  if (input.type === codebaseType.application) {
    spec.deploymentScript = codebaseDeploymentScript["helm-chart"];
  }
  if (input.type === codebaseType.autotest) {
    spec.testReportFramework = codebaseTestReportFramework.allure;
  }
  if (input.versioningStartFrom !== undefined) {
    spec.versioning.startFrom = input.versioningStartFrom;
  }
  if (input.repositoryUrl !== null) {
    spec.repository = {
      url: input.repositoryUrl,
    };
  }

  const draft: CodebaseDraft = {
    apiVersion,
    kind,
    metadata: {
      name: input.name,
      labels: input.labels,
    },
    spec,
  };

  const parsedDraft = codebaseDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
