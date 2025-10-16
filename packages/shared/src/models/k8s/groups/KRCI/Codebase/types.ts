import z from "zod";
import {
  codebaseCreationStrategyEnum,
  codebaseDeploymentScriptEnum,
  codebaseDraftSchema,
  codebaseDraftSecretSchema,
  codebaseSchema,
  codebaseSecretSchema,
  codebaseStatusEnum,
  codebaseTestReportFrameworkEnum,
  codebaseTypeEnum,
  codebaseVersioningEnum,
  createCodebaseDraftInputSchema,
  createCodebaseDraftSecretInputSchema,
  editCodebaseInputSchema,
} from "./schema";

export type Codebase = z.infer<typeof codebaseSchema>;
export type CodebaseDraft = z.infer<typeof codebaseDraftSchema>;
export type CreateCodebaseDraftInput = z.infer<
  typeof createCodebaseDraftInputSchema
>;
export type EditCodebaseInput = z.infer<typeof editCodebaseInputSchema>;

export type CodebaseSecret = z.infer<typeof codebaseSecretSchema>;
export type CodebaseDraftSecret = z.infer<typeof codebaseDraftSecretSchema>;
export type CreateCodebaseDraftSecretInput = z.infer<
  typeof createCodebaseDraftSecretInputSchema
>;

export type CodebaseType = z.infer<typeof codebaseTypeEnum>;
export type CodebaseCreationStrategy = z.infer<
  typeof codebaseCreationStrategyEnum
>;
export type CodebaseStatus = z.infer<typeof codebaseStatusEnum>;
export type CodebaseVersioning = z.infer<typeof codebaseVersioningEnum>;
export type CodebaseDeploymentScript = z.infer<
  typeof codebaseDeploymentScriptEnum
>;
export type CodebaseTestReportFramework = z.infer<
  typeof codebaseTestReportFrameworkEnum
>;
