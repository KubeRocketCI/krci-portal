import { ButtonBase, FormControl, FormControlLabel, FormHelperText, Radio, RadioGroup } from "@mui/material";
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

    // Convert MUI GridSize to Tailwind grid columns (12/gridItemSize)
    const getGridColsClass = (size: number | string | boolean | undefined): string => {
      if (typeof size === "number") {
        const cols = 12 / size;
        if (cols === 1) return "grid-cols-1";
        if (cols === 2) return "grid-cols-2";
        if (cols === 3) return "grid-cols-3";
        if (cols === 4) return "grid-cols-4";
        if (cols === 6) return "grid-cols-6";
        return "grid-cols-12";
      }
      return "grid-cols-12";
    };

    const gridColsClass = getGridColsClass(gridItemSize);

    return (
      <FormControl fullWidth error={hasError}>
        <Controller
          name={name}
          control={control}
          defaultValue={"" as PathValue<TFormValues, Path<TFormValues>>}
          {...props}
          render={({ field }) => (
            <RadioGroup {...field} row className={classes.radioGroup}>
              <div className={`grid ${gridColsClass} gap-4`}>
                {options.map(({ value, label, description, icon, checkedIcon, disabled }, idx) => {
                  const isChecked = field.value === value;
                  const key = `${value}::${idx}`;

                  return (
                    <div key={key}>
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
                                <div className="flex flex-row items-center gap-2">
                                  {icon}
                                  <h6 className="text-base font-medium">{label}</h6>
                                </div>
                              }
                              checkedIcon={
                                <div className="flex flex-row items-center gap-2">
                                  {checkedIcon}
                                  <h6 className="text-base font-medium">{label}</h6>
                                </div>
                              }
                              disableRipple
                              inputRef={ref}
                            />
                          }
                          disabled={disabled}
                          label={
                            <div
                              className={`flex flex-col gap-4 ${description ? "items-start" : "items-center"}`}
                              style={{ height: description ? "auto" : "100%" }}
                            >
                              {!!description && <span className="text-left text-xs">{description}</span>}
                            </div>
                          }
                          className={classes.radioControlLabel}
                        />
                      </ButtonBase>
                    </div>
                  );
                })}
              </div>
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
