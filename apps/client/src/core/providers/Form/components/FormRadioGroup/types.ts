import React from "react";
import { Control, FieldErrors } from "react-hook-form";

export interface FormRadioOption {
  value: string;
  label: string;
  icon: React.ReactElement;
  checkedIcon: React.ReactElement;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface FormRadioProps {
  name: string;
  control: Control<never>;
  errors: FieldErrors;
  options: FormRadioOption[];
  label: string;
  title?: string;
  disabled?: boolean;
}
