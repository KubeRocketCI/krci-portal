// Core form infrastructure for TanStack Form
// Uses createFormHook pattern for type-safe, ergonomic form components

import { createFormHook } from "@tanstack/react-form";

// Import contexts from separate file to avoid circular dependencies
import { fieldContext, formContext } from "./form-context";

// Re-export context hooks for external use
export { useFieldContext, useFormContext, fieldContext, formContext } from "./form-context";

// Import all field components (these use useFieldContext internally)
import { FormTextField } from "./components/FormTextField";
import { FormTextFieldPassword } from "./components/FormTextFieldPassword";
import { FormSelect } from "./components/FormSelect";
import { FormCombobox } from "./components/FormCombobox";
import { FormCheckbox } from "./components/FormCheckbox";
import { FormCheckboxGroup } from "./components/FormCheckboxGroup";
import { FormSwitch } from "./components/FormSwitch";
import { FormSwitchRich } from "./components/FormSwitchRich";
import { FormRadioGroup } from "./components/FormRadioGroup";
import { FormTextarea } from "./components/FormTextarea";
import { FormTextareaPassword } from "./components/FormTextareaPassword";
import { FormControlLabelWithTooltip } from "./components/FormControlLabelWithTooltip";
import { SwitchGroup } from "./components/SwitchGroup";

// Import form-level components (these use useFormContext internally)
import { FormSubmitButton } from "./components/FormSubmitButton";
import { FormResetButton } from "./components/FormResetButton";

// Re-export types
export type { SelectOption } from "./types";

// Re-export all component types
export type { FormTextFieldProps } from "./components/FormTextField";
export type { FormTextFieldPasswordProps } from "./components/FormTextFieldPassword";
export type { FormSelectProps } from "./components/FormSelect";
export type { FormComboboxProps } from "./components/FormCombobox";
export type { FormCheckboxProps } from "./components/FormCheckbox";
export type { FormCheckboxGroupProps, FormCheckboxOption } from "./components/FormCheckboxGroup";
export type { FormSwitchProps } from "./components/FormSwitch";
export type { FormSwitchRichProps } from "./components/FormSwitchRich";
export type { FormRadioGroupProps, FormRadioOption } from "./components/FormRadioGroup";
export type { FormTextareaProps } from "./components/FormTextarea";
export type { FormTextareaPasswordProps } from "./components/FormTextareaPassword";
export type { FormControlLabelWithTooltipProps } from "./components/FormControlLabelWithTooltip";
export type { SwitchGroupProps, SwitchGroupItem } from "./components/SwitchGroup";
export type { FormSubmitButtonProps } from "./components/FormSubmitButton";
export type { FormResetButtonProps } from "./components/FormResetButton";

// Re-export components for direct import if needed
export {
  FormTextField,
  FormTextFieldPassword,
  FormSelect,
  FormCombobox,
  FormCheckbox,
  FormCheckboxGroup,
  FormSwitch,
  FormSwitchRich,
  FormRadioGroup,
  FormTextarea,
  FormTextareaPassword,
  FormControlLabelWithTooltip,
  SwitchGroup,
  FormSubmitButton,
  FormResetButton,
};

// Define field components map (unified components only)
// These components will be accessible via form.AppField children render prop
// Note: SwitchGroup is NOT included here because it's a container component
// that creates multiple fields, not a single field component
const fieldComponents = {
  FormTextField,
  FormTextFieldPassword,
  FormSelect,
  FormCombobox,
  FormCheckbox,
  FormCheckboxGroup,
  FormSwitch,
  FormSwitchRich,
  FormRadioGroup,
  FormTextarea,
  FormTextareaPassword,
  FormControlLabelWithTooltip,
};

// Define form-level components (Submit button, Reset button, etc.)
// These components will be accessible via form.AppForm children render prop
const formComponents = {
  FormSubmitButton,
  FormResetButton,
};

// Create the typed form hook
// This hook returns a form instance with:
// - form.AppField: renders a field with access to registered field components
// - form.AppForm: renders form-level components with access to form context
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents,
  formComponents,
});

// Re-export types for external use
export type AppFormFieldComponents = typeof fieldComponents;
export type AppFormComponents = typeof formComponents;

// Re-export utilities
export { extractErrorMessage } from "./utils/extractErrorMessage";
