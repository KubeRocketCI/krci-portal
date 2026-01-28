import z from "zod";
import { containerRegistryTypeEnum } from "@my-project/shared";

/**
 * Unified field names for the Registry integration form
 */
export const NAMES = {
  // ConfigMap fields
  REGISTRY_TYPE: "registryType",
  REGISTRY_ENDPOINT: "registryEndpoint",
  REGISTRY_SPACE: "registrySpace",
  AWS_REGION: "awsRegion",

  // ServiceAccount fields (ECR only)
  IRSA_ROLE_ARN: "irsaRoleArn",

  // PushAccount Secret fields
  PUSH_ACCOUNT_USER: "pushAccountUser",
  PUSH_ACCOUNT_PASSWORD: "pushAccountPassword",

  // PullAccount Secret fields
  PULL_ACCOUNT_USER: "pullAccountUser",
  PULL_ACCOUNT_PASSWORD: "pullAccountPassword",

  // UI helper field
  USE_SAME_ACCOUNT: "useSameAccount",
} as const;

/**
 * Unified form schema for Registry integration
 * Validates all fields in a single form
 */
export const manageRegistryFormSchema = z.object({
  // ConfigMap fields
  [NAMES.REGISTRY_TYPE]: containerRegistryTypeEnum,
  [NAMES.REGISTRY_ENDPOINT]: z.string().optional(),
  [NAMES.REGISTRY_SPACE]: z.string().min(1, "Registry space is required"),
  [NAMES.AWS_REGION]: z.string().optional(),

  // ServiceAccount fields (ECR only)
  [NAMES.IRSA_ROLE_ARN]: z.string().optional(),

  // PushAccount Secret fields
  [NAMES.PUSH_ACCOUNT_USER]: z.string().optional(),
  [NAMES.PUSH_ACCOUNT_PASSWORD]: z.string().optional(),

  // PullAccount Secret fields
  [NAMES.PULL_ACCOUNT_USER]: z.string().min(1, "Pull account username is required"),
  [NAMES.PULL_ACCOUNT_PASSWORD]: z.string().min(1, "Pull account password is required"),

  // UI helper field
  [NAMES.USE_SAME_ACCOUNT]: z.boolean().optional(),
});

export type ManageRegistryFormValues = z.infer<typeof manageRegistryFormSchema>;
