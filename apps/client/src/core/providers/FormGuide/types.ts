export interface FormGuideFieldDescription {
  fieldName: string;
  label: string;
  description: string;
  notes?: string[];
  visibilityHint?: string;
}

export interface FormGuideStep {
  id: number;
  label: string;
  sublabel: string;
}

export interface FormGuideContextValue {
  isOpen: boolean;
  toggle: () => void;
  currentStep: FormGuideStep | undefined;
  fields: FormGuideFieldDescription[];
  docUrl?: string;
}
