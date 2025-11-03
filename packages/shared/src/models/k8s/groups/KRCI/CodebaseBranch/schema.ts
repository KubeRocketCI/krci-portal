import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../common";
import { codebaseBranchLabels } from "./labels";
import { krciCommonLabelsSchema } from "../common";

export const codebaseBranchStatusEnum = z.enum(["created", "initialized", "in_progress", "failed"]);

export const codebaseBranchResultEnum = z.enum(["success", "error"]);

const codebaseBranchSpecSchema = z.object({
  branchName: z.string(),
  codebaseName: z.string(),
  fromCommit: z.string(),
  pipelines: z.record(z.string()).nullable().optional(),
  release: z.boolean(),
  version: z.string().nullable().optional(),
});

const codebaseBranchStatusSchema = z.object({
  action: z.string(),
  build: z.string().nullable().optional(),
  detailedMessage: z.string().optional(),
  failureCount: z.number().int(),
  git: z.string().optional(),
  lastSuccessfulBuild: z.string().nullable().optional(),
  lastTimeUpdated: z.string().datetime(),
  result: codebaseBranchResultEnum,
  status: codebaseBranchStatusEnum,
  username: z.string(),
  value: z.string(),
  versionHistory: z.array(z.string()).nullable().optional(),
});

const codebaseBranchLabelsSchema = krciCommonLabelsSchema.extend({
  [codebaseBranchLabels.codebase]: z.string(),
});

export const codebaseBranchSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    labels: codebaseBranchLabelsSchema,
  }),
  spec: codebaseBranchSpecSchema,
  status: codebaseBranchStatusSchema.optional(),
});

export const codebaseBranchDraftSchema = kubeObjectBaseDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema.extend({
    labels: codebaseBranchLabelsSchema,
  }),
  spec: codebaseBranchSpecSchema,
});
