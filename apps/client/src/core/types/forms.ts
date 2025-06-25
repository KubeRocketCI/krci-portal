import { ValueOf } from "./global";

export interface FormNameObject {
  name: string;
  formPart?: string;
  path?: string[];
  notUsedInFormData?: boolean;
  value?: unknown;
}
export interface FormNamesObject {
  [key: string]: FormNameObject;
}
export type FormValues<T extends FormNamesObject> = Record<keyof T, unknown>;

export interface BackwardNameMappingChildren {
  formItemName?: string;
  children?: {
    [key: string]: BackwardNameMappingChildren;
  };
}
export interface BackwardNameMapping {
  [key: string]: {
    children?: {
      [key: string]: BackwardNameMappingChildren;
    };
  };
}

export interface SelectOption<Value extends string> {
  label: Value;
  value: Value;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface FieldEventTarget<ValueType = unknown> {
  name: string;
  value: ValueType;
}

export interface FieldEvent<ValueType = unknown> {
  target: FieldEventTarget<ValueType>;
}

export const FORM_MODES = {
  CREATE: "create",
  EDIT: "edit",
} as const;

export type FormMode = ValueOf<typeof FORM_MODES>;
