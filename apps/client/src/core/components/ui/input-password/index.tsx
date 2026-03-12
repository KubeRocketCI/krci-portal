import * as React from "react";
import { Input, InputProps } from "@/core/components/ui/input";
import { FormField, FormFieldProps } from "@/core/components/ui/form-field";
import { Button } from "@/core/components/ui/button";
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/core/components/ui/tooltip";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { cn } from "@/core/utils/classname";

export interface InputPasswordProps extends Omit<FormFieldProps, "children" | "suffix" | "prefix"> {
  showToggle?: boolean;
  showSecretIcon?: boolean;
  inputProps?: Partial<Omit<InputProps, "invalid" | "type">>;
}

export const InputPassword = React.forwardRef<HTMLInputElement, InputPasswordProps>(
  (
    {
      showToggle = true,
      showSecretIcon = true,
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
    const [isVisible, setIsVisible] = React.useState(false);

    const handleToggleVisibility = () => {
      setIsVisible((prev) => !prev);
    };

    const toggleButton = showToggle ? (
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="dark"
            size="icon"
            onClick={handleToggleVisibility}
            className="rounded-tl-none rounded-bl-none px-5"
          >
            {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle visibility</TooltipContent>
      </TooltipRoot>
    ) : null;

    const hasError = !!error;

    const enhancedLabel =
      label && showSecretIcon ? (
        <span className="inline-flex items-center gap-1.5">
          <KeyRound size={14} className="text-muted-foreground" />
          {label}
        </span>
      ) : (
        label
      );

    return (
      <FormField
        label={enhancedLabel}
        tooltipText={tooltipText}
        helperText={helperText}
        error={error}
        required={required}
        disabled={disabled}
        id={finalId}
        suffix={toggleButton}
        className={className}
        {...formFieldProps}
      >
        <Input
          ref={ref}
          id={finalId}
          type={isVisible ? "text" : "password"}
          autoComplete="off"
          disabled={disabled}
          invalid={hasError}
          className={cn("rounded-none border-0", inputProps.className)}
          {...inputProps}
        />
      </FormField>
    );
  }
);

InputPassword.displayName = "InputPassword";
