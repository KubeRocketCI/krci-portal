import z from "zod";
import {
  kubeObjectBaseSchema,
  kubeObjectBaseDraftSchema,
  kubeObjectMetadataSchema,
  kubeObjectDraftMetadataSchema,
} from "../../../common";
import { secretDraftSchema, secretSchema } from "../../Core";
import { codebaseLabels } from "./labels";
import { ciToolEnum, krciCommonLabelsSchema } from "../common";

export const codebaseTypeEnum = z.enum(["application", "autotest", "library", "infrastructure", "system"]);

export const codebaseCreationStrategyEnum = z.enum(["create", "clone", "import"]);

export const codebaseStatusEnum = z.enum(["created", "initialized", "in_progress", "failed"]);

export const codebaseDeploymentScriptEnum = z.enum(["helm-chart", "rpm-package"]);

export const codebaseTestReportFrameworkEnum = z.enum(["allure"]);

export const codebaseResultEnum = z.enum(["success", "error"]);

export const codebaseVersioningEnum = z.enum(["default", "semver", "edp"]);

const codebaseSpecSchema = z.object({
  branchToCopyInDefaultBranch: z.string().optional(),
  buildTool: z.string(),
  ciTool: ciToolEnum,
  commitMessagePattern: z.string().nullable().optional(),
  defaultBranch: z.string(),
  deploymentScript: codebaseDeploymentScriptEnum.default("helm-chart"),
  description: z.string().nullable().optional(),
  disablePutDeployTemplates: z.boolean().optional(),
  emptyProject: z.boolean(),
  framework: z.string(),
  gitServer: z.string(),
  gitUrlPath: z.string(),
  jiraIssueMetadataPayload: z.string().nullable().optional(),
  jiraServer: z.string().nullable().optional(),
  lang: z.string(),
  private: z.boolean().default(true),
  repository: z
    .object({
      url: z.string(),
    })
    .nullable(),
  strategy: codebaseCreationStrategyEnum,
  testReportFramework: z.string().nullable().optional(),
  ticketNamePattern: z.string().nullable().optional(),
  type: codebaseTypeEnum,
  versioning: z
    .object({
      startFrom: z.string().nullable().optional(),
      type: codebaseVersioningEnum,
    })
    .required({ type: true }),
});

const codebaseStatusSchema = z.object({
  action: z.string(),
  available: z.boolean(),
  detailedMessage: z.string().optional(),
  failureCount: z.number().int(),
  git: z.string(),
  gitWebUrl: z.string().optional(),
  lastTimeUpdated: z.string().datetime(),
  result: codebaseResultEnum,
  status: codebaseStatusEnum,
  username: z.string(),
  value: z.string(),
  webHookID: z.number().int().optional(),
  webHookRef: z.string().optional(),
});

const codebaseLabelsSchema = krciCommonLabelsSchema.extend({
  [codebaseLabels.codebaseType]: codebaseTypeEnum,
  // [codebaseLabels.gitserver]: gitProviderEnum,
  [codebaseLabels.integration]: z.string().optional(),
  [codebaseLabels.systemType]: z.enum(["gitops"]).optional(),
});

export const codebaseSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    labels: codebaseLabelsSchema,
  }),
  spec: codebaseSpecSchema,
  status: codebaseStatusSchema.optional(),
});

export const codebaseDraftSchema = kubeObjectBaseDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema.extend({
    labels: codebaseLabelsSchema,
  }),
  spec: codebaseSpecSchema,
});

export const editCodebaseInputSchema = z.object({
  jiraServer: codebaseSpecSchema.shape.jiraServer,
  commitMessagePattern: codebaseSpecSchema.shape.commitMessagePattern,
  ticketNamePattern: codebaseSpecSchema.shape.ticketNamePattern,
  jiraIssueMetadataPayload: codebaseSpecSchema.shape.jiraIssueMetadataPayload,
});

export const codebaseSecretSchema = secretSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    name: z.string().regex(/^repository-codebase-[a-zA-Z0-9-]+-temp$/, {
      message: "Name must match repository-codebase-${codebaseName}-temp pattern",
    }),
  }),
  data: z.object({
    username: z.string(),
    password: z.string(),
  }),
});

export const codebaseDraftSecretSchema = secretDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema.extend({
    name: z.string().regex(/^repository-codebase-[a-zA-Z0-9-]+-temp$/, {
      message: "Name must match repository-codebase-${codebaseName}-temp pattern",
    }),
  }),
  data: z.object({
    username: z.string(),
    password: z.string(),
  }),
});

export const createCodebaseDraftSecretInputSchema = z.object({
  codebaseName: z.string(),
  username: z.string(),
  password: z.string(),
});
