import React from "react";
import { create } from "zustand";
import { Settings, Check } from "lucide-react";

export type EditWizardStep = {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const EDIT_WIZARD_STEPS: EditWizardStep[] = [
  { id: 1, label: "Edit Configuration", sublabel: "Modify pipeline settings", icon: Settings },
  { id: 2, label: "Review Changes", sublabel: "Review and apply", icon: Check },
];

interface EditWizardStore {
  currentStepIdx: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  reset: () => void;
}

export const useEditWizardStore = create<EditWizardStore>((set) => ({
  currentStepIdx: 1,
  goToNextStep: () =>
    set((state) => ({ currentStepIdx: Math.min(state.currentStepIdx + 1, EDIT_WIZARD_STEPS.length) })),
  goToPreviousStep: () => set((state) => ({ currentStepIdx: Math.max(state.currentStepIdx - 1, 1) })),
  reset: () => set({ currentStepIdx: 1 }),
}));
