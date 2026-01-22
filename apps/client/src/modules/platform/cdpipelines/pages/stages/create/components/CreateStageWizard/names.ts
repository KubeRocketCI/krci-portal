import { stageQualityGateType } from "@my-project/shared";
import z from "zod";
import { ValueOf } from "@/core/types/global";

const isEmptyStr = (val: string | null | undefined): boolean => {
  return !val || val.trim().length === 0;
};

const nameSchema = z
  .string()
  .min(2, "Environment name must be at least 2 characters long.")
  .max(10, "Environment name must be not more than 10 characters long.")
  .regex(/^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/, {
    message:
      "Environment name must be at least 2 characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces",
  });

const deployNamespaceSchema = z
  .string()
  .min(2, "You must enter at least 2 characters")
  .max(63, "You exceeded the maximum length of 63")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Namespace must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces",
  });

const qualityGateSchema = z.object({
  id: z.string(),
  qualityGateType: z.nativeEnum(stageQualityGateType),
  stepName: z.string(),
  autotestName: z.string().nullable(),
  branchName: z.string().nullable(),
});

const qualityGatesSchema = z.array(qualityGateSchema).min(1, "At least one quality gate is required.");

const uiOnlyFields = {
  ui_qualityGatesTypeAddChooser: z.string().optional(),
};

const coreFields = {
  name: nameSchema,
  deployNamespace: deployNamespaceSchema,
  qualityGates: qualityGatesSchema,
  namespace: z.string(),
  description: z.string().min(1, "Enter description"),
  sourceLibraryBranch: z.string().default("default"),
  sourceLibraryName: z.string().default("default"),
  sourceType: z.string().default("default"),
  triggerType: z.string(),
  order: z.number(),
  cdPipeline: z.string(),
  cluster: z.string().min(1, "Select cluster"),
  triggerTemplate: z.string().min(1, "Select Deploy Pipeline template"),
  cleanTemplate: z.string().min(1, "Select Clean Pipeline template"),
};

const baseCommonFields = {
  ...coreFields,
  ...uiOnlyFields,
};

const tempSchema = z.object(baseCommonFields);
type FormData = z.infer<typeof tempSchema>;

const validateBasicConfigurationStep = (data: FormData, ctx: z.RefinementCtx) => {
  if (isEmptyStr(data.cluster)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cluster"],
      message: "Select cluster",
    });
  }

  if (isEmptyStr(data.name)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["name"],
      message: "Environment name is required",
    });
  }

  if (isEmptyStr(data.deployNamespace)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deployNamespace"],
      message: "Namespace is required",
    });
  }

  if (isEmptyStr(data.description)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["description"],
      message: "Enter description",
    });
  }
};

const validatePipelineConfigurationStep = (data: FormData, ctx: z.RefinementCtx) => {
  if (isEmptyStr(data.triggerType)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["triggerType"],
      message: "Select trigger type",
    });
  }

  if (isEmptyStr(data.triggerTemplate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["triggerTemplate"],
      message: "Select Deploy Pipeline template",
    });
  }

  if (isEmptyStr(data.cleanTemplate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cleanTemplate"],
      message: "Select Clean Pipeline template",
    });
  }
};

const validateQualityGatesStep = (data: FormData, ctx: z.RefinementCtx) => {
  if (!data.qualityGates || data.qualityGates.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["qualityGates"],
      message: "At least one quality gate is required.",
    });
  }
};

// Validation-only schema for use with TanStack Form
// NOTE: Do NOT use .transform() here as it breaks Standard Schema integration
export const createStageFormSchema = tempSchema.superRefine((data, ctx) => {
  validateBasicConfigurationStep(data, ctx);
  validatePipelineConfigurationStep(data, ctx);
  validateQualityGatesStep(data, ctx);
});

// Schema with transformations for final submission
export const createStageSubmitSchema = createStageFormSchema.transform((data) => {
  return {
    ...data,
    name: typeof data.name === "string" ? data.name.trim() : data.name,
  };
});

function createNamesObject<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: K } {
  const result = {} as { [K in keyof T]: K };
  for (const key in obj) {
    result[key] = key;
  }
  return result;
}

const baseSchemaForNames = z.object(baseCommonFields);
export const NAMES = createNamesObject(baseSchemaForNames.shape);

export type CreateStageFormValues = z.infer<typeof createStageFormSchema>;
export type CreateStageFormInput = z.input<typeof createStageFormSchema>;

export const FORM_PARTS = {
  BASIC_CONFIGURATION: "basicConfiguration",
  PIPELINE_CONFIGURATION: "pipelineConfiguration",
  QUALITY_GATES: "qualityGates",
} as const;

export type FormPart = ValueOf<typeof FORM_PARTS>;

export const CREATE_FORM_PARTS = {
  [FORM_PARTS.BASIC_CONFIGURATION]: [NAMES.cluster, NAMES.name, NAMES.deployNamespace, NAMES.description],
  [FORM_PARTS.PIPELINE_CONFIGURATION]: [NAMES.triggerType, NAMES.triggerTemplate, NAMES.cleanTemplate],
  [FORM_PARTS.QUALITY_GATES]: [NAMES.qualityGates],
} as const;
