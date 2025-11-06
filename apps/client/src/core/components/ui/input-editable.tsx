import * as React from "react";
import { Input, InputProps } from "@/core/components/ui/input";
import { FormField, FormFieldProps } from "@/core/components/ui/form-field";
import { Button } from "@/core/components/ui/button";
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/core/components/ui/tooltip";
import { Pencil, X } from "lucide-react";
import { cn } from "@/core/utils/classname";

export interface InputEditableProps extends Omit<FormFieldProps, "children" | "suffix" | "prefix"> {
  initiallyEditable?: boolean;
  inputProps?: Partial<Omit<InputProps, "invalid">>;
}

export const InputEditable = React.forwardRef<HTMLInputElement, InputEditableProps>(
  (
    {
      initiallyEditable = false,
      disabled = false,
      label,
      tooltipText,
      helperText,
      error,
      required,
      id,
      className,
      inputProps = {},
      ...formFieldProps
    },
    ref
  ) => {
    const fieldId = React.useId();
    const finalId = id || fieldId;
    const [isEditable, setIsEditable] = React.useState(initiallyEditable);

    const toggleEditable = React.useCallback(() => {
      setIsEditable((prev) => !prev);
    }, []);

    const editButton = disabled ? null : (
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" onClick={toggleEditable} className="px-5">
            {isEditable ? <X size={16} /> : <Pencil size={16} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isEditable ? "Cancel editing" : "Edit"}</TooltipContent>
      </TooltipRoot>
    );

    const hasError = !!error;

    return (
      <FormField
        label={label}
        tooltipText={tooltipText}
        helperText={helperText}
        error={error}
        required={required}
        disabled={disabled}
        id={finalId}
        suffix={editButton}
        className={className}
        {...formFieldProps}
      >
        <Input
          ref={ref}
          id={finalId}
          disabled={disabled || !isEditable}
          invalid={hasError}
          className={cn("rounded-none border-0", inputProps.className)}
          {...inputProps}
        />
      </FormField>
    );
  }
);

InputEditable.displayName = "InputEditable";
