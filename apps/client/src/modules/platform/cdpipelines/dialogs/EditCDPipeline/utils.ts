import { NAMES } from "../../pages/create/components/CreateCDPipelineWizard/names";
import type { ApplicationFieldArrayItem } from "./types";

/**
 * Helper to get error for a specific field in the application array.
 * Uses TanStack Form's error structure.
 */
export function getApplicationFieldError(
  errors: Record<string, { message?: string }> | undefined,
  index: number,
  field: keyof ApplicationFieldArrayItem
): { message?: string } | undefined {
  if (!errors) return undefined;
  const key = `${NAMES.ui_applicationsFieldArray}[${index}].${field}`;
  return errors[key];
}
