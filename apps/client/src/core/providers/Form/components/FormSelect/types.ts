import React from "react";
import { SelectOption } from "@/core/providers/Form/types";
import { FieldErrors, Control } from "react-hook-form";

export interface FormSelectProps {
  name: string;
  errors: FieldErrors;
  options: SelectOption[];
  control: Control<never>;
  label?: string;
  title?: string | React.ReactElement;
  defaultValue?: string;
  helperText?: string;
  disabled?: boolean;
}
