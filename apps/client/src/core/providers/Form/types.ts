import { UseFormProps } from "react-hook-form";

export interface FormContextProviderValue<FormData = object> {
  formData: FormData;
}

export interface FormContextProviderProps<FormData = object> {
  children: React.ReactNode;
  formSettings: UseFormProps;
  formData?: FormData;
}
export interface SelectOption {
  label: string | React.ReactNode;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}
