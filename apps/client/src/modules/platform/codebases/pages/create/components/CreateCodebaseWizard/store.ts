import React from "react";
import { create } from "zustand";
import { FORM_PARTS, FormPart } from "./names";
import { Sparkles, GitBranch, Settings, Check } from "lucide-react";

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

// const steps: WizardStep[] = [
//   { number: 1, name: FORM_PARTS.METHOD, label: "Initial Setup", sublabel: "Choose creation method", icon: Sparkles },
//   {
//     number: 2,
//     name: FORM_PARTS.GIT_SETUP,
//     label: "Git & Project Info",
//     sublabel: "Configure repository and project",
//     icon: GitBranch,
//   },
//   {
//     number: 3,
//     name: FORM_PARTS.BUILD_CONFIG,
//     label: "Build Config",
//     sublabel: "Configure build settings",
//     icon: Settings,
//   },
//   { number: 4, name: FORM_PARTS.ADVANCED, label: "Review", sublabel: "Review and create", icon: Check },
// ];

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
    label: "Initial Setup",
    sublabel: "Choose creation method",
    icon: Sparkles,
    formPart: FORM_PARTS.METHOD,
  },
  {
    id: 2,
    label: "Git & Project Info",
    sublabel: "Configure repository and project",
    icon: GitBranch,
    formPart: FORM_PARTS.GIT_SETUP,
  },
  {
    id: 3,
    label: "Build Config",
    sublabel: "Configure build settings",
    icon: Settings,
    formPart: FORM_PARTS.BUILD_CONFIG,
  },
  {
    id: 4,
    label: "Review",
    sublabel: "Review and create",
    icon: Check,
  },
  {
    id: 5,
    label: "Success",
    sublabel: "Success",
    icon: Check,
  },
];

// Steps that can be navigated to (all steps except SUCCESS)
export const NAVIGABLE_STEP_IDXS = WIZARD_STEPS.filter((step) => step.id !== 5).map((step) => step.id);

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
