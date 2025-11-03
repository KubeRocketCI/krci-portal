import { UseFormReturn } from "react-hook-form";
import { FORM_MODES } from "../../types/forms";
import { ValueOf } from "../../types/global";

export type MultiFormItem<FormValues extends Record<string, unknown> = Record<string, unknown>> = {
  mode: ValueOf<typeof FORM_MODES>;
  form: UseFormReturn<FormValues>;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  allowedToSubmit: {
    isAllowed: boolean;
    reason: string | undefined;
  };
};

export interface MultiFormContextProviderValue<FormName extends string> {
  forms: { [formName in FormName]: MultiFormItem };
  sharedForm: UseFormReturn<Record<string, unknown>>;
  resetAll: () => void;
  submitAll: (dirty?: boolean) => Promise<boolean>;
  isAnyFormDirty: boolean;
  isAnyFormForbiddenToSubmit: boolean;
  isAnyFormSubmitting: boolean;
}

export interface MultiFormContextProviderProps<FormName extends string> {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forms: Record<FormName, MultiFormItem<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedForm?: UseFormReturn<any>;
}
