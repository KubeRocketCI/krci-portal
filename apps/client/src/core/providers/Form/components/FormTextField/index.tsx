import { FormControl, TextField, Tooltip } from "@mui/material";
import { Info } from "lucide-react";
import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { FormTextFieldProps } from "./types";

const FormTextFieldInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      control,
      defaultValue = "",
      errors,
      placeholder,
      disabled = false,
      TextFieldProps = {},
      ...props
    }: FormTextFieldProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const helperText = hasError ? errorMessage : TextFieldProps?.helperText;

    const originalInputProps = TextFieldProps.InputProps ?? {};
    const userEndAdornment = originalInputProps.endAdornment;

    const mergedInputProps = {
      ...originalInputProps,
      endAdornment: (
        <div className="flex flex-row items-center gap-1">
          {userEndAdornment}
          {tooltipText && (
            <Tooltip title={tooltipText}>
              <Info size={16} />
            </Tooltip>
          )}
        </div>
      ),
    };

    return (
      <div className="flex flex-col gap-2">
        <FormControl fullWidth>
          <Controller
            name={name}
            control={control}
            defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
            render={({ field }) => (
              <TextField
                {...TextFieldProps}
                {...field}
                inputRef={ref}
                placeholder={placeholder}
                disabled={disabled}
                error={hasError}
                label={label}
                InputProps={mergedInputProps}
                helperText={helperText}
                aria-describedby={hasError ? `${name}-error` : undefined}
              />
            )}
            {...props}
          />
        </FormControl>
      </div>
    );
  }
);

FormTextFieldInner.displayName = "FormTextField";

export const FormTextField = FormTextFieldInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormTextFieldProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
