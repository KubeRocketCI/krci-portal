import React from "react";
import {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";
import { FormFieldProps } from "@/core/components/ui/form-field";

export interface TileRadioGroupOption {
  value: string;
  label: string;
  description?: string;
  icon: React.ReactElement;
  checkedIcon?: React.ReactElement;
  disabled?: boolean;
}

export interface TileRadioGroupProps<TFieldValues extends FieldValues = FieldValues> extends Partial<
  UseFormRegisterReturn<Path<TFieldValues>>
> {
  // Controller props
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  defaultValue?: string;

  // FormField props
  helperText?: FormFieldProps["helperText"];

  // RadioGroup props
  options: TileRadioGroupOption[];
  gridCols?: number;
}
