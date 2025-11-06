import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { TileRadioGroup as UITileRadioGroup } from "@/core/components/ui/tile-radio-group";
import { FormFieldGroup } from "@/core/components/ui/form-field-group";
import { TileRadioGroupProps } from "./types";

const TileRadioGroupInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      control,
      errors,
      options,
      gridCols = 3,
      helperText,
      defaultValue = "",
      ...props
    }: TileRadioGroupProps<TFormValues>,
    ref: React.ForwardedRef<HTMLLabelElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string | undefined;
    const fieldId = React.useId();

    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
        render={({ field }) => (
          <FormFieldGroup error={hasError ? errorMessage : undefined} helperText={helperText} id={fieldId}>
            <UITileRadioGroup
              ref={ref}
              value={(field.value ?? "") as string}
              onValueChange={(value) => field.onChange(value)}
              options={options}
              gridCols={gridCols}
            />
          </FormFieldGroup>
        )}
        {...props}
      />
    );
  }
);

TileRadioGroupInner.displayName = "TileRadioGroup";

export const TileRadioGroup = TileRadioGroupInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: TileRadioGroupProps<TFormValues> & { ref?: React.ForwardedRef<HTMLLabelElement> }
) => React.JSX.Element;
