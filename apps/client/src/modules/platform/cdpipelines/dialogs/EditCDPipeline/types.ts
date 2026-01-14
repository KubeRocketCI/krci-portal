import { FieldError, FieldErrors } from "react-hook-form";
import { CreateCDPipelineFormValues } from "../../pages/create/components/CreateCDPipelineWizard/names";
import { CDPipeline } from "@my-project/shared";

/**
 * Form values for editing a CD Pipeline
 * Reuses the create form structure
 */
export type EditCDPipelineFormValues = Pick<
  CreateCDPipelineFormValues,
  | "description"
  | "applications"
  | "inputDockerStreams"
  | "applicationsToPromote"
  | "ui_applicationsToAddChooser"
  | "ui_applicationsFieldArray"
  | "ui_applicationsToPromoteAll"
>;

/**
 * Application field array item type
 */
export interface ApplicationFieldArrayItem {
  appName: string;
  appBranch: string;
  appToPromote: boolean;
}

/**
 * Application field array item with React Hook Form id
 */
export type ApplicationFieldArrayItemWithId = ApplicationFieldArrayItem & { id: string };

/**
 * Type-safe access to field array errors
 */
export type ApplicationFieldArrayErrors = FieldErrors<{
  ui_applicationsFieldArray?: ApplicationFieldArrayItem[];
}>;

/**
 * Helper to get error for a specific field in the array
 */
export function getApplicationFieldError(
  errors: FieldErrors,
  index: number,
  field: keyof ApplicationFieldArrayItem
): FieldError | undefined {
  const arrayErrors = errors.ui_applicationsFieldArray;
  if (!arrayErrors || !Array.isArray(arrayErrors)) {
    return undefined;
  }
  const itemError = arrayErrors[index];
  if (!itemError || typeof itemError !== "object") {
    return undefined;
  }
  return itemError[field] as FieldError | undefined;
}

/**
 * Dialog props type
 */
export interface EditCDPipelineDialogProps {
  props: {
    CDPipeline: CDPipeline;
  };
  state: {
    open: boolean;
    closeDialog: () => void;
  };
}
