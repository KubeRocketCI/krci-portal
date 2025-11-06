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
import { ComboboxOption } from "@/core/components/ui/combobox";
import React from "react";

export interface FormComboboxProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  // Controller props
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  defaultValue?: string;

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
  
  // Autocomplete features
  freeSolo?: boolean; // Allow custom input
  loading?: boolean; // Show loading state
  
  // Adornments
  suffix?: React.ReactNode;
  
  // Rendering
  renderOption?: (option: ComboboxOption) => React.ReactNode;
}

