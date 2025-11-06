import * as React from "react";
import { Textarea, TextareaProps } from "@/core/components/ui/textarea";
import { FormField, FormFieldProps } from "@/core/components/ui/form-field";
import { Button } from "@/core/components/ui/button";
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/core/components/ui/tooltip";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/core/utils/classname";

export interface TextareaPasswordProps extends Omit<FormFieldProps, "children" | "suffix" | "prefix"> {
  showToggle?: boolean;
  textareaProps?: Partial<Omit<TextareaProps, "invalid">>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const TextareaPassword = React.forwardRef<HTMLTextAreaElement, TextareaPasswordProps>(
  (
    {
      showToggle = true,
      disabled = false,
      label,
      tooltipText,
      helperText,
      error,
      required,
      id,
      className,
      textareaProps = {},
      value = "",
      onChange,
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
          <Button type="button" variant="ghost" size="icon" onClick={handleToggleVisibility} className="px-5">
            {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle visibility</TooltipContent>
      </TooltipRoot>
    ) : null;

    const hasError = !!error;
    const displayValue = isVisible ? value : "•".repeat(Math.max(0, value.length));

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isVisible && onChange) {
        onChange(e);
      }
    };

    return (
      <FormField
        label={label}
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
        <Textarea
          ref={ref}
          id={finalId}
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          readOnly={!isVisible}
          invalid={hasError}
          className={cn("rounded-none border-0", textareaProps.className)}
          {...textareaProps}
        />
      </FormField>
    );
  }
);

TextareaPassword.displayName = "TextareaPassword";

