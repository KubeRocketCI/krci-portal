import React from "react";
import { create } from "zustand";
import { FORM_PARTS, FormPart } from "./names";
import { Settings, Package, Check } from "lucide-react";

export interface WizardStore {
  currentStepIdx: number;
  validatedSteps: Set<FormPart>;
  setCurrentStepIdx: (idx: number) => void;
  getCurrentStep: () => WizardStep | undefined;
  getCurrentFormPart: () => FormPart | undefined;
  markStepAsValidated: (step: FormPart) => void;
  isStepValidated: (step: FormPart) => boolean;
  reset: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const INITIAL_STEP_IDX = 1;

export interface WizardStep {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  formPart?: FormPart;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    label: "Applications",
    sublabel: "Select applications",
    icon: Package,
    formPart: FORM_PARTS.APPLICATIONS,
  },
  {
    id: 2,
    label: "Pipeline Configuration",
    sublabel: "Configure pipeline settings",
    icon: Settings,
    formPart: FORM_PARTS.PIPELINE_CONFIGURATION,
  },
  {
    id: 3,
    label: "Review",
    sublabel: "Review and create",
    icon: Check,
  },
  {
    id: 4,
    label: "Success",
    sublabel: "Success",
    icon: Check,
  },
];

// Steps that can be navigated to (all steps except SUCCESS)
export const NAVIGABLE_STEP_IDXS = WIZARD_STEPS.filter((step) => step.id !== 4).map((step) => step.id);

export const useWizardStore = create<WizardStore>((set, get) => ({
  currentStepIdx: INITIAL_STEP_IDX,
  validatedSteps: new Set<FormPart>(),

  setCurrentStepIdx: (idx: number) => {
    const step = WIZARD_STEPS.find((s) => s.id === idx);
    if (step) {
      set({ currentStepIdx: idx });
    }
  },

  getCurrentStep: () => {
    return WIZARD_STEPS.find((step) => step.id === get().currentStepIdx);
  },

  getCurrentFormPart: () => {
    const step = get().getCurrentStep();
    return step?.formPart;
  },

  goToNextStep: () => {
    set((state) => {
      const currentIdx = state.currentStepIdx;
      const currentStepIndex = WIZARD_STEPS.findIndex((step) => step.id === currentIdx);
      if (currentStepIndex >= 0 && currentStepIndex < WIZARD_STEPS.length - 1) {
        const nextStep = WIZARD_STEPS[currentStepIndex + 1];
        return { currentStepIdx: nextStep.id };
      }
      return state;
    });
  },

  goToPreviousStep: () => {
    set((state) => {
      const currentIdx = state.currentStepIdx;
      const currentStepIndex = WIZARD_STEPS.findIndex((step) => step.id === currentIdx);
      if (currentStepIndex > 0) {
        const prevStep = WIZARD_STEPS[currentStepIndex - 1];
        return { currentStepIdx: prevStep.id };
      }
      return state;
    });
  },

  markStepAsValidated: (step: FormPart) => {
    set((state) => {
      const newValidatedSteps = new Set(state.validatedSteps);
      newValidatedSteps.add(step);
      return { validatedSteps: newValidatedSteps };
    });
  },

  isStepValidated: (step: FormPart) => {
    return get().validatedSteps.has(step);
  },

  reset: () => {
    set({
      currentStepIdx: INITIAL_STEP_IDX,
      validatedSteps: new Set<FormPart>(),
    });
  },
}));

