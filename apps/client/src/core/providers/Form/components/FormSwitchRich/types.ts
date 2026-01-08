import React from "react";
import { Control, FieldErrors, FieldPath, FieldValues, Path, UseFormRegisterReturn } from "react-hook-form";

export interface FormSwitchProps<TFieldValues extends FieldValues = FieldValues> extends Partial<
  UseFormRegisterReturn<Path<TFieldValues>>
> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label?: React.ReactNode;
  helperText?: string;
  errors: FieldErrors<TFieldValues>;
  defaultValue?: boolean;
  disabled?: boolean;
  labelPlacement?: "start" | "end";
  icon?: React.ReactNode;
  variant?: "card" | "list";
  expandableContent?: React.ReactNode;
}
