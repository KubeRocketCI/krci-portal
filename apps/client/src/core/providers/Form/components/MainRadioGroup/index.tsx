import {
  ButtonBase,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import clsx from "clsx";
import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { useStyles } from "./styles";
import { TileRadioGroupProps } from "./types";

const TileRadioGroupInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      control,
      errors,
      options,
      gridItemSize,
      helperText: helperTextProp,
      ...props
    }: TileRadioGroupProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const classes = useStyles();
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const helperText = hasError ? errorMessage : helperTextProp;

    return (
      <FormControl fullWidth error={hasError}>
        <Controller
          name={name}
          control={control}
          defaultValue={"" as PathValue<TFormValues, Path<TFormValues>>}
          {...props}
          render={({ field }) => (
            <RadioGroup {...field} row className={classes.radioGroup}>
              <Grid container spacing={2}>
                {options.map(({ value, label, description, icon, checkedIcon, disabled }, idx) => {
                  const isChecked = field.value === value;
                  const key = `${value}::${idx}`;

                  return (
                    <Grid item xs={gridItemSize} key={key}>
                      <ButtonBase
                        className={clsx(classes.radioControlButton, {
                          [classes.radioControlButtonActive]: isChecked,
                        })}
                        disabled={disabled}
                      >
                        <FormControlLabel
                          value={value}
                          control={
                            <Radio
                              checked={isChecked}
                              icon={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {icon}
                                  <Typography variant="h6">{label}</Typography>
                                </Stack>
                              }
                              checkedIcon={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {checkedIcon}
                                  <Typography variant="h6">{label}</Typography>
                                </Stack>
                              }
                              disableRipple
                              inputRef={ref}
                            />
                          }
                          disabled={disabled}
                          label={
                            <Stack
                              spacing={2}
                              style={{ height: description ? "auto" : "100%" }}
                              alignItems={description ? "flex-start" : "center"}
                            >
                              {!!description && (
                                <Typography variant="caption" align="left">
                                  {description}
                                </Typography>
                              )}
                            </Stack>
                          }
                          className={classes.radioControlLabel}
                        />
                      </ButtonBase>
                    </Grid>
                  );
                })}
              </Grid>
            </RadioGroup>
          )}
        />
        {helperText && <FormHelperText error={hasError}>{helperText}</FormHelperText>}
      </FormControl>
    );
  }
);

TileRadioGroupInner.displayName = "TileRadioGroup";

export const TileRadioGroup = TileRadioGroupInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: TileRadioGroupProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
