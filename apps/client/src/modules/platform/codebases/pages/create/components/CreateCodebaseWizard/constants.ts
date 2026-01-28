import { baseCommonFields } from "./schema";
import z from "zod";
import { ValueOf } from "@/core/types/global";

function createNamesObject<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: K } {
  const result = {} as { [K in keyof T]: K };
  for (const key in obj) {
    result[key] = key;
  }
  return result;
}

const baseSchemaForNames = z.object(baseCommonFields);
export const NAMES = createNamesObject(baseSchemaForNames.shape);

export const FORM_PARTS = {
  METHOD: "method",
  GIT_SETUP: "gitSetup",
  BUILD_CONFIG: "buildConfig",
} as const;

export type CreationMethod = "template" | "custom";
export type FormPart = ValueOf<typeof FORM_PARTS>;

export const CREATE_FORM_PARTS = {
  [FORM_PARTS.METHOD]: [NAMES.ui_creationMethod, NAMES.ui_creationTemplate, NAMES.type, NAMES.strategy],
  [FORM_PARTS.GIT_SETUP]: [
    NAMES.repositoryUrl,
    NAMES.gitServer,
    NAMES.gitUrlPath,
    NAMES.ui_repositoryOwner,
    NAMES.ui_repositoryName,
    NAMES.defaultBranch,
    NAMES.name,
    NAMES.description,
    NAMES.private,
    NAMES.ui_hasCodebaseAuth,
    NAMES.ui_repositoryLogin,
    NAMES.ui_repositoryPasswordOrApiToken,
  ],
  [FORM_PARTS.BUILD_CONFIG]: [
    NAMES.lang,
    NAMES.framework,
    NAMES.buildTool,
    NAMES.testReportFramework,
    NAMES.deploymentScript,
    NAMES.versioningType,
    NAMES.versioningStartFrom,
    NAMES.ui_versioningStartFromVersion,
    NAMES.ui_versioningStartFromSnapshot,
    NAMES.ciTool,
    NAMES.commitMessagePattern,
    NAMES.ui_hasJiraServerIntegration,
    NAMES.jiraServer,
    NAMES.ticketNamePattern,
    NAMES.ui_advancedMappingFieldName,
    NAMES.ui_advancedMappingJiraPattern,
    NAMES.ui_advancedMappingRows,
    NAMES.jiraIssueMetadataPayload,
    NAMES.emptyProject,
  ],
} as const;
