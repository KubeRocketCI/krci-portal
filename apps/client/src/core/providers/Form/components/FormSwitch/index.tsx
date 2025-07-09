import { FormControl, FormControlLabel, FormHelperText, Switch } from "@mui/material";
import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { FormSwitchProps } from "./types";

const FormSwitchInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      control,
      errors,
      defaultValue = false,
      disabled,
      labelPlacement = "end",
      ...props
    }: FormSwitchProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;

    return (
      <FormControl>
        <Controller
          render={({ field }) => {
            return (
              <FormControlLabel
                style={{ margin: 0 }}
                control={
                  <Switch
                    {...field}
                    color={"primary"}
                    checked={!!field.value}
                    inputRef={ref}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "2px",
                    }}
                  >
                    {label}
                  </span>
                }
                labelPlacement={labelPlacement}
              />
            );
          }}
          defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
          name={name}
          control={control}
          {...props}
        />
        {hasError && <FormHelperText error>{errorMessage}</FormHelperText>}
      </FormControl>
    );
  }
);

FormSwitchInner.displayName = "FormSwitch";

export const FormSwitch = FormSwitchInner as <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
  props: FormSwitchProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
