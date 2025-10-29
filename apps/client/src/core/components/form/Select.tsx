import React from "react";
import type {
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldAsyncValidateOrFn,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select as MuiSelect,
  Tooltip,
} from "@mui/material";
import { Info } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: React.ReactElement;
}

export interface SelectProps<
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
> {
  field: FieldApi<
    Values, // TParentData
    TName, // TName
    DeepValue<Values, TName>, // TData
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnMount
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnChange
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnChangeAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnBlur
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnBlurAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnSubmit
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnSubmitAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnDynamic
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnDynamicAsync
    FormValidateOrFn<Values> | undefined, // TFormOnMount
    FormValidateOrFn<Values> | undefined, // TFormOnChange
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnChangeAsync
    FormValidateOrFn<Values> | undefined, // TFormOnBlur
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnBlurAsync
    FormValidateOrFn<Values> | undefined, // TFormOnSubmit
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnSubmitAsync
    FormValidateOrFn<Values> | undefined, // TFormOnDynamic
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnDynamicAsync
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnServer
    never // TParentSubmitMeta
  >;
  label?: string;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  disabled?: boolean;
  options: SelectOption[];
}

export const Select = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
>({
  field,
  label,
  placeholder,
  tooltipText,
  disabled = false,
  options,
}: SelectProps<Values, TName>) => {
  const error = field.state.meta.errors?.[0];
  const hasError = !!error;
  const helperText = hasError ? (error as string) : undefined;

  const getOptionValue = React.useCallback(
    (optionValue: string) => {
      if (options.length) {
        const foundOption = options.find(({ value }) => value === optionValue);
        if (foundOption) {
          return foundOption.icon ? (
            <div className="flex gap-4 flex-row items-center">
              <ListItemIcon sx={{ minWidth: 0 }}>{foundOption.icon}</ListItemIcon>
              <ListItemText>{foundOption.label}</ListItemText>
            </div>
          ) : (
            foundOption.label
          );
        }
      }
      return placeholder || "";
    },
    [placeholder, options]
  );

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <MuiSelect
        value={field.state.value as string}
        onChange={(e) => field.handleChange(e.target.value as never)}
        onBlur={field.handleBlur}
        error={hasError}
        displayEmpty
        disabled={disabled}
        fullWidth
        label={label}
        renderValue={(value) => (value !== "" ? getOptionValue(value as string) : placeholder)}
        endAdornment={
          tooltipText ? (
            <div
              className="absolute top-1/2 right-6 leading-none"
              style={{ transform: "translateY(-50%)" }}
            >
              <div className="flex flex-row items-center gap-1">
                <Tooltip title={tooltipText}>
                  <Info size={16} />
                </Tooltip>
              </div>
            </div>
          ) : undefined
        }
      >
        {options.map(({ label: optionLabel, value, disabled: optionDisabled = false, icon }, idx) => {
          const key = `${optionLabel}::${idx}`;

          return (
            <MenuItem value={value} key={key} disabled={optionDisabled}>
              {icon && <ListItemIcon>{icon}</ListItemIcon>}
              <ListItemText>{optionLabel}</ListItemText>
            </MenuItem>
          );
        })}
      </MuiSelect>
      {helperText && <FormHelperText error={hasError}>{helperText}</FormHelperText>}
    </FormControl>
  );
};
