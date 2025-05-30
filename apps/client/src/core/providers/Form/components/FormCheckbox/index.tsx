import { Checkbox, FormControl, FormControlLabel, FormHelperText, Stack } from "@mui/material";
import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { FormCheckboxProps } from "./types";

const FormCheckboxInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      control,
      errors,
      defaultValue = false,
      disabled,
      helperText: helperTextProp,
      ...props
    }: FormCheckboxProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const helperText = hasError ? errorMessage : helperTextProp;

    return (
      <Stack spacing={1}>
        <FormControl fullWidth error={hasError}>
          <Controller
            name={name}
            control={control}
            defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
            {...props}
            render={({ field }) => (
              <FormControlLabel
                style={{ margin: 0 }}
                control={
                  <Checkbox
                    {...field}
                    inputRef={ref}
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={disabled}
                    color="primary"
                    sx={{ translate: "-9px 0" }}
                  />
                }
                label={<span style={{ display: "inline-block", marginTop: "2px" }}>{label}</span>}
              />
            )}
          />
          {helperText && <FormHelperText error={hasError}>{helperText}</FormHelperText>}
        </FormControl>
      </Stack>
    );
  }
);

FormCheckboxInner.displayName = "FormCheckbox";

export const FormCheckbox = FormCheckboxInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormCheckboxProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
