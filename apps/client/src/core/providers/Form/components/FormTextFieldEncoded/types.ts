import { Control, FieldErrors } from "react-hook-form";
import { InputProps } from "@/core/components/ui/input";

export interface FormTextFieldProps {
  name: string;
  control: Control<never>;
  errors: FieldErrors;
  label?: string;
  title?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  partiallyDisabled?: boolean;
  InputProps?: Partial<InputProps>;
  TextFieldProps?: Record<string, unknown>; // Legacy prop, kept for compatibility
}
