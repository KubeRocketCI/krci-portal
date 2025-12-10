import { createCDPipelineDraftInputSchema } from "@my-project/shared";
import z from "zod";
import { ValueOf } from "@/core/types/global";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const isEmptyStr = (val: string | null | undefined): boolean => {
  return !val || val.trim().length === 0;
};

// ============================================================================
// EXTENDED SCHEMAS (from single source of truth)
// ============================================================================

// Extend base schemas with additional validation messages
const nameSchema = createCDPipelineDraftInputSchema.shape.name
  .min(2, "Pipeline name must be at least 2 characters long.")
  .max(15, "Pipeline name must be not more than 15 characters long.")
  .regex(/^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/, {
    message:
      "Pipeline name must be at least 2 characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces",
  });

const applicationsSchema = createCDPipelineDraftInputSchema.shape.applications.min(
  1,
  "At least one application is required."
);

const inputDockerStreamsSchema = createCDPipelineDraftInputSchema.shape.inputDockerStreams.min(
  1,
  "At least one input docker stream is required."
);

// ============================================================================
// UI-ONLY FIELDS (New schemas for UI state management)
// ============================================================================

const uiOnlyFields = {
  ui_applicationsToAddChooser: z.array(z.string()).optional().default([]),
  ui_applicationsFieldArray: z
    .array(
      z.object({
        appName: z.string(),
        appBranch: z.string().min(1, "Select branch"),
        appToPromote: z.boolean(),
      })
    )
    .optional()
    .default([]),
  ui_applicationsToPromoteAll: z.boolean().optional().default(false),
};

// ============================================================================
// CORE FIELDS (From original schema + extended versions)
// ============================================================================

const coreFields = {
  // Extended schemas with additional validation
  name: nameSchema,
  applications: applicationsSchema,
  inputDockerStreams: inputDockerStreamsSchema,

  // Direct from original schema
  description: createCDPipelineDraftInputSchema.shape.description,
  deploymentType: createCDPipelineDraftInputSchema.shape.deploymentType,
  applicationsToPromote: createCDPipelineDraftInputSchema.shape.applicationsToPromote,
};

const baseCommonFields = {
  ...coreFields,
  ...uiOnlyFields,
};

// ============================================================================
// VALIDATION HELPERS (Organized by Step)
// ============================================================================

// Create temporary schema to infer type for validation functions
const tempSchema = z.object(baseCommonFields);
type FormData = z.infer<typeof tempSchema>;

/**
 * APPLICATIONS validation (only applications and branches)
 */
const validateApplicationsStep = (data: FormData, ctx: z.RefinementCtx) => {
  // Applications validation
  if (!data.applications || data.applications.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["applications"],
      message: "At least one application is required.",
    });
  }

  // Validate that each application has a branch selected
  if (data.ui_applicationsFieldArray && data.ui_applicationsFieldArray.length > 0) {
    const inputDockerStreams: string[] = [];
    data.ui_applicationsFieldArray.forEach((app, index) => {
      if (isEmptyStr(app.appBranch)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ui_applicationsFieldArray", index, "appBranch"],
          message: "Select branch",
        });
      } else if (app.appBranch) {
        inputDockerStreams.push(app.appBranch);
      }
    });

    // Validate inputDockerStreams based on selected branches
    if (inputDockerStreams.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inputDockerStreams"],
        message: "At least one input docker stream is required.",
      });
    }
  } else {
    // If no applications in field array, validate inputDockerStreams directly
    if (!data.inputDockerStreams || data.inputDockerStreams.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inputDockerStreams"],
        message: "At least one input docker stream is required.",
      });
    }
  }
};

/**
 * PIPELINE CONFIGURATION validation (name, description, deployment type)
 */
const validatePipelineConfigurationStep = (data: FormData, ctx: z.RefinementCtx) => {
  // Pipeline name and description validation
  if (isEmptyStr(data.name)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["name"],
      message: "Pipeline name must be at least 2 characters long.",
    });
  }

  if (isEmptyStr(data.description)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["description"],
      message: "Description is required",
    });
  }
};

// ============================================================================
// MAIN FORM SCHEMA
// ============================================================================

export const createCDPipelineFormSchema = tempSchema
  .superRefine((data, ctx) => {
    // Run all validations independently to prevent cascading issues
    validateApplicationsStep(data, ctx);
    validatePipelineConfigurationStep(data, ctx);
  })
  .transform((data) => {
    return {
      ...data,
      name: typeof data.name === "string" ? data.name.trim() : data.name,
    };
  });

// ============================================================================
// FORM PARTS CONFIGURATION
// ============================================================================

function createNamesObject<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: K } {
  const result = {} as { [K in keyof T]: K };
  for (const key in obj) {
    result[key] = key;
  }
  return result;
}

const baseSchemaForNames = z.object(baseCommonFields);
export const NAMES = createNamesObject(baseSchemaForNames.shape);

export type CreateCDPipelineFormValues = z.infer<typeof createCDPipelineFormSchema>;

export const FORM_PARTS = {
  APPLICATIONS: "applications",
  PIPELINE_CONFIGURATION: "pipelineConfiguration",
} as const;

export type FormPart = ValueOf<typeof FORM_PARTS>;

export const CREATE_FORM_PARTS = {
  [FORM_PARTS.APPLICATIONS]: [
    NAMES.applications,
    NAMES.ui_applicationsToAddChooser,
    NAMES.ui_applicationsFieldArray,
    NAMES.inputDockerStreams,
  ],
  [FORM_PARTS.PIPELINE_CONFIGURATION]: [
    NAMES.name,
    NAMES.description,
    NAMES.deploymentType,
    NAMES.applicationsToPromote,
    NAMES.ui_applicationsToPromoteAll,
  ],
} as const;
