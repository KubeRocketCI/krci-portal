import {
  ButtonBase,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Radio,
  RadioGroup,
  Tooltip,
} from "@mui/material";
import clsx from "clsx";
import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { ConditionalWrapper } from "../../../../components/ConditionalWrapper";
import { FormControlLabelWithTooltip } from "../FormControlLabelWithTooltip";
import { useStyles } from "./styles";
import { FormRadioGroupProps } from "./types";

const FormRadioGroupInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      control,
      errors,
      label,
      tooltipText,
      options,
      disabled = false,
      helperText: helperTextProp,
      defaultValue,
      ...props
    }: FormRadioGroupProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const helperText = hasError ? errorMessage : helperTextProp;

    const classes = useStyles();

    return (
      <Grid container spacing={1}>
        <Grid item xs={12} style={{ display: "flex" }}>
          <FormControl error={hasError} component="fieldset" fullWidth>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <FormControlLabelWithTooltip label={label} title={tooltipText} />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name={name}
                  control={control}
                  defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
                  {...props}
                  render={({ field }) => (
                    <RadioGroup {...field} row className={classes.radioGroup}>
                      {options.map(
                        ({ value, label, icon, checkedIcon, disabled: optionDisabled, disabledTooltip }, idx) => {
                          const isChecked = field.value === value;
                          const key = `${value}::${idx}`;
                          return (
                            <ConditionalWrapper
                              condition={!!disabledTooltip}
                              wrapper={(children) => (
                                <Tooltip key={key} title={disabledTooltip}>
                                  <div>{children}</div>
                                </Tooltip>
                              )}
                              key={key}
                            >
                              <ButtonBase
                                className={clsx(classes.radioControlButton, {
                                  [classes.radioControlButtonActive]: isChecked,
                                })}
                                disabled={disabled || optionDisabled}
                              >
                                <FormControlLabel
                                  value={value}
                                  control={
                                    <Radio
                                      color="primary"
                                      checked={isChecked}
                                      icon={icon}
                                      checkedIcon={checkedIcon}
                                      disableRipple
                                      inputRef={ref}
                                    />
                                  }
                                  className={clsx(classes.radioControlLabel, {
                                    [classes.radioControlLabelDisabled]: disabled || optionDisabled,
                                  })}
                                  label={label}
                                />
                              </ButtonBase>
                            </ConditionalWrapper>
                          );
                        }
                      )}
                    </RadioGroup>
                  )}
                />
              </Grid>
            </Grid>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>
    );
  }
);

FormRadioGroupInner.displayName = "FormRadioGroup";

export const FormRadioGroup = FormRadioGroupInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormRadioGroupProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
