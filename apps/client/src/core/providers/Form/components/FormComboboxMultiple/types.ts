import {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";
import { SelectOption } from "../../types";
import { FormFieldProps } from "@/core/components/ui/form-field";

export interface FormComboboxMultipleProps<TFieldValues extends FieldValues = FieldValues> extends Partial<
  UseFormRegisterReturn<Path<TFieldValues>>
> {
  // Controller props
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  defaultValue?: string[];

  // FormField props
  label?: FormFieldProps["label"];
  tooltipText?: FormFieldProps["tooltipText"];
  helperText?: FormFieldProps["helperText"];

  // Combobox props
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  maxShownItems?: number; // Max badges shown before "+N more"
}
